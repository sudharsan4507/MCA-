import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

const scanAnim = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
`;

const pulseAnim = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
`;

const Zone = styled(motion.div)`
  position: relative;
  border: 2px dashed ${p => p.$active ? 'var(--accent-cyan)' : p.$reject ? 'var(--accent-red)' : 'rgba(0,255,200,0.2)'};
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: ${p => p.$active ? 'rgba(0,255,200,0.04)' : 'rgba(255,255,255,0.01)'};
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: rgba(0,255,200,0.4);
    background: rgba(0,255,200,0.03);
  }
`;

const ScanLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  animation: ${scanAnim} 2s ease-in-out infinite;
  animation-play-state: ${p => p.$active ? 'running' : 'paused'};
  opacity: 0;
`;

const GridOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,255,200,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,200,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
  pointer-events: none;
  opacity: ${p => p.$active ? 1 : 0};
  transition: opacity 0.3s;
`;

const CornerDecor = styled.div`
  position: absolute;
  ${p => p.$pos} 
  width: 16px;
  height: 16px;
  border-color: var(--accent-cyan);
  border-style: solid;
  opacity: ${p => p.$active ? 0.8 : 0.25};
  transition: opacity 0.3s;
  ${p => p.$tl ? 'border-width: 2px 0 0 2px; top: 12px; left: 12px;' : ''}
  ${p => p.$tr ? 'border-width: 2px 2px 0 0; top: 12px; right: 12px;' : ''}
  ${p => p.$bl ? 'border-width: 0 0 2px 2px; bottom: 12px; left: 12px;' : ''}
  ${p => p.$br ? 'border-width: 0 2px 2px 0; bottom: 12px; right: 12px;' : ''}
`;

const IconWrapper = styled(motion.div)`
  width: 72px;
  height: 72px;
  margin: 0 auto 1.25rem;
  position: relative;
`;

const IconBg = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,255,200,0.1) 0%, transparent 70%);
  border: 1px solid rgba(0,255,200,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulseAnim} 3s ease-in-out infinite;
`;

const Title = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
`;

const Subtitle = styled.p`
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const FileTag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0,255,200,0.08);
  border: 1px solid rgba(0,255,200,0.15);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--accent-cyan);
  margin: 2px;
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-top: 0.75rem;
`;

const SelectedFile = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(0,255,200,0.06);
  border: 1px solid rgba(0,255,200,0.2);
  border-radius: 8px;
  margin-top: 1rem;
`;

const FileName = styled.span`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-cyan);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FileSize = styled.span`
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-secondary);
`;

const RemoveBtn = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 51, 102, 0.3);
  background: rgba(255, 51, 102, 0.08);
  color: var(--accent-red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: var(--transition);
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 51, 102, 0.2);
    border-color: var(--accent-red);
  }
`;

const ACCEPTED_TYPES = {
  'audio/wav': ['.wav'],
  'audio/mpeg': ['.mp3'],
  'audio/mp3': ['.mp3'],
  'audio/flac': ['.flac'],
  'audio/ogg': ['.ogg'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
};

export default function Upload({ onFileSelect, selectedFile }) {
  const [rejected, setRejected] = useState(false);

  const onDrop = useCallback((accepted, fileRejections) => {
    setRejected(false);
    if (fileRejections.length > 0) {
      setRejected(true);
      setTimeout(() => setRejected(false), 2000);
      return;
    }
    if (accepted[0]) {
      onFileSelect(accepted[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <Zone
        {...getRootProps()}
        $active={isDragActive}
        $reject={rejected}
        animate={isDragActive ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <input {...getInputProps()} />
        <GridOverlay $active={isDragActive} />
        <ScanLine $active={isDragActive} />
        <CornerDecor $tl $active={isDragActive} />
        <CornerDecor $tr $active={isDragActive} />
        <CornerDecor $bl $active={isDragActive} />
        <CornerDecor $br $active={isDragActive} />

        <IconWrapper
          animate={isDragActive ? { y: -5 } : { y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <IconBg>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                stroke="rgba(0,255,200,0.3)"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M8 12 Q10 8 12 12 Q14 16 16 12"
                stroke="var(--accent-cyan)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M9 10 Q10.5 7 12 10 Q13.5 13 15 10"
                stroke="rgba(0,255,200,0.4)"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="1.5" fill="var(--accent-cyan)" />
              <path
                d="M12 6.5V4 M12 6.5l-1.5-1.5 M12 6.5l1.5-1.5"
                stroke="rgba(0,255,200,0.6)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </IconBg>
        </IconWrapper>

        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Title style={{ color: 'var(--accent-cyan)' }}>Release to Analyze</Title>
              <Subtitle>Drop audio file to begin analysis</Subtitle>
            </motion.div>
          ) : rejected ? (
            <motion.div
              key="rejected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Title style={{ color: 'var(--accent-red)' }}>Invalid File Type</Title>
              <Subtitle>Please upload a supported audio format</Subtitle>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Title>Upload Audio for Analysis</Title>
              <Subtitle>
                Drag & drop your audio file here<br />
                or click to select from your device
              </Subtitle>
              <TagsRow>
                {['WAV', 'MP3', 'FLAC', 'OGG', 'M4A'].map(fmt => (
                  <FileTag key={fmt}>.{fmt.toLowerCase()}</FileTag>
                ))}
              </TagsRow>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
                Max 50MB · Mono or Stereo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Zone>

      <AnimatePresence>
        {selectedFile && (
          <SelectedFile
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-cyan)">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <FileName>{selectedFile.name}</FileName>
            <FileSize>{formatSize(selectedFile.size)}</FileSize>
            <RemoveBtn onClick={(e) => { e.stopPropagation(); onFileSelect(null); }}>✕</RemoveBtn>
          </SelectedFile>
        )}
      </AnimatePresence>
    </div>
  );
}
