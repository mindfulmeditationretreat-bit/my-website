'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function InstructorUsersPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/providers/me/users').then((d) => { setSubs(d); setLoading(false); });
  }, []);

  if (loading) return <p className="text-cream/60">Loading…</p>;

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Provider</p>
      <h1 className="heading text-4xl font-light mb-8">Assigned members</h1>

      {subs.length === 0 ? (
        <p className="text-cream/60">No members assigned yet. An admin will assign clients to you.</p>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <Link key={s.id} href={`/dashboard/provider/users/${s.user.id}`} className="card flex items-center justify-between hover:border-gold/40 transition">
              <div>
                <h3 className="heading text-xl">{s.user.fullName || s.user.email}</h3>
                <p className="text-cream/60 text-sm mt-1">{s.program.name} · {s.status}</p>
                {s.user.wellnessGoals?.length > 0 && (
                  <p className="text-cream/50 text-xs mt-1">Goals: {s.user.wellnessGoals.slice(0, 3).join(', ').replaceAll('_', ' ')}</p>
                )}
              </div>
              <span className="text-gold text-sm">View →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
