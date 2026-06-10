'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function MyProgramsPage() {
  const router = useRouter();
  const [subs, setSubs] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const [totalPrograms, setTotalPrograms] = useState(0);

  async function reload() {
    setLoading(true);
    const [mine, all] = await Promise.all([
      api.get('/subscriptions/mine'),
      api.get('/programs'),
    ]);
    setSubs(mine);
    setTotalPrograms(Array.isArray(all) ? all.length : 0);
    const ownedSlugs = new Set(mine.map((s) => s.program.slug));
    setAvailable(all.filter((p) => !ownedSlugs.has(p.slug)));
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  async function startTrial(slug) {
    setBusy(slug);
    try {
      await api.post('/subscriptions/start-trial', { programSlug: slug });
      await reload();
      router.refresh(); // invalidate cached server components (e.g. dashboard)
    } catch (e) {
      alert(e.message);
    } finally { setBusy(''); }
  }

  async function cancel(id) {
    if (!confirm('Cancel this subscription?')) return;
    await api.post(`/subscriptions/${id}/cancel`);
    await reload();
    router.refresh(); // invalidate cached server components (e.g. dashboard)
  }

  if (loading) return <p className="text-cream/60">Loading…</p>;

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">My programs</p>
      <h1 className="heading text-4xl font-light mb-8">Your wellness plans</h1>

      {totalPrograms === 0 ? (
        <div className="card text-center py-16">
          <p className="heading text-2xl mb-2">No programs yet</p>
          <p className="text-cream/60 text-sm">Programs will appear here once they're added. Please check back later.</p>
        </div>
      ) : (
        <>
          {subs.length > 0 ? (
            <div className="space-y-4 mb-12">
              {subs.map((s) => (
                <div key={s.id} className="card flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="heading text-2xl">{s.program.name}</h3>
                    <p className="text-gold/80 text-xs uppercase tracking-widest mt-1">{s.status}</p>
                    {s.trialEndsAt && (
                      <p className="text-cream/60 text-sm mt-2">
                        Trial ends: {new Date(s.trialEndsAt).toLocaleDateString()}
                      </p>
                    )}
                    {s.instructor && (
                      <p className="text-cream/60 text-sm mt-1">Instructor: {s.instructor.fullName}</p>
                    )}
                  </div>
                  {s.status !== 'cancelled' && s.status !== 'expired' && (
                    <button onClick={() => cancel(s.id)} className="text-cream/60 hover:text-red-400 text-sm">Cancel</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream/60 mb-12">You haven't started any programs yet.</p>
          )}

          {available.length > 0 ? (
            <>
              <h2 className="heading text-2xl mb-6">Add a program</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {available.map((p) => (
                  <div key={p.id} className="card flex flex-col">
                    <h3 className="heading text-2xl mb-3">{p.name}</h3>
                    <p className="text-cream/70 text-sm mb-4 flex-1">{p.description}</p>
                    <p className="text-gold heading text-xl mb-1">{(p.priceCents / 100).toLocaleString()} {p.currency}</p>
                    <p className="text-cream/50 text-xs mb-4">{p.trialDays}-day free trial</p>
                    <button
                      className="btn-primary w-full"
                      onClick={() => startTrial(p.slug)}
                      disabled={busy === p.slug}
                    >
                      {busy === p.slug ? 'Starting…' : 'Start free trial'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : subs.length > 0 ? (
            <p className="text-cream/60">You're enrolled in every available program.</p>
          ) : null}
        </>
      )}
    </>
  );
}
