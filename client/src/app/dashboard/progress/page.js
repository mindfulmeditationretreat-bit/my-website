'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const TYPES = [
  { id: 'weight',     label: 'Weight (kg)' },
  { id: 'meditation', label: 'Meditation (min)' },
  { id: 'mood',       label: 'Mood (1–10)' },
];

export default function ProgressPage() {
  const [entries, setEntries] = useState([]);
  const [streak, setStreak] = useState(0);
  const [type, setType] = useState('weight');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('');

  async function load() {
    const data = await api.get('/progress' + (filter ? `?type=${filter}` : ''));
    setEntries(data.entries ?? data);
    if (data.meditationStreak != null) setStreak(data.meditationStreak);
  }
  useEffect(() => { load(); }, [filter]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await api.post('/progress', { type, value, note });
      setValue(''); setNote('');
      await load();
    } catch (err) { alert(err.message); }
  }

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Tracking</p>
      <h1 className="heading text-4xl font-light mb-8">Progress journal</h1>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Meditation streak</p>
          <p className="heading text-4xl text-gold">{streak}</p>
          <p className="text-cream/50 text-xs mt-1">consecutive days</p>
        </div>
        <div className="card text-center">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Total entries</p>
          <p className="heading text-4xl">{entries.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Last logged</p>
          <p className="heading text-lg">
            {entries[0] ? new Date(entries[0].recordedAt).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>

      <div className="card mb-8">
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end">
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Value</label>
            <input className="input" type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>
          <button className="btn-primary" type="submit">Log</button>
        </form>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'weight', 'meditation', 'mood'].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={'px-4 py-1.5 rounded-full border text-sm transition ' +
              (filter === t ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60 hover:border-gold/40')}>
            {t || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-cream/60">No entries yet.</p>
        ) : entries.map((e) => (
          <div key={e.id} className="card flex items-center justify-between py-3 fade-in">
            <div>
              <p className="text-cream"><span className="text-gold/80 text-xs uppercase tracking-widest mr-2">{e.type}</span> {e.value ?? '—'}</p>
              {e.note && <p className="text-cream/60 text-sm">{e.note}</p>}
            </div>
            <p className="text-cream/40 text-xs">{new Date(e.recordedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </>
  );
}
