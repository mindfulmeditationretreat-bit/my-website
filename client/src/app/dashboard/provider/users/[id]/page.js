'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const TABS = ['Overview', 'Progress', 'Notes'];

function goalsList(value) {
  if (Array.isArray(value)) return value.filter((g) => typeof g === 'string');
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((g) => typeof g === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
      const d = await api.get(`/providers/me/users/${id}`);
      setData(d);
      setError('');
    } catch (e) { setError(e.message); }
  }

  async function loadProgress() {
    try {
      const raw = await api.get(`/providers/me/users/${id}/progress` + (progressFilter ? `?type=${progressFilter}` : ''));
      setProgress(Array.isArray(raw?.entries) ? raw.entries : (Array.isArray(raw) ? raw : []));
      if (raw?.meditationStreak != null) setProgressStreak(raw.meditationStreak);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === 'Progress') loadProgress(); }, [tab, progressFilter, id]);

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await api.post(`/providers/me/users/${id}/notes`, { body: note });
      setNote('');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to add note');
    }
  }

  if (error && !data) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-cream/60">Loading…</p>;

  const user = data.user;
  const notes = Array.isArray(data.notes) ? data.notes : [];
  const goals = goalsList(user?.wellnessGoals);

  if (!user) {
    return (
      <>
        <Link href="/dashboard/provider/users" className="text-cream/60 hover:text-gold text-sm">← Back</Link>
        <p className="text-red-400 mt-6">This member could not be loaded (missing user record).</p>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard/provider/users" className="text-cream/60 hover:text-gold text-sm">← Back</Link>

      <div className="flex items-end justify-between mt-6 mb-6">
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">{data.program?.name ?? '—'}</p>
          <h1 className="heading text-4xl font-light">{user.fullName || user.email}</h1>
        </div>
        <Link href={`/dashboard/messages/${user.id}`} className="btn-outline">Message</Link>
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

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
            <p className="text-cream/70 text-sm">Age: {user.age || data.healthProfile?.age || '—'}</p>
            <p className="text-cream/70 text-sm">Gender: {user.gender || data.healthProfile?.sex || '—'}</p>
            <p className="text-cream/70 text-sm">Country: {user.country || '—'}</p>
            <p className="text-cream/70 text-sm">Country interested to travel: {user.travelCountry || '—'}</p>
            <p className="text-cream/70 text-sm">Phone: {user.phone || '—'}</p>
            <p className="text-cream/70 text-sm mt-2">Status: <span className="text-gold uppercase text-xs tracking-widest">{data.status}</span></p>
            <p className="text-cream/70 text-sm">Trial ends: {data.trialEndsAt ? new Date(data.trialEndsAt).toLocaleDateString() : '—'}</p>
          </div>
          <div className="card">
            <h3 className="heading text-xl mb-3">Wellness goals</h3>
            {goals.length ? (
              <div className="flex flex-wrap gap-2">
                {goals.map((g) => (
                  <span key={g} className="px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-cream/80 text-xs">
                    {g.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            ) : <p className="text-cream/60 text-sm">None set.</p>}
          </div>
          {data.healthProfile && (
            <div className="card md:col-span-2">
              <h3 className="heading text-xl mb-3">Diet details</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-cream/70">
                <p>Height: {data.healthProfile.heightCm ?? '—'} cm</p>
                <p>Weight: {data.healthProfile.weightKg ?? '—'} kg</p>
                <p>IBW: {data.healthProfile.ibw ?? '—'} kg</p>
                <p>BMI: {data.healthProfile.bmi ?? '—'} {data.healthProfile.bmiCategory ? `(${data.healthProfile.bmiCategory})` : ''}</p>
                <p>Food behaviour: {data.healthProfile.foodBehaviour || '—'}</p>
                <p>Allergy: {data.healthProfile.foodAllergy || '—'}</p>
                <p>Conditions: {Array.isArray(data.healthProfile.medicalConditions) ? data.healthProfile.medicalConditions.join(', ') : '—'}</p>
                <p>Other: {data.healthProfile.medicalOther || '—'}</p>
                <p>Medication: {data.healthProfile.medication || '—'}</p>
                <p>Drinking/smoking: {data.healthProfile.drinkingSmoking || '—'}</p>
                <p>Fasting / no-meat: {data.healthProfile.fastingOrNoMeat || '—'}</p>
                <p>Tiffin: {data.healthProfile.canCarryTiffin == null ? '—' : (data.healthProfile.canCarryTiffin ? 'Yes' : 'No')}</p>
              </div>
            </div>
          )}
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
            {notes.length === 0 ? (
              <p className="text-cream/60 text-sm">No notes yet.</p>
            ) : notes.map((n) => (
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
