'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const TABS = ['Overview', 'Progress', 'Notes'];

export default function InstructorUserDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState([]);
  const [progressStreak, setProgressStreak] = useState(0);
  const [progressFilter, setProgressFilter] = useState('');
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('Overview');
  const [error, setError] = useState('');

  async function load() {
    try {
      const d = await api.get(`/instructors/me/users/${id}`);
      setData(d);
    } catch (e) { setError(e.message); }
  }

  async function loadProgress() {
    try {
      const raw = await api.get(`/instructors/me/users/${id}/progress` + (progressFilter ? `?type=${progressFilter}` : ''));
      setProgress(raw.entries ?? raw);
      if (raw.meditationStreak != null) setProgressStreak(raw.meditationStreak);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === 'Progress') loadProgress(); }, [tab, progressFilter, id]);

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    await api.post(`/instructors/me/users/${id}/notes`, { body: note });
    setNote('');
    await load();
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-cream/60">Loading…</p>;

  return (
    <>
      <Link href="/dashboard/instructor/users" className="text-cream/60 hover:text-gold text-sm">← Back</Link>

      <div className="flex items-end justify-between mt-6 mb-6">
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">{data.program.name}</p>
          <h1 className="heading text-4xl font-light">{data.user.fullName || data.user.email}</h1>
        </div>
        <Link href={`/dashboard/messages/${data.user.id}`} className="btn-outline">Message</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gold/20">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={'px-5 py-2.5 text-sm transition border-b-2 -mb-px ' +
              (tab === t ? 'border-gold text-gold' : 'border-transparent text-cream/60 hover:text-cream')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="heading text-xl mb-3">About</h3>
            <p className="text-cream/70 text-sm">Age: {data.user.age || '—'}</p>
            <p className="text-cream/70 text-sm">Gender: {data.user.gender || '—'}</p>
            <p className="text-cream/70 text-sm">Interested country to travel: {data.user.travelCountry || '—'}</p>
            <p className="text-cream/70 text-sm mt-2">Status: <span className="text-gold uppercase text-xs tracking-widest">{data.status}</span></p>
            <p className="text-cream/70 text-sm">Trial ends: {data.trialEndsAt ? new Date(data.trialEndsAt).toLocaleDateString() : '—'}</p>
          </div>
          <div className="card">
            <h3 className="heading text-xl mb-3">Wellness goals</h3>
            {data.user.wellnessGoals?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.user.wellnessGoals.map((g) => (
                  <span key={g} className="px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-cream/80 text-xs">
                    {g.replaceAll('_', ' ')}
                  </span>
                ))}
              </div>
            ) : <p className="text-cream/60 text-sm">None set.</p>}
          </div>
        </div>
      )}

      {tab === 'Progress' && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Meditation streak</p>
              <p className="heading text-3xl text-gold">{progressStreak}</p>
              <p className="text-cream/40 text-xs">days</p>
            </div>
            <div className="card text-center">
              <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Entries shown</p>
              <p className="heading text-3xl">{progress.length}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'weight', 'meditation', 'mood'].map((t) => (
              <button key={t} onClick={() => setProgressFilter(t)}
                className={'px-4 py-1.5 rounded-full border text-sm transition ' +
                  (progressFilter === t ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60 hover:border-gold/40')}>
                {t || 'All'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {progress.length === 0 ? (
              <p className="text-cream/60 text-sm">No progress entries yet.</p>
            ) : progress.map((e) => (
              <div key={e.id} className="card flex items-center justify-between py-3">
                <div>
                  <p className="text-cream"><span className="text-gold/80 text-xs uppercase tracking-widest mr-2">{e.type}</span>{e.value ?? '—'}</p>
                  {e.note && <p className="text-cream/60 text-sm">{e.note}</p>}
                </div>
                <p className="text-cream/40 text-xs">{new Date(e.recordedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'Notes' && (
        <div className="card">
          <h3 className="heading text-xl mb-4">Wellness notes</h3>
          <form onSubmit={addNote} className="flex gap-2 mb-6">
            <input className="input flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note about this member…" />
            <button className="btn-primary">Add</button>
          </form>
          <div className="space-y-2">
            {data.notes.length === 0 ? (
              <p className="text-cream/60 text-sm">No notes yet.</p>
            ) : data.notes.map((n) => (
              <div key={n.id} className="border-l-2 border-gold/30 pl-3 py-1">
                <p className="text-cream/80 text-sm">{n.body}</p>
                <p className="text-cream/40 text-xs mt-1">{n.author?.fullName} · {new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
