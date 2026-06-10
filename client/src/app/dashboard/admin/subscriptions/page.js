'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_STYLE = {
  active:    { dot: 'bg-green-400',  badge: 'text-green-400  bg-green-400/10  border-green-400/20'  },
  trialing:  { dot: 'bg-gold',       badge: 'text-gold        bg-gold/10        border-gold/20'       },
  expired:   { dot: 'bg-red-400',    badge: 'text-red-400    bg-red-400/10    border-red-400/20'    },
  cancelled: { dot: 'bg-cream/30',   badge: 'text-cream/50   bg-white/5        border-white/10'      },
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs]     = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/subscriptions').then((d) => { setSubs(d); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? subs : subs.filter((s) => s.status === filter);
  const revenue  = subs.filter((s) => s.status === 'active')
    .reduce((acc, s) => acc + (s.program?.priceCents || 0), 0) / 100;

  const counts = {
    all:       subs.length,
    trialing:  subs.filter((s) => s.status === 'trialing').length,
    active:    subs.filter((s) => s.status === 'active').length,
    expired:   subs.filter((s) => s.status === 'expired').length,
    cancelled: subs.filter((s) => s.status === 'cancelled').length,
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Admin · Subscriptions</p>
        <h1 className="heading text-4xl font-light mb-1">Subscriptions</h1>
        <p className="text-cream/50 text-sm">All member program enrollments and their current status.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active',   count: counts.active,   color: 'text-green-400' },
          { label: 'Trialing', count: counts.trialing, color: 'text-gold' },
          { label: 'Expired',  count: counts.expired,  color: 'text-red-400' },
          { label: 'Revenue',  count: `${revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} NPR`, color: 'text-gold' },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-cream/40 text-xs uppercase tracking-widest mb-2">{c.label}</p>
            <p className={`heading text-2xl ${c.color}`}>{c.count}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['all', 'active', 'trialing', 'expired', 'cancelled'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={'px-4 py-1.5 rounded-full text-sm capitalize transition border ' +
              (filter === f
                ? 'bg-gold/20 border-gold text-cream'
                : 'border-gold/20 text-cream/60 hover:border-gold/40 hover:text-cream')}>
            {f} {f !== 'all' && <span className="ml-1 opacity-60">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="text-cream/50 p-6">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-cream/40 text-sm">No subscriptions match this filter.</p>
          </div>
        ) : (
        <>
          {/* Mobile cards (below md) */}
          <ul className="md:hidden divide-y divide-gold/[0.07]">
            {filtered.map((s) => {
              const st = STATUS_STYLE[s.status] || STATUS_STYLE.cancelled;
              const daysLeft = s.trialEndsAt
                ? Math.max(0, Math.ceil((new Date(s.trialEndsAt) - Date.now()) / 86400000))
                : null;
              return (
                <li key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-cream font-medium truncate">{s.user.fullName || s.user.email}</p>
                      <p className="text-cream/50 text-xs truncate">{s.program.name}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${st.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3 text-xs">
                    <span className="text-cream/60">{s.instructor?.fullName ? `Instructor: ${s.instructor.fullName}` : 'No instructor'}</span>
                    {daysLeft != null
                      ? <span className={daysLeft <= 3 ? 'text-red-400' : 'text-cream/50'}>{daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}</span>
                      : <span className="text-cream/30">—</span>}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop table (md and up) */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10">
                {['Member', 'Program', 'Status', 'Instructor', 'Trial ends', 'Started'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-cream/40 text-xs uppercase tracking-widest font-normal first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const st = STATUS_STYLE[s.status] || STATUS_STYLE.cancelled;
                const daysLeft = s.trialEndsAt
                  ? Math.max(0, Math.ceil((new Date(s.trialEndsAt) - Date.now()) / 86400000))
                  : null;
                return (
                  <tr key={s.id} className="border-b border-gold/[0.07] hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5">
                      <p className="text-cream font-medium">{s.user.fullName || s.user.email}</p>
                      {s.user.fullName && <p className="text-cream/40 text-xs">{s.user.email}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-cream/70">{s.program.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-cream/60">{s.instructor?.fullName || '—'}</td>
                    <td className="px-5 py-3.5">
                      {daysLeft != null
                        ? <span className={daysLeft <= 3 ? 'text-red-400 text-xs' : 'text-cream/50 text-xs'}>
                            {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
                          </span>
                        : <span className="text-cream/30 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-cream/40 text-xs">
                      {new Date(s.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
        )}
      </div>
    </>
  );
}
