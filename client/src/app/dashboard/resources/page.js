'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const CATEGORIES = [
  { id: '',           label: 'All' },
  { id: 'diet',       label: 'Diet' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'counseling', label: 'Counseling' },
  { id: 'general',    label: 'General' },
];

const TYPE_ICONS = { pdf: '📄', video: '▶', audio: '🎵', image: '🖼', article: '📝' };

export default function ResourcesPage() {
  const [tab, setTab] = useState('library');
  const [resources, setResources] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [category, setCategory] = useState('');
  const [programId, setProgramId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/assigned-resources').then(setAssigned).catch(() => {});
    // programs list for filter (use public endpoint)
    api.get('/programs').then((p) => setPrograms(Array.isArray(p) ? p : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'library') return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    if (programId) qs.set('programId', programId);
    api.get(`/resources${qs.toString() ? '?' + qs : ''}`).then((r) => { setResources(r); setLoading(false); });
  }, [category, programId, tab]);

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Library</p>
      <h1 className="heading text-4xl font-light mb-6">Resources</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gold/20">
        {[['library', 'Resource library'], ['assigned', `Assigned to me (${assigned.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={'px-5 py-2.5 text-sm transition border-b-2 -mb-px ' +
              (tab === id ? 'border-gold text-gold' : 'border-transparent text-cream/60 hover:text-cream')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'assigned' && (
        <>
          {assigned.length === 0 ? (
            <p className="text-cream/60">No resources have been assigned to you yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assigned.map((a) => (
                <Link key={a.id} href={`/dashboard/resources/${a.resource.id}`}
                  className="card hover:border-gold/40 transition block">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gold/80 text-xs uppercase tracking-widest">
                      {TYPE_ICONS[a.resource.type]} {a.resource.type}
                    </span>
                    {a.resource.isPremium && <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">Premium</span>}
                  </div>
                  <h3 className="heading text-xl mb-2">{a.resource.title}</h3>
                  {a.resource.description && <p className="text-cream/60 text-sm line-clamp-2">{a.resource.description}</p>}
                  {a.note && <p className="text-cream/50 text-xs mt-2 italic">Note: {a.note}</p>}
                  <p className="text-cream/40 text-xs mt-3">From {a.assignedBy?.fullName || 'your instructor'}</p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'library' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((c) => (
              <button key={c.id || 'all'} onClick={() => setCategory(c.id)}
                className={'px-4 py-1.5 rounded-full text-sm transition ' +
                  (category === c.id ? 'bg-gold/20 border border-gold text-cream' : 'border border-gold/30 text-cream/70 hover:border-gold/60')}>
                {c.label}
              </button>
            ))}
          </div>
          {programs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setProgramId('')}
                className={'px-4 py-1.5 rounded-full text-sm transition ' +
                  (!programId ? 'bg-gold/20 border border-gold text-cream' : 'border border-gold/30 text-cream/70 hover:border-gold/60')}>
                All programs
              </button>
              {programs.map((p) => (
                <button key={p.id} onClick={() => setProgramId(String(p.id))}
                  className={'px-4 py-1.5 rounded-full text-sm transition ' +
                    (programId === String(p.id) ? 'bg-gold/20 border border-gold text-cream' : 'border border-gold/30 text-cream/70 hover:border-gold/60')}>
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-cream/60">Loading…</p>
          ) : resources.length === 0 ? (
            <p className="text-cream/60">No resources found.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((r) => (
                <Link key={r.id} href={`/dashboard/resources/${r.id}`} className="card hover:border-gold/40 transition block">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gold/80 text-xs uppercase tracking-widest">
                      {TYPE_ICONS[r.type]} {r.type}
                    </span>
                    {r.isPremium && <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">Premium</span>}
                  </div>
                  <h3 className="heading text-xl mb-2">{r.title}</h3>
                  {r.description && <p className="text-cream/60 text-sm line-clamp-3">{r.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-cream/40 text-xs uppercase tracking-widest">{r.category}</p>
                    {r.program && <p className="text-gold/60 text-xs">{r.program.name}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
