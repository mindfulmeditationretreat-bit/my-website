import { cookies } from 'next/headers';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';

async function fetchStats() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = cookies().get('token')?.value;
  if (!token) return null;
  const res = await fetch(`${apiUrl}/admin/stats`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store',
  });
  return res.ok ? res.json() : null;
}

const NAV_ITEMS = [
  { href: '/dashboard/admin/users',         title: 'Users',         desc: 'Create, edit, deactivate accounts and assign programs.' },
  { href: '/dashboard/admin/instructors',   title: 'Instructors',   desc: 'Manage instructors, specialties and assignments.' },
  { href: '/dashboard/admin/programs',      title: 'Programs',      desc: 'Edit pricing, trial length and program details.' },
  { href: '/dashboard/admin/subscriptions', title: 'Subscriptions', desc: 'Track active, trialing and expired subscriptions.' },
  { href: '/dashboard/admin/resources',     title: 'Content',       desc: 'Upload and manage articles, videos, PDFs and audio.' },
  { href: '/dashboard/admin/analytics',     title: 'Analytics',     desc: 'Platform metrics, revenue and conversion data.' },
  { href: '/dashboard/admin/broadcasts',    title: 'Broadcasts',    desc: 'Send in-app and email announcements to members.' },
];

export default async function AdminDashboard() {
  await requireUser({ role: 'admin' });
  const s = await fetchStats();

  const total  = (s?.activeSubs ?? 0) + (s?.trialSubs ?? 0);
  const activeW = total > 0 ? Math.round((s.activeSubs / total) * 100) : 0;
  const trialW  = total > 0 ? Math.round((s.trialSubs  / total) * 100) : 0;

  return (
    <>
      <div className="mb-10">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Admin Dashboard</p>
        <h1 className="heading text-4xl font-light mb-1">Platform overview</h1>
        <p className="text-cream/50 text-sm">Welcome back. Here's what's happening on Mindful today.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Members', value: s?.totalUsers  ?? '—', sub: 'registered users',   color: 'text-cream' },
          { label: 'Active Subs',   value: s?.activeSubs  ?? '—', sub: 'paying subscribers', color: 'text-green-400' },
          { label: 'On Trial',      value: s?.trialSubs   ?? '—', sub: '14-day free trial',  color: 'text-gold' },
          { label: 'Revenue (NPR)', value: s?.revenue != null ? Number(s.revenue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—', sub: 'active subs only', color: 'text-gold' },
        ].map((k) => (
          <div key={k.label} className="card">
            <p className="text-cream/50 text-xs uppercase tracking-widest mb-3">{k.label}</p>
            <p className={`heading text-3xl sm:text-4xl ${k.color}`}>{k.value}</p>
            <p className="text-cream/40 text-xs mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Subscription breakdown bar */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-cream/70 text-sm font-medium">Subscription breakdown</p>
          <p className="text-cream/40 text-xs">{total} total · {s?.conversionRate ?? 0}% conversion</p>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5 mb-4">
          {activeW > 0 && <div className="bg-green-500/70 transition-all" style={{ width: `${activeW}%` }} />}
          {trialW  > 0 && <div className="bg-gold/60 transition-all"     style={{ width: `${trialW}%` }} />}
          {(100 - activeW - trialW) > 0 && <div className="bg-white/10 flex-1" />}
        </div>
        <div className="flex flex-wrap gap-5 text-xs">
          <span className="flex items-center gap-2 text-cream/60"><span className="w-2 h-2 rounded-sm bg-green-500/70 inline-block" />Active {activeW}%</span>
          <span className="flex items-center gap-2 text-cream/60"><span className="w-2 h-2 rounded-sm bg-gold/60 inline-block" />Trialing {trialW}%</span>
          <span className="flex items-center gap-2 text-cream/60"><span className="w-2 h-2 rounded-sm bg-white/10 inline-block" />Other {100 - activeW - trialW}%</span>
        </div>
      </div>

      {/* Navigation grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className="card group hover:border-gold/50 hover:bg-white/[0.05] transition-all duration-200 flex flex-col gap-2">
            <h3 className="heading text-lg group-hover:text-gold transition">{item.title}</h3>
            <p className="text-cream/50 text-xs leading-relaxed flex-1">{item.desc}</p>
            <span className="text-gold/50 text-xs mt-2 group-hover:text-gold transition">Manage →</span>
          </Link>
        ))}
        <div className="card flex flex-col gap-2">
          <h3 className="heading text-lg">Instructors</h3>
          <p className="heading text-4xl text-gold">{s?.instructorCount ?? '—'}</p>
          <p className="text-cream/50 text-xs">active on platform</p>
        </div>
      </div>
    </>
  );
}
