import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { getStats, getHistory } from '../services/api';
import { format, parseISO } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const Page = styled.div`
  min-height: 100vh;
  padding: 90px 2rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const pageFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const HeroSection = styled.div`
  margin-bottom: 3rem;
  text-align: center;
  padding: 3rem 0 2rem;
`;

const HeroIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  animation: ${pageFloat} 4s ease-in-out infinite;
`;

const HeroTitle = styled.h1`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
`;

const HeroSub = styled.p`
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  max-width: 500px;
  margin: 0 auto 2rem;
  line-height: 1.7;
`;

const CTABtn = styled(motion(Link))`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, rgba(0,255,200,0.15), rgba(0,102,255,0.15));
  border: 1px solid var(--border-bright);
  border-radius: 50px;
  color: var(--accent-cyan);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: var(--transition);

  &:hover {
    background: linear-gradient(135deg, rgba(0,255,200,0.25), rgba(0,102,255,0.2));
    box-shadow: var(--glow-cyan);
    transform: translateY(-2px);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${p => p.$color || 'var(--accent-cyan)'};
    opacity: 0.7;
  }
`;

const StatLabel = styled.div`
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--text-dim);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${p => p.$color || 'var(--text-primary)'};
  line-height: 1;
  margin-bottom: 0.25rem;
`;

const StatDesc = styled.div`
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-secondary);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(motion.div)`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
`;

const CardTitle = styled.div`
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '//';
    color: var(--accent-cyan);
  }
`;

const HistoryTable = styled(motion.div)`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const TableRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 120px 100px 100px 80px;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid var(--border);
  align-items: center;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const TableHeader = styled(TableRow)`
  background: rgba(0,0,0,0.2);

  &:hover {
    background: rgba(0,0,0,0.2);
  }
`;

const TH = styled.div`
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  color: var(--text-dim);
  text-transform: uppercase;
`;

const TD = styled.div`
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: ${p => p.$muted ? 'var(--text-secondary)' : 'var(--text-primary)'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.6rem;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  background: ${p => p.$fake ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,136,0.1)'};
  color: ${p => p.$fake ? 'var(--accent-red)' : 'var(--success)'};
  border: 1px solid ${p => p.$fake ? 'rgba(255,51,102,0.25)' : 'rgba(0,255,136,0.25)'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  font-family: var(--font-mono);
  color: var(--text-dim);
  font-size: 0.75rem;

  a {
    color: var(--accent-cyan);
  }
`;

const FAKE_COLOR = '#ff3366';
const REAL_COLOR = '#00ff88';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.7rem',
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([getStats(), getHistory(10)]);
        setStats(s);
        setHistory(h.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build chart data from history
  const chartData = history.slice(0, 7).reverse().map((r, i) => ({
    name: format(parseISO(r.timestamp), 'HH:mm'),
    confidence: Math.round(r.confidence * 100),
    type: r.prediction === 'Deepfake' ? 1 : 0,
  }));

  const pieData = stats ? [
    { name: 'Real', value: stats.real_voices || 0 },
    { name: 'Deepfake', value: stats.deepfakes_detected || 0 },
  ] : [];

  return (
    <Page>
      <HeroSection>
        <HeroIcon>
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="rgba(0,255,200,0.2)" strokeWidth="1"/>
            <circle cx="40" cy="40" r="28" stroke="rgba(0,255,200,0.3)" strokeWidth="1"/>
            <circle cx="40" cy="40" r="18" stroke="rgba(0,255,200,0.4)" strokeWidth="1"/>
            <path d="M20 40 Q28 24 36 40 Q44 56 52 40 Q60 24 68 40" stroke="#00ffc8" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M24 48 Q30 36 36 48 Q42 60 48 48" stroke="rgba(0,255,200,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <circle cx="40" cy="40" r="4" fill="rgba(0,255,200,0.3)"/>
            <circle cx="40" cy="40" r="2" fill="#00ffc8"/>
          </svg>
        </HeroIcon>
        <HeroTitle>VoiceGuard AI</HeroTitle>
        <HeroSub>
          Advanced deepfake voice detection system using Wav2Vec 2.0
          neural embeddings and ensemble classification models
        </HeroSub>
        <CTABtn
          to="/analyze"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          Analyze Audio
        </CTABtn>
      </HeroSection>

      <motion.div variants={stagger.container} initial="initial" animate="animate">
        <StatsGrid>
          {[
            { label: 'Total Analyzed', value: stats?.total_analyzed ?? '—', color: 'var(--accent-cyan)', desc: 'Audio files processed' },
            { label: 'Deepfakes Found', value: stats?.deepfakes_detected ?? '—', color: 'var(--accent-red)', desc: 'AI-generated voices detected' },
            { label: 'Real Voices', value: stats?.real_voices ?? '—', color: 'var(--success)', desc: 'Authentic recordings verified' },
            { label: 'Avg Confidence', value: stats ? `${stats.avg_confidence}%` : '—', color: 'var(--accent-orange)', desc: 'Model prediction certainty' },
          ].map(({ label, value, color, desc }) => (
            <StatCard key={label} variants={stagger.item} $color={color}>
              <StatLabel>{label}</StatLabel>
              <StatValue $color={color}>{loading ? '...' : value}</StatValue>
              <StatDesc>{desc}</StatDesc>
            </StatCard>
          ))}
        </StatsGrid>

        <Row>
          <ChartCard variants={stagger.item}>
            <CardTitle>confidence trend</CardTitle>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="confGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Area type="monotone" dataKey="confidence" stroke="var(--accent-cyan)" strokeWidth={2} fill="url(#confGradient)" name="Confidence %"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState style={{ padding: '2rem' }}>No data yet. <Link to="/analyze">Analyze audio</Link> to see trends.</EmptyState>
            )}
          </ChartCard>

          <ChartCard variants={stagger.item}>
            <CardTitle>detection breakdown</CardTitle>
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    <Cell fill={REAL_COLOR} />
                    <Cell fill={FAKE_COLOR} />
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.7rem', fontFamily: 'Space Mono', color: 'var(--text-secondary)' }}/>
                  <Tooltip content={<CustomTooltip />}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState style={{ padding: '2rem' }}>No analysis data yet.</EmptyState>
            )}
          </ChartCard>
        </Row>

        <HistoryTable variants={stagger.item}>
          <CardTitle style={{ padding: '1.25rem 1.5rem', marginBottom: 0, borderBottom: '1px solid var(--border)' }}>
            recent analysis
          </CardTitle>
          <TableHeader>
            <TH>Filename</TH>
            <TH>Analyzed At</TH>
            <TH>Verdict</TH>
            <TH>Confidence</TH>
            <TH>Duration</TH>
          </TableHeader>

          {history.length === 0 ? (
            <EmptyState>
              No analysis history yet. <Link to="/analyze">Analyze your first audio file →</Link>
            </EmptyState>
          ) : (
            history.map((record) => (
              <TableRow key={record.id}>
                <TD style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                  {record.filename}
                </TD>
                <TD $muted style={{ fontSize: '0.65rem' }}>
                  {format(parseISO(record.timestamp), 'MMM dd, HH:mm')}
                </TD>
                <TD>
                  <Badge $fake={record.prediction === 'Deepfake'}>
                    {record.prediction}
                  </Badge>
                </TD>
                <TD style={{ color: record.prediction === 'Deepfake' ? 'var(--accent-red)' : 'var(--success)' }}>
                  {Math.round(record.confidence * 100)}%
                </TD>
                <TD $muted>
                  {record.audio_info?.duration ? `${record.audio_info.duration}s` : '—'}
                </TD>
              </TableRow>
            ))
          )}
        </HistoryTable>
      </motion.div>
    </Page>
  );
}
