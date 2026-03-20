"""
media_extractor.py
==================
Handles extraction of audio from:
  1. Video files (MP4, AVI, MOV, MKV, WEBM)
  2. YouTube URLs
  3. Instagram URLs

Dependencies (install as needed):
  pip install moviepy yt-dlp pydub
"""

import os
import uuid
import tempfile
import re
import time
from pathlib import Path
from typing import Optional, Tuple
import warnings
warnings.filterwarnings("ignore")


# ── URL Pattern Detection ──────────────────────────────────────────────────

YOUTUBE_PATTERNS = [
    r"(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([\w-]+)",
    r"(?:https?://)?(?:www\.)?youtu\.be/([\w-]+)",
    r"(?:https?://)?(?:www\.)?youtube\.com/shorts/([\w-]+)",
    r"(?:https?://)?(?:m\.)?youtube\.com/watch\?v=([\w-]+)",
]

INSTAGRAM_PATTERNS = [
    r"(?:https?://)?(?:www\.)?instagram\.com/(?:p|reel|tv)/([\w-]+)",
    r"(?:https?://)?(?:www\.)?instagram\.com/reels/([\w-]+)",
]

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"}


def detect_url_type(url: str) -> str:
    """Returns 'youtube', 'instagram', or 'unknown'."""
    for pattern in YOUTUBE_PATTERNS:
        if re.search(pattern, url, re.IGNORECASE):
            return "youtube"
    for pattern in INSTAGRAM_PATTERNS:
        if re.search(pattern, url, re.IGNORECASE):
            return "instagram"
    return "unknown"


def is_video_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in VIDEO_EXTENSIONS


# ── Audio Extraction from Video File ──────────────────────────────────────

def extract_audio_from_video(video_path: str, output_dir: str) -> Tuple[str, dict]:
    """
    Extract audio track from a video file.
    Returns (wav_path, metadata_dict)
    """
    output_path = str(Path(output_dir) / f"{uuid.uuid4()}.wav")
    metadata = {
        "source_type": "video_file",
        "original_file": Path(video_path).name,
    }

    # Try moviepy first
    try:
        from moviepy.editor import VideoFileClip
        clip = VideoFileClip(video_path)
        if clip.audio is None:
            clip.close()
            raise ValueError("Video has no audio track")

        clip.audio.write_audiofile(
            output_path,
            fps=16000,
            nbytes=2,
            codec="pcm_s16le",
            logger=None,
        )
        duration = clip.duration
        clip.close()

        metadata.update({
            "video_duration": round(duration, 2),
            "extraction_method": "moviepy",
        })
        return output_path, metadata

    except ImportError:
        pass  # fall through to ffmpeg

    # Try ffmpeg directly
    try:
        import subprocess
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", video_path,
                "-vn",                  # no video
                "-acodec", "pcm_s16le", # WAV codec
                "-ar", "16000",         # 16kHz sample rate
                "-ac", "1",             # mono
                output_path,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg error: {result.stderr[:200]}")

        metadata.update({"extraction_method": "ffmpeg"})
        return output_path, metadata

    except FileNotFoundError:
        pass  # ffmpeg not installed

    # Try pydub as last resort
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(video_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_path, format="wav")
        metadata.update({
            "video_duration": round(len(audio) / 1000, 2),
            "extraction_method": "pydub",
        })
        return output_path, metadata

    except ImportError:
        pass

    raise RuntimeError(
        "No video processing library available. "
        "Install one of: moviepy, ffmpeg, or pydub\n"
        "  pip install moviepy\n"
        "  pip install pydub"
    )


# ── Audio Download from URL ────────────────────────────────────────────────

class DownloadProgress:
    """Tracks yt-dlp download progress."""
    def __init__(self):
        self.pct = 0
        self.speed = ""
        self.eta = ""
        self.filename = ""

    def hook(self, d):
        if d["status"] == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 1
            downloaded = d.get("downloaded_bytes", 0)
            self.pct = int(downloaded / total * 100)
            self.speed = d.get("speed_str", "")
            self.eta = d.get("eta_str", "")
        elif d["status"] == "finished":
            self.pct = 100
            self.filename = d.get("filename", "")


def download_audio_from_url(url: str, output_dir: str) -> Tuple[str, dict]:
    """
    Download audio from YouTube or Instagram URL using yt-dlp.
    Returns (wav_path, metadata_dict)
    """
    url_type = detect_url_type(url)
    output_template = str(Path(output_dir) / f"{uuid.uuid4()}.%(ext)s")
    progress = DownloadProgress()

    metadata = {
        "source_type": url_type,
        "source_url": url,
    }

    try:
        import yt_dlp  # noqa
    except ImportError:
        raise RuntimeError(
            "yt-dlp is required for URL analysis.\n"
            "Install it with: pip install yt-dlp"
        )

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [progress.hook],
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
            "preferredquality": "0",
        }],
        "postprocessor_args": [
            "-ar", "16000",
            "-ac", "1",
        ],
        # Respect platform limits — download max 10 minutes
        "match_filter": _duration_limit(600),
        # Instagram-specific
        "cookiefile": None,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        },
    }

    # Instagram sometimes needs different options
    if url_type == "instagram":
        ydl_opts.update({
            "format": "bestaudio/best",
            "extract_flat": False,
        })

    try:
        with __import__("yt_dlp").YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

            if info:
                metadata.update({
                    "title": info.get("title", "Unknown"),
                    "uploader": info.get("uploader", "Unknown"),
                    "duration": info.get("duration"),
                    "view_count": info.get("view_count"),
                    "platform": url_type.capitalize(),
                    "video_id": info.get("id", ""),
                    "thumbnail": info.get("thumbnail", ""),
                    "description": (info.get("description") or "")[:200],
                })

    except Exception as e:
        err_str = str(e)
        if "private" in err_str.lower() or "login" in err_str.lower():
            raise RuntimeError(
                f"This {url_type.capitalize()} content is private or requires login. "
                "Please use a public video/reel."
            )
        elif "not available" in err_str.lower() or "unavailable" in err_str.lower():
            raise RuntimeError(
                f"Content not available: {err_str[:150]}"
            )
        elif "duration" in err_str.lower():
            raise RuntimeError("Video is too long (max 10 minutes for analysis).")
        else:
            raise RuntimeError(f"Download failed: {err_str[:200]}")

    # Find the output WAV file
    wav_path = _find_output_file(output_dir, output_template, ".wav")
    if not wav_path:
        raise RuntimeError("Download completed but audio file not found.")

    return wav_path, metadata


def _duration_limit(max_seconds: int):
    """yt-dlp match_filter to block very long videos."""
    def _filter(info, *, incomplete=False):
        duration = info.get("duration")
        if duration and duration > max_seconds:
            return f"Video is too long ({duration}s > {max_seconds}s limit)"
        return None
    return _filter


def _find_output_file(directory: str, template: str, ext: str) -> Optional[str]:
    """Find the downloaded file in the output directory."""
    # yt-dlp replaces %(ext)s with actual extension
    base = Path(template).stem.replace(".%(ext)s", "")
    output_dir = Path(directory)

    # Check exact name first
    exact = output_dir / f"{base}{ext}"
    if exact.exists():
        return str(exact)

    # Search by modification time (most recently created)
    candidates = sorted(
        output_dir.glob(f"*{ext}"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if candidates:
        return str(candidates[0])

    return None


# ── Metadata enrichment ────────────────────────────────────────────────────

def get_video_thumbnail_url(url: str) -> Optional[str]:
    """Quick thumbnail fetch without full download."""
    url_type = detect_url_type(url)

    # YouTube thumbnails are deterministic
    for pattern in YOUTUBE_PATTERNS:
        m = re.search(pattern, url, re.IGNORECASE)
        if m:
            vid_id = m.group(1)
            return f"https://img.youtube.com/vi/{vid_id}/maxresdefault.jpg"

    return None
