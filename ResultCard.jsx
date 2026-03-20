import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import jsPDF from 'jspdf';
import WaveformPlayer from './WaveformPlayer';

const Card = styled(motion.div)`
  background: var(--bg-card);
  border: 1px solid ${p => p.$isDeepfake ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 255, 200, 0.25)'};
  border-radius: var(--radius-lg);
  padding: 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: ${p => p.$isDeepfake ? '0 0 50px rgba(255, 51, 102, 0.08)' : '0 0 50px rgba(0, 255, 200, 0.06)'};
`;

const GlowBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: ${p => p.$isDeepfake
    ? 'linear-gradient(90deg, transparent, #ff3366, transparent)'
    : 'linear-gradient(90deg, transparent, #00ffc8, transparent)'};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const PredictionBadge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 50px;
  border: 1px solid ${p => p.$isDeepfake ? 'rgba(255,51,102,0.4)' : 'rgba(0,255,200,0.4)'};
  background: ${p => p.$isDeepfake ? 'rgba(255,51,102,0.08)' : 'rgba(0,255,200,0.06)'};
`;

const BadgeIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${p => p.$isDeepfake ? 'rgba(255,51,102,0.15)' : 'rgba(0,255,200,0.1)'};
  border: 1px solid ${p => p.$isDeepfake ? 'rgba(255,51,102,0.4)' : 'rgba(0,255,200,0.3)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

const BadgeText = styled.div``;

const BadgeLabel = styled.div`
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const BadgeValue = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: ${p => p.$isDeepfake ? 'var(--accent-red)' : 'var(--accent-cyan)'};
  letter-spacing: 0.05em;
`;

const DownloadBtn = styled(motion.button)`
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
  white-space: nowrap;

  &:hover {
    color: var(--accent-cyan);
    border-color: var(--border-bright);
    background: rgba(0, 255, 200, 0.05);
  }
`;

const ConfidenceSection = styled.div`
  margin: 1.5rem 0;
`;

const ConfidenceLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
`;

const ConfidenceText = styled.span`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const ConfidenceValue = styled.span`
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: ${p => p.$isDeepfake ? 'var(--accent-red)' : 'var(--accent-cyan)'};
`;

const ProgressTrack = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  border-radius: 4px;
  background: ${p => p.$isDeepfake
    ? 'linear-gradient(90deg, #ff3366, #ff6b9d)'
    : 'linear-gradient(90deg, #00ffc8, #00b8ff)'};
  box-shadow: ${p => p.$isDeepfake
    ? '0 0 10px rgba(255,51,102,0.5)'
    : '0 0 10px rgba(0,255,200,0.5)'};
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const MetaItem = styled.div`
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
`;

const MetaLabel = styled.div`
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const MetaValue = styled.div`
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 600;
`;

const ProbBarGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ProbBar = styled.div`
  flex: 1;
`;

const ProbLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-family: var(--font-mono);
  font-size: 0.65rem;
`;

const ProbTrack = styled.div`
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  overflow: hidden;
`;

const ProbFill = styled(motion.div)`
  height: 100%;
  border-radius: 2px;
  background: ${p => p.$color};
`;

const riskBg = (level) => {
  if (level === 'critical') return 'rgba(255,51,102,0.1)';
  if (level === 'high') return 'rgba(255,123,0,0.1)';
  if (level === 'medium') return 'rgba(255,200,0,0.1)';
  if (level === 'low') return 'rgba(0,255,136,0.1)';
  return 'rgba(255,255,255,0.05)';
};
const riskColor = (level) => {
  if (level === 'critical') return '#ff3366';
  if (level === 'high') return '#ff7b00';
  if (level === 'medium') return '#ffcc00';
  if (level === 'low') return '#00ff88';
  return 'var(--text-secondary)';
};

const RiskBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 0.5rem;
  background: ${p => riskBg(p.$level)};
  color: ${p => riskColor(p.$level)};
  border: 1px solid currentColor;
  opacity: 0.9;
`;

const WaveSection = styled.div`
  margin-top: 1.5rem;
`;

export default function ResultCard({ result, audioFile }) {
  if (!result) return null;

  const isDeepfake = result.prediction === 'Deepfake';
  const confidencePct = Math.round(result.confidence * 100);

  const generatePDF = () => {
    const doc = new jsPDF();
    const primaryColor = isDeepfake ? [255, 51, 102] : [0, 255, 200];

    // Background
    doc.setFillColor(5, 8, 16);
    doc.rect(0, 0, 210, 297, 'F');

    // Header accent line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(0, 30, 210, 30);

    // Title
    doc.setTextColor(232, 240, 254);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('VOICEGUARD', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(136, 153, 187);
    doc.text('Deepfake Voice Detection Report', 20, 27);

    // Verdict banner
    doc.setFillColor(isDeepfake ? 255 : 0, isDeepfake ? 51 : 255, isDeepfake ? 102 : 200);
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.rect(15, 40, 180, 30, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(15, 40, 180, 30, 'S');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(result.prediction.toUpperCase() + ' VOICE DETECTED', 105, 58, { align: 'center' });

    // Confidence
    doc.setTextColor(136, 153, 187);
    doc.setFontSize(10);
    doc.text(`Confidence: ${confidencePct}%  |  Risk Level: ${result.risk_level?.toUpperCase() || 'N/A'}`, 105, 78, { align: 'center' });

    // File Info section
    let y = 95;
    doc.setTextColor(232, 240, 254);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FILE INFORMATION', 20, y);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...primaryColor);
    doc.line(20, y + 3, 190, y + 3);
    y += 12;

    const fields = [
      ['Filename', result.filename],
      ['Analyzed At', new Date(result.timestamp).toLocaleString()],
      ['Processing Time', `${result.processing_time}s`],
      ['Duration', `${result.audio_info?.duration}s`],
      ['Sample Rate', `${result.audio_info?.sample_rate} Hz`],
      ['Format', result.audio_info?.format],
      ['File Size', result.audio_info?.file_size ? `${(result.audio_info.file_size / 1024).toFixed(1)} KB` : 'N/A'],
    ];

    doc.setFontSize(10);
    fields.forEach(([label, value]) => {
      doc.setTextColor(136, 153, 187);
      doc.setFont('helvetica', 'normal');
      doc.text(label + ':', 20, y);
      doc.setTextColor(232, 240, 254);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value || 'N/A'), 80, y);
      y += 9;
    });

    // Probability section
    y += 5;
    doc.setTextColor(232, 240, 254);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLASSIFICATION PROBABILITIES', 20, y);
    doc.setDrawColor(...primaryColor);
    doc.line(20, y + 3, 190, y + 3);
    y += 12;

    const probs = [
      ['Real Voice', result.probabilities?.real, [0, 255, 136]],
      ['Deepfake Voice', result.probabilities?.deepfake, [255, 51, 102]],
    ];

    probs.forEach(([label, prob, color]) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(136, 153, 187);
      doc.text(label, 20, y);
      doc.setTextColor(...color);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round((prob || 0) * 100)}%`, 170, y, { align: 'right' });

      // Progress bar
      doc.setFillColor(20, 30, 50);
      doc.rect(20, y + 2, 150, 4, 'F');
      doc.setFillColor(...color);
      doc.rect(20, y + 2, 150 * (prob || 0), 4, 'F');
      y += 15;
    });

    // Footer
    doc.setTextColor(68, 85, 119);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by VoiceGuard Deepfake Detection System', 105, 285, { align: 'center' });
    doc.text(`Report ID: ${result.id}`, 105, 291, { align: 'center' });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    doc.save(`voiceguard-report-${timestamp}.pdf`);
  };

  return (
    <Card
      $isDeepfake={isDeepfake}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <GlowBar $isDeepfake={isDeepfake} />

      <Header>
        <PredictionBadge
          $isDeepfake={isDeepfake}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
        >
          <BadgeIcon $isDeepfake={isDeepfake}>
            {isDeepfake ? '⚠' : '✓'}
          </BadgeIcon>
          <BadgeText>
            <BadgeLabel>verdict</BadgeLabel>
            <BadgeValue $isDeepfake={isDeepfake}>
              {result.prediction} Voice
            </BadgeValue>
          </BadgeText>
        </PredictionBadge>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <DownloadBtn
            onClick={generatePDF}
            whileTap={{ scale: 0.97 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            PDF Report
          </DownloadBtn>
          {result.risk_level && (
            <RiskBadge $level={result.risk_level}>
              ● {result.risk_level} risk
            </RiskBadge>
          )}
        </div>
      </Header>

      <ConfidenceSection>
        <ConfidenceLabel>
          <ConfidenceText>confidence score</ConfidenceText>
          <ConfidenceValue $isDeepfake={isDeepfake}>{confidencePct}%</ConfidenceValue>
        </ConfidenceLabel>
        <ProgressTrack>
          <ProgressFill
            $isDeepfake={isDeepfake}
            initial={{ width: 0 }}
            animate={{ width: `${confidencePct}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          />
        </ProgressTrack>

        <ProbBarGroup>
          {[
            { label: 'Real', value: result.probabilities?.real || 0, color: '#00ff88' },
            { label: 'Deepfake', value: result.probabilities?.deepfake || 0, color: '#ff3366' },
          ].map(({ label, value, color }) => (
            <ProbBar key={label}>
              <ProbLabel>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{Math.round(value * 100)}%</span>
              </ProbLabel>
              <ProbTrack>
                <ProbFill
                  $color={color}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(value * 100)}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                />
              </ProbTrack>
            </ProbBar>
          ))}
        </ProbBarGroup>
      </ConfidenceSection>

      <MetaGrid>
        {[
          { label: 'filename', value: result.filename?.length > 20 ? result.filename.slice(0, 20) + '...' : result.filename },
          { label: 'duration', value: `${result.audio_info?.duration}s` },
          { label: 'sample rate', value: `${result.audio_info?.sample_rate} Hz` },
          { label: 'format', value: result.audio_info?.format },
          { label: 'processed in', value: `${result.processing_time}s` },
          { label: 'timestamp', value: new Date(result.timestamp).toLocaleTimeString() },
        ].map(({ label, value }) => (
          <MetaItem key={label}>
            <MetaLabel>{label}</MetaLabel>
            <MetaValue>{value || 'N/A'}</MetaValue>
          </MetaItem>
        ))}
      </MetaGrid>

      {audioFile && (
        <WaveSection>
          <WaveformPlayer audioFile={audioFile} prediction={result.prediction} />
        </WaveSection>
      )}
    </Card>
  );
}
