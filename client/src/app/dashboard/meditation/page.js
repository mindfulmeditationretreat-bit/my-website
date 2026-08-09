'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, assetUrl } from '@/lib/api';

const CATS = [
  { id: '', label: 'All' },
  { id: 'anxiety_relief', label: 'Anxiety relief' },
  { id: 'better_sleep', label: 'Better sleep' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'self_confidence', label: 'Self-confidence' },
  { id: 'compassion', label: 'Compassion' },
  { id: 'buddhist_meditation', label: 'Buddhist' },
  { id: 'loving_kindness', label: 'Loving kindness' },
  { id: 'breath_awareness', label: 'Breath' },
];

function fmtDur(sec) {
  const m = Math.round((sec || 0) / 60);
  return `${m} min`;
}

export default function MeditationCenterPage() {
  const [list, setList] = useState([]);
  const [cat, setCat] = useState('');
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState(null);
  const [reflection, setReflection] = useState('');
  const [msg, setMsg] = useState('');

  async function load(category = cat) {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    const [m, s, d] = await Promise.all([
      api.get(`/meditation${q}`),
      api.get('/meditation/stats'),
      api.get('/meditation/daily'),
    ]);
    setList(m);
    setStats(s);
    setDaily(d);
    setReflection(d?.log?.reflection || '');
  }

  useEffect(() => { load(); }, []);

  async function filter(c) {
    setCat(c);
    await load(c);
  }

  async function fav(id) {
    const res = await api.post(`/meditation/${id}/favorite`);
    setList((rows) => rows.map((r) => (r.id === id ? { ...r, favorited: res.favorited } : r)));
  }

  async function play(id) {
    const res = await api.post(`/meditation/${id}/play`);
    setStats((s) => ({ ...s, streak: res.streak, playsCount: (s?.playsCount || 0) + 1 }));
    setMsg('Session logged. Keep your streak going.');
  }

  async function saveDaily(patch) {
    const res = await api.post('/meditation/daily', { reflection, ...patch });
    setDaily((d) => ({ ...d, log: res }));
    setMsg('Daily practice saved.');
  }

  return (
    <>
      <Link href="/dashboard" className="text-cream/60 hover:text-gold text-sm">← Dashboard</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">Meditation center</p>
      <h1 className="heading text-4xl font-light mb-2">Sit. Soften. Return.</h1>
      <p className="text-cream/50 text-sm mb-8">Guided practice and a gentle daily ritual.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Streak</p>
          <p className="heading text-3xl text-gold">{stats?.streak ?? 0}</p>
        </div>
        <div className="card text-center">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Sessions</p>
          <p className="heading text-3xl">{stats?.playsCount ?? 0}</p>
        </div>
        <div className="card text-center">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Favorites</p>
          <p className="heading text-3xl">{stats?.favoritesCount ?? 0}</p>
        </div>
      </div>

      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}

      {daily?.practice && (
        <div className="card mb-8">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Today&apos;s practice</p>
          <h2 className="heading text-2xl mb-4">{daily.practice.practiceText}</h2>
          <p className="text-cream/70 text-sm mb-2"><span className="text-gold/80">Reflection:</span> {daily.practice.reflectionPrompt}</p>
          <p className="text-cream/70 text-sm mb-4"><span className="text-gold/80">Challenge:</span> {daily.practice.challengeText}</p>
          <textarea className="input mb-4" rows={2} placeholder="Your reflection…"
            value={reflection} onChange={(e) => setReflection(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline py-2 px-4 text-sm"
              onClick={() => saveDaily({ practiceDone: true })}>
              {daily.log?.practiceDone ? 'Practice ✓' : 'Mark practice done'}
            </button>
            <button type="button" className="btn-outline py-2 px-4 text-sm"
              onClick={() => saveDaily({ challengeDone: true })}>
              {daily.log?.challengeDone ? 'Challenge ✓' : 'Mark challenge done'}
            </button>
            <button type="button" className="btn-primary py-2 px-4 text-sm" onClick={() => saveDaily({})}>
              Save reflection
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {CATS.map((c) => (
          <button key={c.id || 'all'} type="button" onClick={() => filter(c.id)}
            className={'px-3 py-1.5 rounded-full border text-xs ' +
              (cat === c.id ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((m) => (
          <div key={m.id} className="card">
            <p className="text-gold/70 text-xs uppercase tracking-widest mb-1">{m.category.replace(/_/g, ' ')}</p>
            <h3 className="heading text-xl mb-1">{m.title}</h3>
            <p className="text-cream/50 text-xs mb-3">{fmtDur(m.durationSec)}</p>
            <p className="text-cream/60 text-sm mb-4">{m.description}</p>
            {m.audioUrl && (
              <audio controls className="w-full mb-3" src={assetUrl(m.audioUrl)} onPlay={() => play(m.id)} />
            )}
            <div className="flex gap-2">
              <button type="button" className="btn-primary py-2 px-4 text-sm" onClick={() => play(m.id)}>
                Log listen
              </button>
              <button type="button" className="btn-outline py-2 px-4 text-sm" onClick={() => fav(m.id)}>
                {m.favorited ? 'Saved ✓' : 'Save'}
              </button>
              {m.audioUrl && (
                <a className="btn-outline py-2 px-4 text-sm" href={assetUrl(m.audioUrl)} download>Download</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
