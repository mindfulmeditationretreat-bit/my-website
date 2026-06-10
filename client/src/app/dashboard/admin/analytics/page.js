'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function Bar({ label, value, max, color = 'bg-gold' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-cream/60 text-xs w-24 flex-shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-cream text-xs w-8 text-right">{value}</span>
    </div>
  );
}

function DonutRing({ active, trial, other }) {
  const total = active + trial + other;
  if (total === 0) return <div className="w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center text-cream/40 text-xs">No data</div>;

  const r = 54;
  const circ = 2 * Math.PI * r;
  const aFrac = active / total;
  const tFrac = trial  / total;

  const aDash = aFrac * circ;
  const tDash = tFrac * circ;

  const aOffset = 0;
  const tOffset = -aDash;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
        {/* background */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {/* active (green) */}
        {aDash > 0 && (
          <circle cx="60" cy="60" r={r} fill="none" stroke="#4ade80" strokeWidth="12"
            strokeDasharray={`${aDash} ${circ - aDash}`}
            strokeDashoffset={aOffset} strokeLinecap="round" />
        )}
        {/* trialing (gold) */}
        {tDash > 0 && (
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e1b368" strokeWidth="12"
            strokeDasharray={`${tDash} ${circ - tDash}`}
            strokeDashoffset={tOffset} strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="heading text-xl text-cream">{total}</span>
        <span className="text-cream/40 text-xs">total</span>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(setStats); }, []);

  const s = stats;
  const active    = s?.activeSubs    ?? 0;
  const trial     = s?.trialSubs     ?? 0;
  const total     = s?.totalUsers    ?? 0;
  const revenue   = s?.revenue       ?? 0;
  const conv      = s?.conversionRate ?? 0;
  const instrCount= s?.instructorCount ?? 0;

  const maxBar = Math.max(active, trial, instrCount, 1);

  return (
    <>
      <div className="mb-8">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Admin · Analytics</p>
        <h1 className="heading text-4xl font-light mb-1">Analytics</h1>
        <p className="text-cream/50 text-sm">Platform health and revenue overview.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total members',  value: total,    color: 'text-cream' },
          { label: 'Active subs',    value: active,   color: 'text-green-400' },
          { label: 'On trial',       value: trial,    color: 'text-gold' },
          { label: 'Instructors',    value: instrCount, color: 'text-blue-300' },
          { label: 'Conversion',     value: `${conv}%`, color: 'text-gold' },
          { label: 'Revenue (NPR)',  value: revenue > 0 ? revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—', color: 'text-gold' },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-cream/40 text-xs uppercase tracking-widest mb-3">{k.label}</p>
            <p className={`heading text-3xl ${k.color}`}>{k.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">

        {/* Subscription donut */}
        <div className="card">
          <h3 className="heading text-lg mb-6">Subscription mix</h3>
          <div className="flex items-center gap-8">
            <DonutRing active={active} trial={trial} other={0} />
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-cream/70 text-sm">Active</span>
                <span className="ml-auto heading text-lg text-green-400">{active}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-gold flex-shrink-0" />
                <span className="text-cream/70 text-sm">Trialing</span>
                <span className="ml-auto heading text-lg text-gold">{trial}</span>
              </div>
              <div className="border-t border-gold/10 pt-3 flex items-center gap-2.5">
                <span className="text-cream/50 text-xs">Conversion rate</span>
                <span className="ml-auto text-gold font-medium">{conv}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="card">
          <h3 className="heading text-lg mb-6">Revenue snapshot</h3>
          <div className="text-center mb-6">
            <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">Monthly revenue (active subs)</p>
            <p className="heading text-4xl text-gold">
              {revenue > 0 ? revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
              <span className="text-cream/40 text-sm ml-2">NPR</span>
            </p>
          </div>
          <div className="border-t border-gold/10 pt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-cream/40 text-xs uppercase tracking-widest mb-1">Per active user</p>
              <p className="heading text-xl text-cream">
                {active > 0 ? Math.round(revenue / active).toLocaleString() : '—'}
                <span className="text-cream/40 text-xs ml-1">NPR</span>
              </p>
            </div>
            <div>
              <p className="text-cream/40 text-xs uppercase tracking-widest mb-1">Active users</p>
              <p className="heading text-xl text-green-400">{active}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="heading text-lg mb-6">Platform overview</h3>
        <div className="space-y-4">
          <Bar label="Active subs"  value={active}     max={maxBar} color="bg-green-500/70" />
          <Bar label="Trialing"     value={trial}      max={maxBar} color="bg-gold/70" />
          <Bar label="Instructors"  value={instrCount} max={maxBar} color="bg-blue-400/70" />
          <Bar label="Total users"  value={total}      max={Math.max(total, 1)} color="bg-white/30" />
        </div>
        <p className="text-cream/30 text-xs mt-6">
          Data reflects current database state. Historical trends and cohort analytics can be added by extending <code className="text-gold">/api/admin/stats</code>.
        </p>
      </div>
    </>
  );
}
