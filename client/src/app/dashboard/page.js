'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ScoreRing from '@/components/ScoreRing';

export default function UserDashboardPage() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/me').catch(() => null),
      api.get('/wellness/scores').catch(() => null),
      api.get('/subscriptions/mine').catch(() => []),
    ]).then(([u, w, s]) => {
      setUser(u);
      setData(w);
      setSubs(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, []);

  async function toggleItem(id) {
    const res = await api.patch(`/wellness/journey/${id}`);
    setData((d) => ({
      ...d,
      journey: (d?.journey || []).map((j) => (j.id === id ? { ...j, completed: res.completed } : j)),
    }));
  }

  if (loading) return <p className="text-cream/60">Loading…</p>;

  const firstName = user?.fullName?.split(' ')[0] || 'friend';
  const scores = data?.scores;
  const journey = data?.journey || [];
  const active = subs.find((s) => s.status === 'trialing' || s.status === 'active');
  const trialDaysLeft = active?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(active.trialEndsAt) - new Date()) / 86400000))
    : null;

  return (
    <>
      <div className="mb-10">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Your dashboard</p>
        <h1 className="heading text-4xl font-light mb-1">Welcome, {firstName}.</h1>
        <p className="text-cream/50 text-sm">Your wellness journey, quietly organized.</p>
      </div>

      {user && !user.emailVerified && (
        <div className="card mb-6 border-gold/30">
          <p className="text-gold text-sm">Please verify your email to unlock all features.</p>
        </div>
      )}

      {!scores ? (
        <div className="card mb-8 text-center py-10">
          <p className="heading text-2xl mb-2">Discover your Mindful Score</p>
          <p className="text-cream/60 text-sm mb-6 max-w-md mx-auto">
            A short mental, physical, and spiritual assessment unlocks your personalized journey.
          </p>
          <Link href="/dashboard/assessment" className="btn-primary">Take assessment</Link>
        </div>
      ) : (
        <div className="card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-gold tracking-[0.3em] text-xs uppercase mb-1">Mindful Score</p>
              <h2 className="heading text-3xl font-light">{scores.overall}<span className="text-cream/40 text-xl">/100</span></h2>
            </div>
            <Link href="/dashboard/assessment" className="text-gold text-sm hover:underline">Retake assessment →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 justify-items-center">
            <ScoreRing score={scores.mental} label="Mental" size={100} />
            <ScoreRing score={scores.physical} label="Physical" size={100} />
            <ScoreRing score={scores.spiritual} label="Spiritual" size={100} />
          </div>
        </div>
      )}

      {journey.length > 0 && (
        <div className="card mb-8">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Your recommended journey</p>
          <h2 className="heading text-2xl mb-1">Current goal</h2>
          <p className="text-cream/70 text-sm mb-5">{data?.currentGoal || 'Stay consistent'}</p>
          <ul className="space-y-3">
            {journey.map((j) => (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => toggleItem(j.id)}
                  className={
                    'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ' +
                    (j.completed
                      ? 'border-gold/40 bg-gold/10 text-cream/70'
                      : 'border-gold/15 bg-black/20 text-cream hover:border-gold/40')
                  }
                >
                  <span className={
                    'w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ' +
                    (j.completed ? 'border-gold bg-gold text-ink' : 'border-gold/40')
                  }>
                    {j.completed ? '✓' : ''}
                  </span>
                  <span className={j.completed ? 'line-through' : ''}>{j.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Subscription</p>
          {active ? (
            <>
              <p className="heading text-xl">{active.program?.name}</p>
              <p className="text-gold/80 text-xs uppercase tracking-widest mt-1">{active.status}</p>
            </>
          ) : (
            <>
              <p className="heading text-xl">No active plan</p>
              <Link href="/dashboard/programs" className="text-gold text-xs hover:underline">Start free trial →</Link>
            </>
          )}
        </div>
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-3">Trial days left</p>
          <p className="heading text-3xl text-cream">{trialDaysLeft != null ? trialDaysLeft : '—'}</p>
        </div>
        <Link href="/dashboard/meditation" className="card hover:border-gold/40 transition block">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Meditation</p>
          <p className="heading text-xl text-gold">Practice →</p>
        </Link>
        <Link href="/dashboard/travel" className="card hover:border-gold/40 transition block">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Travel</p>
          <p className="heading text-xl text-gold">Explore →</p>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/diet', title: 'Diet hub', desc: 'Profile, meal plans, consult booking' },
          { href: '/dashboard/meditation', title: 'Meditation center', desc: 'Guided sits & daily practice' },
          { href: '/dashboard/travel', title: 'Spiritual travel', desc: 'Retreats & monastery finder' },
          { href: '/dashboard/journal', title: 'Journal', desc: 'Mood, gratitude, reflections' },
          { href: '/dashboard/events', title: 'Events', desc: 'Retreats, talks, sessions' },
          { href: '/dashboard/courses', title: 'Courses', desc: 'Learn once, keep forever' },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="card hover:border-gold/40 transition block">
            <h3 className="heading text-xl mb-1">{x.title}</h3>
            <p className="text-cream/50 text-sm">{x.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
