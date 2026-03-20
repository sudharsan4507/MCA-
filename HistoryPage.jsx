import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { getHistory, deleteHistoryItem } from '../services/api';
import { format, parseISO } from 'date-fns';

const Page = styled.div`
  min-height: 100vh;
  padding: 90px 2rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  span { color: var(--accent-cyan); }
`;

const Count = styled.div`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-dim);
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--border-bright);
  }

  &::placeholder {
    color: var(--text-dim);
  }
`;

const FilterBtn = styled.button`
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid ${p => p.$active ? 'var(--border-bright)' : 'var(--border)'};
  background: ${p => p.$active ? 'rgba(0,255,200,0.08)' : 'transparent'};
  color: ${p => p.$active ? 'var(--accent-cyan)' : 'var(--text-secondary)'};
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;

  &:hover {
    border-color: var(--border-bright);
    color: var(--text-primary);
  }
`;

const RecordCard = styled(motion.div)`
  background: var(--bg-card);
  border: 1px solid ${p => p.$fake ? 'rgba(255,51,102,0.15)' : 'rgba(0,255,200,0.1)'};
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 120px 44px;
  align-items: center;
  gap: 1rem;
  transition: var(--transition);
  margin-bottom: 0.5rem;

  &:hover {
    border-color: ${p => p.$fake ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,200,0.25)'};
    background: ${p => p.$fake ? 'rgba(255,51,102,0.02)' : 'rgba(0,255,200,0.02)'};
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Field = styled.div``;

const FieldLabel = styled.div`
  font-family: var(--font-mono);
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: 3px;
`;

const FieldValue = styled.div`
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.62rem;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  background: ${p => p.$fake ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,136,0.1)'};
  color: ${p => p.$fake ? 'var(--accent-red)' : 'var(--success)'};
  border: 1px solid ${p => p.$fake ? 'rgba(255,51,102,0.25)' : 'rgba(0,255,136,0.25)'};
`;

const ConfidenceBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ConfNum = styled.span`
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: ${p => p.$fake ? 'var(--accent-red)' : 'var(--success)'};
  min-width: 36px;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 3px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${p => p.$pct}%;
  background: ${p => p.$fake ? 'var(--accent-red)' : 'var(--success)'};
  border-radius: 2px;
`;

const DeleteBtn = styled(motion.button)`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255,51,102,0.2);
  background: transparent;
  color: rgba(255,51,102,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;

  &:hover {
    background: rgba(255,51,102,0.1);
    border-color: var(--accent-red);
    color: var(--accent-red);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 5rem 2rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.8;
`;

const LoadMore = styled(motion.button)`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: var(--transition);

  &:hover {
    border-color: var(--border-bright);
    color: var(--accent-cyan);
    background: rgba(0,255,200,0.04);
  }
`;

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const LIMIT = 20;

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await getHistory(LIMIT, newOffset);
      setTotal(data.total);
      if (reset) {
        setRecords(data.results || []);
        setOffset(LIMIT);
      } else {
        setRecords(prev => [...prev, ...(data.results || [])]);
        setOffset(o => o + LIMIT);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(true); }, [load]);

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      setTotal(t => t - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = records
    .filter(r => {
      if (filter === 'real') return r.prediction === 'Real';
      if (filter === 'fake') return r.prediction === 'Deepfake';
      return true;
    })
    .filter(r =>
      search === '' || r.filename.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <Page>
      <Header>
        <div>
          <Title>Analysis <span>History</span></Title>
        </div>
        <Count>{total} record{total !== 1 ? 's' : ''} total</Count>
      </Header>

      <SearchBar>
        <SearchInput
          placeholder="Search by filename..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {['all', 'real', 'fake'].map(f => (
          <FilterBtn
            key={f}
            $active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'real' ? '✓ Real' : '⚠ Deepfake'}
          </FilterBtn>
        ))}
      </SearchBar>

      {loading && records.length === 0 ? (
        <EmptyState>Loading history...</EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {search || filter !== 'all'
            ? 'No records match your filter.'
            : 'No analysis history yet.\nUpload an audio file to get started.'}
        </EmptyState>
      ) : (
        <AnimatePresence>
          {filtered.map((record, i) => {
            const isDeepfake = record.prediction === 'Deepfake';
            const confPct = Math.round(record.confidence * 100);
            return (
              <RecordCard
                key={record.id}
                $fake={isDeepfake}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Field>
                  <FieldLabel>filename</FieldLabel>
                  <FieldValue title={record.filename}>{record.filename}</FieldValue>
                </Field>

                <Field>
                  <FieldLabel>analyzed</FieldLabel>
                  <FieldValue style={{ fontSize: '0.68rem' }}>
                    {format(parseISO(record.timestamp), 'MMM dd, HH:mm')}
                  </FieldValue>
                </Field>

                <Field>
                  <FieldLabel>verdict</FieldLabel>
                  <Badge $fake={isDeepfake}>{record.prediction}</Badge>
                </Field>

                <Field>
                  <FieldLabel>confidence</FieldLabel>
                  <ConfidenceBar>
                    <ConfNum $fake={isDeepfake}>{confPct}%</ConfNum>
                    <BarTrack>
                      <BarFill $pct={confPct} $fake={isDeepfake} />
                    </BarTrack>
                  </ConfidenceBar>
                </Field>

                <Field>
                  <FieldLabel>duration</FieldLabel>
                  <FieldValue style={{ color: 'var(--text-secondary)' }}>
                    {record.audio_info?.duration ? `${record.audio_info.duration}s` : '—'}
                  </FieldValue>
                </Field>

                <DeleteBtn
                  onClick={() => handleDelete(record.id)}
                  whileTap={{ scale: 0.9 }}
                  title="Delete record"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </DeleteBtn>
              </RecordCard>
            );
          })}
        </AnimatePresence>
      )}

      {records.length < total && (
        <LoadMore
          onClick={() => load(false)}
          disabled={loading}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Loading...' : `Load More (${total - records.length} remaining)`}
        </LoadMore>
      )}
    </Page>
  );
}
