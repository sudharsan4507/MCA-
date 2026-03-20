import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { useDropzone } from 'react-dropzone';
import ResultCard from '../components/ResultCard';
import { analyzeAudio, analyzeUrl, validateUrl } from '../services/api';

/* ── Keyframes ───────────────────────────────────────────────────────────── */
const scanLine = keyframes`0%{left:-100%}100%{left:200%}`;
const spin      = keyframes`to{transform:rotate(360deg)}`;
const blink     = keyframes`0%,100%{opacity:1}50%{opacity:0.35}`;

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  padding: 88px 2rem 3rem;
  max-width: 920px;
  margin: 0 auto;
`;
const Title = styled.h1`
  font-size: 1.75rem; font-weight: 800; letter-spacing: -0.01em;
  color: var(--text-primary); margin-bottom: 0.35rem;
  span { color: var(--accent-cyan); }
`;
const Sub = styled.p`
  font-family: var(--font-mono); font-size: 0.73rem;
  color: var(--text-secondary); letter-spacing: 0.03em;
  margin-bottom: 1.75rem;
`;
const Sec = styled(motion.div)`margin-bottom: 1.25rem;`;
const SecLabel = styled.div`
  font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.15em;
  color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.65rem;
  display: flex; align-items: center; gap: 6px;
  &::before { content: '//'; color: var(--accent-cyan); }
`;

/* ── Mode Tabs ───────────────────────────────────────────────────────────── */
const TabBar = styled.div`
  display: flex; gap: 5px; padding: 5px;
  background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px;
  margin-bottom: 1.5rem;
`;
const Tab = styled(motion.button)`
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 10px 8px; border-radius: 9px; border: none; cursor: pointer;
  font-family: var(--font-display); font-size: 0.77rem; font-weight: 600; letter-spacing: 0.02em;
  transition: all 0.22s;
  background: ${p => p.$on ? 'linear-gradient(135deg,rgba(0,255,200,0.14),rgba(0,102,255,0.09))' : 'transparent'};
  color: ${p => p.$on ? 'var(--accent-cyan)' : 'var(--text-dim)'};
  border: 1px solid ${p => p.$on ? 'rgba(0,255,200,0.22)' : 'transparent'};
  box-shadow: ${p => p.$on ? '0 2px 14px rgba(0,255,200,0.07)' : 'none'};
  svg { width: 15px; height: 15px; flex-shrink: 0; }
  @media(max-width:520px) { font-size: 0.65rem; gap: 5px; }
`;

/* ── Drop Zone ───────────────────────────────────────────────────────────── */
const Zone = styled(motion.div)`
  position: relative; border: 2px dashed
    ${p => p.$active ? 'var(--accent-cyan)' : p.$bad ? 'var(--accent-red)' : 'rgba(0,255,200,0.18)'};
  border-radius: 16px; padding: 2.4rem 2rem; text-align: center; cursor: pointer;
  background: ${p => p.$active ? 'rgba(0,255,200,0.04)' : 'rgba(255,255,255,0.01)'};
  overflow: hidden; transition: all 0.28s;
  &:hover { border-color: rgba(0,255,200,0.34); background: rgba(0,255,200,0.025); }
`;
const Corner = styled.div`
  position: absolute; width: 13px; height: 13px;
  border-color: var(--accent-cyan); border-style: solid;
  opacity: ${p => p.$on ? 0.72 : 0.2}; transition: opacity 0.28s;
  ${p => p.$tl ? 'border-width:2px 0 0 2px;top:10px;left:10px;' : ''}
  ${p => p.$tr ? 'border-width:2px 2px 0 0;top:10px;right:10px;' : ''}
  ${p => p.$bl ? 'border-width:0 0 2px 2px;bottom:10px;left:10px;' : ''}
  ${p => p.$br ? 'border-width:0 2px 2px 0;bottom:10px;right:10px;' : ''}
`;
const Swipe = styled.div`
  position: absolute; top: 0; bottom: 0; width: 55px;
  background: linear-gradient(90deg,transparent,rgba(0,255,200,0.28),transparent);
  animation: ${scanLine} 2s linear infinite;
  animation-play-state: ${p => p.$on ? 'running' : 'paused'};
  opacity: ${p => p.$on ? 1 : 0};
`;
const ZoneTitle = styled.h3`font-size:0.98rem;font-weight:700;color:var(--text-primary);margin-bottom:0.35rem;`;
const ZoneSub   = styled.p`font-family:var(--font-mono);font-size:0.68rem;color:var(--text-secondary);line-height:1.6;`;
const Tags = styled.div`display:flex;flex-wrap:wrap;justify-content:center;gap:3px;margin-top:0.55rem;`;
const Tag  = styled.span`
  padding:2px 7px;border-radius:4px;
  background:rgba(0,255,200,0.07);border:1px solid rgba(0,255,200,0.14);
  font-family:var(--font-mono);font-size:0.58rem;color:var(--accent-cyan);
`;
const Hint = styled.p`
  font-family:var(--font-mono);font-size:0.58rem;color:var(--text-dim);margin-top:0.55rem;
`;

const FilePill = styled(motion.div)`
  display:flex;align-items:center;gap:9px;padding:9px 13px;
  background:rgba(0,255,200,0.05);border:1px solid rgba(0,255,200,0.17);border-radius:8px;margin-top:0.7rem;
`;
const FName = styled.span`font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-cyan);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
const FSize = styled.span`font-family:var(--font-mono);font-size:0.62rem;color:var(--text-secondary);`;
const XBtn  = styled.button`
  width:17px;height:17px;border-radius:50%;border:1px solid rgba(255,51,102,0.28);
  background:rgba(255,51,102,0.07);color:var(--accent-red);font-size:0.6rem;
  display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;
  transition:var(--transition);&:hover{background:rgba(255,51,102,0.18);}
`;

/* ── URL Input ───────────────────────────────────────────────────────────── */
const UrlBox = styled.div`display:flex;flex-direction:column;gap:0.7rem;`;
const UrlWrap = styled.div`
  display:flex;align-items:center;overflow:hidden;
  border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.02);
  transition:border-color 0.2s;&:focus-within{border-color:var(--border-bright);}
`;
const UrlPfx = styled.div`
  padding:0 13px;color:var(--text-dim);display:flex;align-items:center;
  border-right:1px solid var(--border);svg{width:15px;height:15px;}
`;
const UrlField = styled.input`
  flex:1;padding:13px 12px;background:transparent;border:none;outline:none;
  color:var(--text-primary);font-family:var(--font-mono);font-size:0.78rem;
  &::placeholder{color:var(--text-dim);}
`;
const UrlClear = styled.button`
  padding:0 11px;background:transparent;border:none;color:var(--text-dim);
  cursor:pointer;font-size:0.9rem;transition:color 0.2s;&:hover{color:var(--text-primary);}
`;
const ChipRow = styled.div`display:flex;gap:7px;flex-wrap:wrap;align-items:center;`;
const Chip = styled(motion.button)`
  display:flex;align-items:center;gap:6px;padding:6px 13px;border-radius:7px;
  border:1px solid var(--border);background:rgba(255,255,255,0.02);
  color:var(--text-secondary);font-family:var(--font-mono);font-size:0.67rem;cursor:pointer;
  transition:var(--transition);&:hover{border-color:var(--border-bright);color:var(--text-primary);}
  svg{width:13px;height:13px;}
`;
const InfoBox = styled.div`
  padding:9px 13px;border-radius:8px;background:rgba(255,255,255,0.02);
  border:1px solid var(--border);font-family:var(--font-mono);font-size:0.61rem;
  color:var(--text-dim);line-height:1.7;
  code{color:var(--accent-cyan);}strong{color:var(--text-secondary);}
`;

/* ── Preview card ────────────────────────────────────────────────────────── */
const Preview = styled(motion.div)`
  display:flex;align-items:flex-start;gap:11px;padding:13px;
  background:rgba(0,255,200,0.03);border:1px solid rgba(0,255,200,0.17);border-radius:10px;
`;
const Thumb = styled.img`width:80px;height:50px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;`;
const ThumbPH = styled.div`
  width:80px;height:50px;border-radius:6px;border:1px solid var(--border);
  background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;
  flex-shrink:0;color:var(--text-dim);svg{width:18px;height:18px;}
`;
const PInfo = styled.div`flex:1;min-width:0;`;
const PTitle = styled.div`font-size:0.82rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:4px;`;
const PMeta  = styled.div`font-family:var(--font-mono);font-size:0.61rem;color:var(--text-secondary);display:flex;gap:9px;flex-wrap:wrap;align-items:center;`;
const PBadge = styled.span`
  padding:2px 7px;border-radius:4px;font-family:var(--font-mono);font-size:0.58rem;
  background:${p=>p.$yt?'rgba(255,0,0,0.09)':'rgba(195,0,125,0.09)'};
  color:${p=>p.$yt?'#ff5555':'#e040fb'};
  border:1px solid ${p=>p.$yt?'rgba(255,0,0,0.22)':'rgba(195,0,125,0.22)'};
`;
const ErrPill = styled(motion.div)`
  display:flex;align-items:center;gap:7px;padding:9px 13px;border-radius:8px;
  font-family:var(--font-mono);font-size:0.68rem;
  background:rgba(255,51,102,0.07);border:1px solid rgba(255,51,102,0.2);color:var(--accent-red);
`;

/* ── Analyze Button ──────────────────────────────────────────────────────── */
const AnalyzeBtn = styled(motion.button)`
  width:100%;padding:15px;
  border:1px solid ${p=>p.$dis?'var(--border)':'var(--border-bright)'};
  border-radius:var(--radius);
  background:${p=>p.$dis?'rgba(255,255,255,0.02)':'linear-gradient(135deg,rgba(0,255,200,0.13),rgba(0,102,255,0.08))'};
  color:${p=>p.$dis?'var(--text-dim)':'var(--accent-cyan)'};
  font-family:var(--font-display);font-size:0.9rem;font-weight:700;letter-spacing:0.07em;
  display:flex;align-items:center;justify-content:center;gap:9px;
  cursor:${p=>p.$dis?'not-allowed':'pointer'};position:relative;overflow:hidden;transition:var(--transition);
  &:not(:disabled):hover{box-shadow:var(--glow-cyan);background:linear-gradient(135deg,rgba(0,255,200,0.2),rgba(0,102,255,0.12));}
`;
const ScanFx = styled.div`
  position:absolute;top:0;bottom:0;width:65px;
  background:linear-gradient(90deg,transparent,rgba(0,255,200,0.32),transparent);
  animation:${scanLine} 1.8s linear infinite;
`;
const Spinner = styled.div`
  width:17px;height:17px;border:2px solid rgba(0,255,200,0.18);
  border-top-color:var(--accent-cyan);border-radius:50%;
  animation:${spin} 0.9s linear infinite;
`;
const ErrMsg = styled(motion.div)`
  display:flex;align-items:flex-start;gap:8px;padding:11px 14px;border-radius:8px;
  font-family:var(--font-mono);font-size:0.7rem;margin-top:0.7rem;
  background:rgba(255,51,102,0.07);border:1px solid rgba(255,51,102,0.22);color:var(--accent-red);
  line-height:1.5;
`;

/* ── Progress ────────────────────────────────────────────────────────────── */
const ProgWrap = styled.div`margin:0.65rem 0;`;
const ProgTop  = styled.div`
  display:flex;justify-content:space-between;margin-bottom:5px;
  font-family:var(--font-mono);font-size:0.62rem;color:var(--text-secondary);
`;
const Track = styled.div`height:3px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;`;
const Fill  = styled(motion.div)`height:100%;background:linear-gradient(90deg,var(--accent-cyan),var(--accent-blue));border-radius:3px;`;

/* ── Steps ───────────────────────────────────────────────────────────────── */
const Steps  = styled.div`display:flex;flex-direction:column;gap:4px;`;
const SRow   = styled(motion.div)`
  display:flex;align-items:center;gap:8px;padding:6px 11px;border-radius:8px;
  background:${p=>p.$a?'rgba(0,255,200,0.06)':'rgba(255,255,255,0.01)'};
  border:1px solid ${p=>p.$a?'rgba(0,255,200,0.2)':'var(--border)'};
`;
const Dot    = styled.div`
  width:5px;height:5px;border-radius:50%;flex-shrink:0;transition:all 0.28s;
  background:${p=>p.$done?'var(--success)':p.$a?'var(--accent-cyan)':'var(--border)'};
  box-shadow:${p=>p.$a?'0 0 6px var(--accent-cyan)':'none'};
  animation:${p=>p.$a?blink:'none'} 1.2s ease infinite;
`;
const SLabel = styled.span`
  font-family:var(--font-mono);font-size:0.62rem;transition:color 0.28s;
  color:${p=>p.$done?'var(--success)':p.$a?'var(--text-primary)':'var(--text-dim)'};
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtBytes = b => b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`;
const fmtDur   = s => s?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:null;

const AUDIO_ACCEPT = {'audio/*':['.wav','.mp3','.flac','.ogg','.m4a']};
const VIDEO_ACCEPT = {'video/*':['.mp4','.avi','.mov','.mkv','.webm','.flv','.wmv','.m4v']};

const STEPS_AUDIO = ['Uploading audio file','Extracting waveform features','Running Wav2Vec2 embeddings','Classifying voice pattern','Generating report'];
const STEPS_VIDEO = ['Uploading video file','Extracting audio track','Running Wav2Vec2 embeddings','Classifying voice pattern','Generating report'];
const STEPS_URL   = ['Validating URL','Connecting to platform','Downloading audio stream','Running Wav2Vec2 embeddings','Classifying voice pattern','Generating report'];

/* ── Tiny SVG icons ──────────────────────────────────────────────────────── */
const IconAudio = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>;
const IconVideo = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>;
const IconLink  = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>;
const IconYT    = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>;
const IconIG    = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7C23.7 15.7 24 15.3 24 12c0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg>;

/* ══════════════════════════════════════════════════════════════════════════ */

export default function UploadPage() {
  const [mode, setMode]         = useState('audio');
  const [file, setFile]         = useState(null);
  const [url, setUrl]           = useState('');
  const [preview, setPreview]   = useState(null);
  const [urlErr, setUrlErr]     = useState('');
  const [validating, setVal]    = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [uploadPct, setUploadPct] = useState(0);
  const [activeStep, setAStep]  = useState(-1);
  const resultRef = useRef(null);
  const valTimer  = useRef(null);

  const steps = mode === 'url' ? STEPS_URL : mode === 'video' ? STEPS_VIDEO : STEPS_AUDIO;

  /* ── Dropzone ── */
  const accept = mode === 'audio' ? AUDIO_ACCEPT : mode === 'video' ? VIDEO_ACCEPT : {};
  const onDrop = useCallback((ok) => {
    if (ok[0]) { setFile(ok[0]); setResult(null); setError(''); }
  }, []);
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, accept, maxFiles: 1, maxSize: 200 * 1024 * 1024, disabled: mode === 'url',
  });

  /* ── URL debounced validate ── */
  const handleUrlChange = (v) => {
    setUrl(v); setPreview(null); setUrlErr(''); setResult(null);
    clearTimeout(valTimer.current);
    if (!v.trim() || v.trim().length < 15) return;
    valTimer.current = setTimeout(() => doValidate(v.trim()), 750);
  };

  const doValidate = async (u) => {
    setVal(true);
    try {
      const d = await validateUrl(u);
      if (d.valid) { setPreview(d); setUrlErr(''); }
      else { setUrlErr(d.error || 'Invalid or unsupported URL'); setPreview(null); }
    } catch { setUrlErr('Could not reach backend to validate URL'); }
    finally { setVal(false); }
  };

  /* ── Switch mode ── */
  const switchMode = (m) => {
    setMode(m); setFile(null); setUrl(''); setPreview(null);
    setUrlErr(''); setResult(null); setError(''); setAStep(-1);
  };

  /* ── Analysis ── */
  const analyze = async () => {
    if (mode !== 'url' && !file) return;
    if (mode === 'url' && !url.trim()) return;
    setLoading(true); setError(''); setResult(null); setUploadPct(0); setAStep(0);

    steps.forEach((_, i) => {
      setTimeout(() => setAStep(i), 400 + i * 720);
    });

    try {
      let data;
      if (mode === 'url') {
        data = await analyzeUrl(url.trim());
      } else {
        data = await analyzeAudio(file, (e) => {
          if (e.total) setUploadPct(Math.round(e.loaded / e.total * 100));
        });
      }
      setAStep(steps.length);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please try again.');
      setAStep(-1);
    } finally {
      setLoading(false); setUploadPct(0);
    }
  };

  const canAnalyze = !loading && (
    (mode !== 'url' && !!file) ||
    (mode === 'url' && !!url.trim() && !urlErr && !validating)
  );

  const btnLabel = loading ? 'Analyzing…'
    : mode === 'url'   ? (url ? 'Analyze URL' : 'Paste a URL above')
    : mode === 'video' ? (file ? 'Extract & Analyze Audio' : 'Select a Video File')
    : (file ? 'Run Deepfake Detection' : 'Select an Audio File');

  const sm = result?.source_meta;

  return (
    <Page>
      <Title>Voice <span>Analysis</span></Title>
      <Sub>Detect AI-generated speech — upload a file, drop a video, or paste a social media link</Sub>

      {/* Mode tabs */}
      <TabBar>
        {[
          { id: 'audio', label: 'Audio File',            Icon: IconAudio },
          { id: 'video', label: 'Video File',            Icon: IconVideo },
          { id: 'url',   label: 'YouTube / Instagram',   Icon: IconLink  },
        ].map(({ id, label, Icon }) => (
          <Tab key={id} $on={mode === id} onClick={() => switchMode(id)} whileTap={{ scale: 0.97 }}>
            <Icon />{label}
          </Tab>
        ))}
      </TabBar>

      {/* Input panel */}
      <AnimatePresence mode="wait">
        {mode !== 'url' ? (
          /* ── File drop zone ── */
          <Sec key="file"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
          >
            <SecLabel>{mode === 'video' ? 'video upload' : 'audio upload'}</SecLabel>
            <Zone {...getRootProps()} $active={isDragActive} $bad={isDragReject}
              animate={isDragActive ? { scale: 1.01 } : { scale: 1 }} transition={{ duration: 0.14 }}
            >
              <input {...getInputProps()} />
              <Corner $tl $on={isDragActive}/><Corner $tr $on={isDragActive}/>
              <Corner $bl $on={isDragActive}/><Corner $br $on={isDragActive}/>
              <Swipe $on={isDragActive}/>

              <motion.div style={{ marginBottom: '0.7rem' }}
                animate={isDragActive ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {mode === 'video'
                  ? <svg width="38" height="38" viewBox="0 0 24 24" fill="rgba(0,255,200,0.45)"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                  : <svg width="38" height="38" viewBox="0 0 24 24" fill="rgba(0,255,200,0.45)"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                }
              </motion.div>

              <AnimatePresence mode="wait">
                {isDragActive ? (
                  <motion.div key="drag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ZoneTitle style={{ color: 'var(--accent-cyan)' }}>Release to Analyze</ZoneTitle>
                    <ZoneSub>Drop to start processing</ZoneSub>
                  </motion.div>
                ) : isDragReject ? (
                  <motion.div key="bad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ZoneTitle style={{ color: 'var(--accent-red)' }}>Wrong File Type</ZoneTitle>
                    <ZoneSub>Please drop a valid {mode === 'video' ? 'video' : 'audio'} file</ZoneSub>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ZoneTitle>Upload {mode === 'video' ? 'Video' : 'Audio'} File</ZoneTitle>
                    <ZoneSub>Drag &amp; drop or click to select from your device</ZoneSub>
                    <Tags>
                      {(mode === 'video'
                        ? ['MP4','AVI','MOV','MKV','WEBM','FLV','WMV']
                        : ['WAV','MP3','FLAC','OGG','M4A']
                      ).map(e => <Tag key={e}>.{e.toLowerCase()}</Tag>)}
                    </Tags>
                    <Hint>
                      {mode === 'video'
                        ? 'Max 200 MB · Audio extracted automatically from any video'
                        : 'Max 50 MB · Mono or Stereo accepted'}
                    </Hint>
                  </motion.div>
                )}
              </AnimatePresence>
            </Zone>

            <AnimatePresence>
              {file && (
                <FilePill initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center' }}>
                    {mode === 'video' ? <IconVideo /> : <IconAudio />}
                  </div>
                  <FName title={file.name}>{file.name}</FName>
                  <FSize>{fmtBytes(file.size)}</FSize>
                  <XBtn onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}>✕</XBtn>
                </FilePill>
              )}
            </AnimatePresence>
          </Sec>
        ) : (
          /* ── URL input ── */
          <Sec key="url"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
          >
            <SecLabel>youtube / instagram url</SecLabel>
            <UrlBox>
              <UrlWrap>
                <UrlPfx><IconLink /></UrlPfx>
                <UrlField
                  placeholder="Paste YouTube or Instagram link here…"
                  value={url}
                  onChange={e => handleUrlChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canAnalyze && analyze()}
                />
                {validating && (
                  <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                    <Spinner style={{ width: '14px', height: '14px' }} />
                  </div>
                )}
                {url && !validating && (
                  <UrlClear onClick={() => { setUrl(''); setPreview(null); setUrlErr(''); setResult(null); }}>✕</UrlClear>
                )}
              </UrlWrap>

              {/* Quick-fill example chips */}
              <ChipRow>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.59rem', color: 'var(--text-dim)' }}>
                  Try:
                </span>
                <Chip whileTap={{ scale: 0.96 }}
                  onClick={() => handleUrlChange('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}>
                  <span style={{ color: '#ff5555' }}><IconYT /></span> YouTube Video
                </Chip>
                <Chip whileTap={{ scale: 0.96 }}
                  onClick={() => handleUrlChange('https://youtube.com/shorts/5qap5aO4i9A')}>
                  <span style={{ color: '#ff5555' }}><IconYT /></span> YouTube Short
                </Chip>
                <Chip whileTap={{ scale: 0.96 }}
                  onClick={() => handleUrlChange('https://www.instagram.com/reel/C1234567890/')}>
                  <span style={{ color: '#e040fb' }}><IconIG /></span> Instagram Reel
                </Chip>
              </ChipRow>

              {/* URL Preview */}
              <AnimatePresence>
                {preview && (
                  <Preview initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {preview.thumbnail
                      ? <Thumb src={preview.thumbnail} alt="thumb" onError={e => e.target.style.display = 'none'} />
                      : <ThumbPH><IconLink /></ThumbPH>}
                    <PInfo>
                      <PTitle>{preview.title || 'Unknown title'}</PTitle>
                      <PMeta>
                        <PBadge $yt={preview.url_type === 'youtube'}>
                          {preview.url_type === 'youtube' ? '▶ YouTube' : '◈ Instagram'}
                        </PBadge>
                        {preview.uploader && <span>{preview.uploader}</span>}
                        {preview.duration  && <span>⏱ {fmtDur(preview.duration)}</span>}
                        <span style={{ color: 'var(--success)' }}>✓ Ready</span>
                      </PMeta>
                    </PInfo>
                  </Preview>
                )}
                {urlErr && (
                  <ErrPill initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {urlErr}
                  </ErrPill>
                )}
              </AnimatePresence>

              <InfoBox>
                <strong>Supported:</strong> YouTube videos, Shorts · Instagram Reels, Posts, TV<br />
                <strong>Limits:</strong> Max 10 minutes · Public content only<br />
                <strong>Requires:</strong> <code>pip install yt-dlp</code> on the backend server
              </InfoBox>
            </UrlBox>
          </Sec>
        )}
      </AnimatePresence>

      {/* Analyze button */}
      <Sec initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
        <AnalyzeBtn $dis={!canAnalyze} disabled={!canAnalyze}
          onClick={analyze} whileTap={canAnalyze ? { scale: 0.99 } : {}}
        >
          {loading && <ScanFx />}
          {loading ? <><Spinner />{btnLabel}</> : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              {btnLabel}
            </>
          )}
        </AnalyzeBtn>

        {loading && (
          <ProgWrap>
            <ProgTop>
              <span>{steps[Math.min(activeStep, steps.length - 1)] || 'Initializing…'}</span>
              <span>{uploadPct > 0 ? `${uploadPct}%` : ''}</span>
            </ProgTop>
            <Track>
              <Fill
                initial={{ width: 0 }}
                animate={{ width: `${uploadPct || Math.min(((activeStep + 1) / steps.length) * 88, 88)}%` }}
                transition={{ duration: 0.5 }}
              />
            </Track>
          </ProgWrap>
        )}

        <AnimatePresence>
          {error && (
            <ErrMsg initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: '1px' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </ErrMsg>
          )}
        </AnimatePresence>
      </Sec>

      {/* Pipeline steps */}
      <AnimatePresence>
        {(loading || activeStep >= 0) && !result && (
          <Sec key="steps"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.28 }}
          >
            <SecLabel>analysis pipeline</SecLabel>
            <Steps>
              {steps.map((s, i) => (
                <SRow key={s} $a={i === activeStep}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                >
                  <Dot $done={i < activeStep} $a={i === activeStep} />
                  <SLabel $done={i < activeStep} $a={i === activeStep}>
                    {i < activeStep ? '✓ ' : ''}{s}
                  </SLabel>
                </SRow>
              ))}
            </Steps>
          </Sec>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <Sec key="result" ref={resultRef}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.42 }}
          >
            <SecLabel>detection result</SecLabel>

            {/* Source attribution for URL / video */}
            {sm && sm.source_type !== 'file_upload' && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                  fontFamily: 'var(--font-mono)', fontSize: '0.64rem',
                  color: 'var(--text-secondary)', marginBottom: '0.75rem' }}
              >
                {sm.source_type === 'youtube'    && <span style={{ color: '#ff5555', display:'flex',alignItems:'center',gap:'4px' }}><IconYT /> YouTube</span>}
                {sm.source_type === 'instagram'  && <span style={{ color: '#e040fb', display:'flex',alignItems:'center',gap:'4px' }}><IconIG /> Instagram</span>}
                {sm.source_type === 'video_file' && <span style={{ color: 'var(--accent-blue)', display:'flex',alignItems:'center',gap:'4px' }}><IconVideo /> Video File</span>}
                {sm.title    && <span>— {sm.title}</span>}
                {sm.uploader && <span style={{ color: 'var(--text-dim)' }}>by {sm.uploader}</span>}
                {sm.duration && <span style={{ color: 'var(--text-dim)' }}>⏱ {fmtDur(sm.duration)}</span>}
              </motion.div>
            )}

            <ResultCard result={result} audioFile={mode !== 'url' ? file : null} />
          </Sec>
        )}
      </AnimatePresence>
    </Page>
  );
}
