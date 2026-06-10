import Link from 'next/link';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function serverFetch(path, token) {
  if (!token) return null;
  const res = await fetch(`${API}${path}`, {
    headers: { Cookie: `token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function UserDashboard() {
  const user = await requireUser();
  const token = cookies().get('token')?.value;

  const [subs, progressData, recentNotifs] = await Promise.all([
    serverFetch('/subscriptions/mine', token) ?? [],
    serverFetch('/progress', token),
    serverFetch('/notifications', token),
  ]);

  const subsArr = Array.isArray(subs) ? subs : [];
  const active = subsArr.find((s) => s.status === 'trialing' || s.status === 'active');
  const trialDaysLeft = active?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(active.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const entriesArr = progressData?.entries ?? [];
  const recentEntries = entriesArr.slice(0, 5);
  const meditationStreak = progressData?.meditationStreak ?? 0;
  const notifications = (recentNotifs?.notifications ?? []).slice(0, 5);

  return (
    <>
      <div className="mb-10">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Your dashboard</p>
        <h1 className="heading text-4xl font-light mb-1">
          Welcome, {user.fullName?.split(' ')[0] || 'friend'}.
        </h1>
        <p className="text-cream/50 text-sm">Here's a calm overview of your wellness journey.</p>
      </div>

      {!user.emailVerified && (
        <div className="card mb-6 border-gold/30">
          <p className="text-gold text-sm">Please verify your email to unlock all features.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Subscription</p>
          {active ? (
            <>
              <p className="heading text-xl">{active.program.name}</p>
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
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-3">Trial Days Left</p>
          <p className="heading text-3xl sm:text-4xl text-cream">{trialDaysLeft != null ? trialDaysLeft : '—'}</p>
          <p className="text-cream/40 text-xs mt-1">until trial ends</p>
        </div>
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-3">Meditation Streak</p>
          <p className="heading text-3xl sm:text-4xl text-gold">{meditationStreak}</p>
          <p className="text-cream/40 text-xs mt-1">consecutive days</p>
        </div>
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Instructor</p>
          <p className="heading text-lg">{active?.instructor?.fullName || 'Not assigned'}</p>
          {active?.instructor?.expertise && (
            <p className="text-cream/60 text-xs mt-1">{active.instructor.expertise}</p>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading text-xl">Recent activity</h2>
            <Link href="/dashboard/progress" className="text-gold text-xs hover:underline">View all →</Link>
          </div>
          {recentEntries.length === 0 ? (
            <p className="text-cream/60 text-sm">No progress entries yet. <Link href="/dashboard/progress" className="text-gold hover:underline">Start tracking →</Link></p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-gold/10 last:border-0">
                  <p className="text-sm text-cream/80">
                    <span className="text-gold/70 uppercase text-xs tracking-widest mr-2">{e.type}</span>
                    {e.value ?? '—'}
                    {e.note && <span className="text-cream/50"> · {e.note}</span>}
                  </p>
                  <p className="text-cream/40 text-xs ml-3 flex-shrink-0">{new Date(e.recordedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading text-xl">Notifications</h2>
            <Link href="/dashboard/notifications" className="text-gold text-xs hover:underline">View all →</Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-cream/60 text-sm">You're all caught up.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={'py-1.5 border-b border-gold/10 last:border-0 ' + (!n.readAt ? 'opacity-100' : 'opacity-60')}>
                  <p className="text-sm text-cream font-medium">{n.title}</p>
                  <p className="text-cream/60 text-xs">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
