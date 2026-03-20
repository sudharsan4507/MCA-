import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const Container = styled.div`
  background: rgba(0, 255, 200, 0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  overflow: hidden;
`;

const WaveContainer = styled.div`
  #waveform {
    border-radius: 8px;
    overflow: hidden;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const PlayBtn = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border-bright);
  background: rgba(0, 255, 200, 0.1);
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 255, 200, 0.2);
    box-shadow: var(--glow-cyan);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const TimeDisplay = styled.div`
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-secondary);
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const TimeBar = styled.div`
  flex: 1;
  height: 2px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
`;

const TimeProgress = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
  border-radius: 2px;
`;

const ZoomBtns = styled.div`
  display: flex;
  gap: 4px;
  margin-left: auto;
`;

const ZoomBtn = styled.button`
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    color: var(--accent-cyan);
    border-color: var(--border-bright);
  }
`;

const Label = styled.div`
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
`;

export default function WaveformPlayer({ audioFile, prediction }) {
  const waveRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(50);
  const [loaded, setLoaded] = useState(false);

  const waveColor = prediction === 'Deepfake'
    ? 'rgba(255, 51, 102, 0.5)'
    : prediction === 'Real'
    ? 'rgba(0, 255, 200, 0.5)'
    : 'rgba(0, 102, 255, 0.5)';

  const progressColor = prediction === 'Deepfake'
    ? '#ff3366'
    : prediction === 'Real'
    ? '#00ffc8'
    : '#0066ff';

  useEffect(() => {
    if (!audioFile || !waveRef.current) return;

    const initWaveSurfer = async () => {
      try {
        const WaveSurfer = (await import('wavesurfer.js')).default;

        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        const ws = WaveSurfer.create({
          container: waveRef.current,
          waveColor,
          progressColor,
          cursorColor: 'rgba(255,255,255,0.5)',
          cursorWidth: 1,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 80,
          normalize: true,
          interact: true,
          hideScrollbar: true,
          fillParent: true,
        });

        ws.on('ready', () => {
          setDuration(ws.getDuration());
          setLoaded(true);
        });

        ws.on('audioprocess', () => {
          setCurrentTime(ws.getCurrentTime());
        });

        ws.on('play', () => setPlaying(true));
        ws.on('pause', () => setPlaying(false));
        ws.on('finish', () => {
          setPlaying(false);
          setCurrentTime(0);
        });

        const audioUrl = URL.createObjectURL(audioFile);
        ws.load(audioUrl);
        wavesurferRef.current = ws;

        return () => URL.revokeObjectURL(audioUrl);
      } catch (err) {
        console.warn('WaveSurfer not available:', err);
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
        setLoaded(false);
        setPlaying(false);
        setCurrentTime(0);
      }
    };
  }, [progressColor, waveColor,audioFile]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleZoom = (direction) => {
    const newZoom = direction === 'in' ? Math.min(zoom + 20, 200) : Math.max(zoom - 20, 10);
    setZoom(newZoom);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newZoom);
    }
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Container>
      <Label>audio waveform</Label>
      <WaveContainer>
        <div ref={waveRef} />
        {!loaded && (
          <div style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-dim)',
          }}>
            Loading waveform...
          </div>
        )}
      </WaveContainer>

      <Controls>
        <PlayBtn
          onClick={togglePlay}
          whileTap={{ scale: 0.9 }}
          disabled={!loaded}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </PlayBtn>

        <TimeDisplay>
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </TimeDisplay>

        <TimeBar>
          <TimeProgress style={{ width: `${progress}%` }} />
        </TimeBar>

        <ZoomBtns>
          <ZoomBtn onClick={() => handleZoom('out')}>－</ZoomBtn>
          <ZoomBtn onClick={() => handleZoom('in')}>＋</ZoomBtn>
        </ZoomBtns>
      </Controls>
    </Container>
  );
}
