'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

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

function formatGoals(goals) {
  return goals.slice(0, 3).join(', ').replace(/_/g, ' ');
}

export default function InstructorUsersPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/providers/me/users')
      .then((d) => {
        if (cancelled) return;
        setSubs(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Failed to load assigned members');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="text-cream/60">Loading…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Provider</p>
      <h1 className="heading text-4xl font-light mb-8">Assigned members</h1>

      {subs.length === 0 ? (
        <p className="text-cream/60">No members assigned yet. An admin will assign clients to you.</p>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => {
            const goals = goalsList(s.user?.wellnessGoals);
            const userId = s.user?.id;
            const content = (
              <>
                <div>
                  <h3 className="heading text-xl">{s.user?.fullName || s.user?.email || 'Unknown member'}</h3>
                  <p className="text-cream/60 text-sm mt-1">{s.program?.name ?? '—'} · {s.status}</p>
                  {goals.length > 0 && (
                    <p className="text-cream/50 text-xs mt-1">Goals: {formatGoals(goals)}</p>
                  )}
                </div>
                <span className="text-gold text-sm">View →</span>
              </>
            );
            if (!userId) {
              return (
                <div key={s.id} className="card flex items-center justify-between opacity-60">
                  {content}
                </div>
              );
            }
            return (
              <Link key={s.id} href={`/dashboard/provider/users/${userId}`} className="card flex items-center justify-between hover:border-gold/40 transition">
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
