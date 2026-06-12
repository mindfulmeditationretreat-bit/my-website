'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminInstructorsPage() {
  const [list, setList] = useState([]);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    api.get('/admin/users?role=instructor').then(setList);
  }, []);

  async function approve(id) {
    setApproving(id);
    try {
      await api.patch(`/admin/users/${id}`, { active: true });
      setList((prev) => prev.map((u) => u.id === id ? { ...u, active: true } : u));
    } finally {
      setApproving(null);
    }
  }

  const pending  = list.filter((u) => !u.active);
  const approved = list.filter((u) => u.active);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Admin</p>
          <h1 className="heading text-4xl font-light">Providers</h1>
        </div>
        <Link href="/dashboard/admin/users/new" className="btn-primary">+ Add provider</Link>
      </div>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="heading text-xl mb-4 flex items-center gap-2">
            Pending Approval
            <span className="text-xs font-normal bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 rounded-full px-2.5 py-0.5">
              {pending.length}
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {pending.map((u) => (
              <div key={u.id} className="card border-yellow-400/20 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="heading text-lg truncate">{u.fullName || u.email}</h3>
                  <p className="text-cream/60 text-sm mt-0.5 truncate">{u.email}</p>
                  {u.expertise && <p className="text-gold/70 text-xs uppercase tracking-widest mt-2">{u.expertise}</p>}
                  <p className="text-yellow-400/80 text-xs mt-2">Awaiting approval</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve(u.id)}
                    disabled={approving === u.id}
                    className="btn-primary py-1.5 px-4 text-sm">
                    {approving === u.id ? 'Approving…' : 'Approve'}
                  </button>
                  <Link href={`/dashboard/admin/users/${u.id}`}
                    className="text-cream/50 hover:text-gold text-xs text-center transition">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="heading text-xl mb-4">Active Providers</h2>
        {approved.length === 0 ? (
          <p className="text-cream/40 text-sm">No active providers yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {approved.map((u) => (
              <Link key={u.id} href={`/dashboard/admin/users/${u.id}`} className="card hover:border-gold/40 transition">
                <h3 className="heading text-xl">{u.fullName || u.email}</h3>
                <p className="text-cream/60 text-sm mt-1">{u.email}</p>
                {u.expertise && <p className="text-gold/70 text-xs uppercase tracking-widest mt-2">{u.expertise}</p>}
                <p className="text-green-400/70 text-xs mt-2">Active</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
