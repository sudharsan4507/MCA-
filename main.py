"""
Deepfake Voice Detection API  v2.0
FastAPI backend — now supports:
  - Audio file upload  (WAV, MP3, FLAC, OGG, M4A)
  - Video file upload  (MP4, AVI, MOV, MKV, WEBM)
  - YouTube URL analysis
  - Instagram URL analysis
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
import uvicorn, os, uuid, time, re
from pathlib import Path

from feature_extractor import FeatureExtractor
from predict import Predictor
from history_manager import HistoryManager
from media_extractor import (
    extract_audio_from_video, download_audio_from_url,
    is_video_file, detect_url_type, get_video_thumbnail_url,
    VIDEO_EXTENSIONS,
)

app = FastAPI(title="Deepfake Voice Detection API", version="2.0.0")

import os as _os

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://deepfake-audio-detector-taupe.vercel.app",
]
_extra = _os.environ.get("FRONTEND_URL", "")
if _extra and _extra not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(_extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads"); UPLOAD_DIR.mkdir(exist_ok=True)
extractor = FeatureExtractor()
predictor = Predictor()
history   = HistoryManager()

AUDIO_EXTENSIONS = {".wav",".mp3",".flac",".ogg",".m4a",".aac",".wma"}
ALL_ALLOWED_EXTS = AUDIO_EXTENSIONS | VIDEO_EXTENSIONS
AUDIO_MIME = {"audio/wav","audio/mpeg","audio/mp3","audio/flac","audio/ogg",
              "audio/x-wav","audio/wave","audio/mp4","audio/x-m4a","audio/aac"}
VIDEO_MIME  = {"video/mp4","video/avi","video/quicktime","video/x-msvideo",
               "video/x-matroska","video/webm","video/x-flv","video/x-ms-wmv"}
ALL_MIME    = AUDIO_MIME | VIDEO_MIME | {"application/octet-stream"}

class URLRequest(BaseModel):
    url: str
    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        v = v.strip()
        if not v.startswith(("http://","https://")):
            v = "https://" + v
        allowed = ["youtube.com","youtu.be","m.youtube.com","instagram.com","www.instagram.com"]
        from urllib.parse import urlparse
        host = urlparse(v).netloc.lower().lstrip("www.")
        if not any(host.endswith(d) for d in allowed):
            raise ValueError(f"Unsupported domain '{host}'. Only YouTube and Instagram are supported.")
        return v

def _cleanup(*paths):
    for p in paths:
        try:
            if p and Path(p).exists(): os.remove(p)
        except: pass

def _get_risk_level(confidence, prediction):
    if prediction == "Real":
        return "low" if confidence > 0.85 else "medium" if confidence > 0.65 else "high"
    return "critical" if confidence > 0.85 else "high" if confidence > 0.65 else "medium"

async def _run_analysis(audio_path, label, source_meta):
    file_id = str(uuid.uuid4())
    t0 = time.time()
    features, audio_info = extractor.extract(audio_path)
    prediction, confidence, probabilities = predictor.predict(features)
    processing_time = round(time.time() - t0, 3)
    audio_info.update({k:v for k,v in source_meta.items() if k not in audio_info})
    result = {
        "id": file_id, "filename": label,
        "prediction": prediction,
        "confidence": round(float(confidence), 4),
        "probabilities": {
            "real": round(float(probabilities.get("real",0)),4),
            "deepfake": round(float(probabilities.get("deepfake",0)),4),
        },
        "audio_info": audio_info,
        "processing_time": processing_time,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "risk_level": _get_risk_level(confidence, prediction),
        "source_meta": source_meta,
    }
    history.add(result)
    return result

@app.get("/")
async def root():
    return {"message":"Deepfake Voice Detection API","status":"running","version":"2.0.0"}

@app.get("/health")
async def health():
    return {"status":"healthy","model_loaded":predictor.is_loaded(),"version":"2.0.0"}

@app.post("/predict")
async def predict_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    file_ext = Path(file.filename or "").suffix.lower()
    if file.content_type not in ALL_MIME and file_ext not in ALL_ALLOWED_EXTS:
        raise HTTPException(400, f"Unsupported file type '{file.content_type}'. Upload audio or video.")
    
    file_id   = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{file_id}{file_ext}"
    extracted_audio = None

    try:
        content = await file.read()
        if len(content) > 200*1024*1024:
            raise HTTPException(400, "File too large. Max 200 MB.")
        with open(save_path,"wb") as fh: fh.write(content)

        source_meta = {"source_type":"file_upload"}
        audio_path  = str(save_path)
        _is_video   = file_ext in VIDEO_EXTENSIONS or file.content_type in VIDEO_MIME

        if _is_video:
            source_meta["source_type"] = "video_file"
            source_meta["original_file"] = file.filename
            try:
                extracted_audio, video_meta = extract_audio_from_video(str(save_path), str(UPLOAD_DIR))
                audio_path = extracted_audio
                source_meta.update(video_meta)
            except Exception as e:
                raise HTTPException(422, f"Could not extract audio from video: {e}")

        result = await _run_analysis(audio_path, file.filename or "upload", source_meta)
        return JSONResponse(content=result)
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, f"Analysis failed: {e}")
    finally: background_tasks.add_task(_cleanup, str(save_path), extracted_audio)

@app.post("/predict/url")
async def predict_url(background_tasks: BackgroundTasks, req: URLRequest):
    url_type = detect_url_type(req.url)
    if url_type == "unknown":
        raise HTTPException(400, "Only YouTube and Instagram URLs are supported.")
    downloaded_audio = None
    try:
        try:
            downloaded_audio, url_meta = download_audio_from_url(req.url, str(UPLOAD_DIR))
        except RuntimeError as e:
            raise HTTPException(422, str(e))
        label  = url_meta.get("title", url_type.capitalize() + " Audio")
        result = await _run_analysis(downloaded_audio, label, url_meta)
        return JSONResponse(content=result)
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, f"URL analysis failed: {e}")
    finally: background_tasks.add_task(_cleanup, downloaded_audio)

@app.get("/validate-url")
async def validate_url(url: str):
    url = url.strip()
    if not url.startswith(("http://","https://")): url = "https://"+url
    url_type = detect_url_type(url)
    if url_type == "unknown":
        return {"valid":False,"error":"Only YouTube and Instagram URLs are supported.","url_type":"unknown"}
    thumbnail = get_video_thumbnail_url(url)
    try:
        import yt_dlp
        ydl_opts = {"quiet":True,"no_warnings":True,"skip_download":True,
                    "http_headers":{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        duration = info.get("duration")
        if duration and duration > 600:
            return {"valid":False,"error":f"Too long ({duration//60}m {duration%60}s). Max 10 min.",
                    "url_type":url_type,"thumbnail":info.get("thumbnail") or thumbnail,"duration":duration}
        return {"valid":True,"url_type":url_type,"title":info.get("title","Unknown"),
                "uploader":info.get("uploader","Unknown"),"duration":duration,
                "thumbnail":info.get("thumbnail") or thumbnail,"platform":url_type.capitalize()}
    except ImportError:
        return {"valid":True,"url_type":url_type,"title":None,"thumbnail":thumbnail,
                "platform":url_type.capitalize(),
                "warning":"Install yt-dlp for full support: pip install yt-dlp"}
    except Exception as e:
        err = str(e)
        if "private" in err.lower() or "login" in err.lower():
            return {"valid":False,"error":"Content is private or requires login.","url_type":url_type,"thumbnail":thumbnail}
        return {"valid":False,"error":f"Could not fetch URL info: {err[:150]}","url_type":url_type,"thumbnail":thumbnail}

@app.get("/history")
async def get_history(limit: int = 20, offset: int = 0):
    records = history.get_all()
    return {"total":len(records),"offset":offset,"limit":limit,"results":records[offset:offset+limit]}

@app.get("/history/{record_id}")
async def get_history_item(record_id: str):
    r = history.get_by_id(record_id)
    if not r: raise HTTPException(404,"Record not found")
    return r

@app.delete("/history/{record_id}")
async def delete_history_item(record_id: str):
    if not history.delete(record_id): raise HTTPException(404,"Record not found")
    return {"message":"Record deleted successfully"}

@app.get("/stats")
async def get_stats():
    records = history.get_all(); total = len(records)
    if total == 0:
        return {"total_analyzed":0,"deepfakes_detected":0,"real_voices":0,"detection_rate":0,"avg_confidence":0,"by_source":{}}
    deepfakes = sum(1 for r in records if r["prediction"]=="Deepfake")
    avg_conf  = sum(r["confidence"] for r in records)/total
    by_source = {}
    for r in records:
        st = r.get("source_meta",{}).get("source_type","file_upload")
        by_source[st] = by_source.get(st,0)+1
    return {"total_analyzed":total,"deepfakes_detected":deepfakes,"real_voices":total-deepfakes,
            "detection_rate":round(deepfakes/total*100,1),"avg_confidence":round(avg_conf*100,1),"by_source":by_source}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
