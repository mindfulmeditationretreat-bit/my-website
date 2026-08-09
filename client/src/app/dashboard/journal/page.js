'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [report, setReport] = useState(null);
  const [form, setForm] = useState({ mood: 5, energy: 5, gratitude: '', meditationNote: '', body: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    const [e, r] = await Promise.all([api.get('/journal'), api.get('/journal/report')]);
    setEntries(e);
    setReport(r);
  }

  useEffect(() => { load(); }, []);

  async function submit(ev) {
    ev.preventDefault();
    await api.post('/journal', form);
    setMsg('Entry saved.');
    setForm({ mood: 5, energy: 5, gratitude: '', meditationNote: '', body: '' });
    await load();
  }

  return (
    <>
      <Link href="/dashboard" className="text-cream/60 hover:text-gold text-sm">← Dashboard</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">Personal journal</p>
      <h1 className="heading text-4xl font-light mb-8">Notice what is here.</h1>

      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card text-center"><p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Entries</p><p className="heading text-2xl">{report.entries}</p></div>
          <div className="card text-center"><p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Avg mood</p><p className="heading text-2xl text-gold">{report.avgMood ?? '—'}</p></div>
          <div className="card text-center"><p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Avg energy</p><p className="heading text-2xl">{report.avgEnergy ?? '—'}</p></div>
          <div className="card text-center"><p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Gratitude</p><p className="heading text-2xl">{report.gratitudeCount}</p></div>
        </div>
      )}

      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}

      <form onSubmit={submit} className="card max-w-xl space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Mood (1–10)</label>
            <input className="input" type="range" min="1" max="10" value={form.mood}
              onChange={(e) => setForm({ ...form, mood: Number(e.target.value) })} />
            <p className="text-gold text-xs mt-1">{form.mood}</p>
          </div>
          <div>
            <label className="label">Energy (1–10)</label>
            <input className="input" type="range" min="1" max="10" value={form.energy}
              onChange={(e) => setForm({ ...form, energy: Number(e.target.value) })} />
            <p className="text-gold text-xs mt-1">{form.energy}</p>
          </div>
        </div>
        <div>
          <label className="label">Gratitude</label>
          <textarea className="input" rows={2} value={form.gratitude}
            onChange={(e) => setForm({ ...form, gratitude: e.target.value })} />
        </div>
        <div>
          <label className="label">Meditation experience</label>
          <textarea className="input" rows={2} value={form.meditationNote}
            onChange={(e) => setForm({ ...form, meditationNote: e.target.value })} />
        </div>
        <div>
          <label className="label">Free write</label>
          <textarea className="input" rows={3} value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
        <button className="btn-primary">Save entry</button>
      </form>

      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="card py-4">
            <p className="text-cream/40 text-xs mb-2">{new Date(e.recordedAt).toLocaleString()}</p>
            <p className="text-cream/70 text-sm mb-1">Mood {e.mood ?? '—'} · Energy {e.energy ?? '—'}</p>
            {e.gratitude && <p className="text-cream text-sm"><span className="text-gold/80">Gratitude:</span> {e.gratitude}</p>}
            {e.meditationNote && <p className="text-cream/70 text-sm mt-1">{e.meditationNote}</p>}
            {e.body && <p className="text-cream/60 text-sm mt-2">{e.body}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
