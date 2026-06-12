import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth';

async function fetchData() {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = cookies().get('token')?.value;
  if (!token) return { users: [], unread: 0 };
  const [usersRes, notifRes] = await Promise.all([
    fetch(`${apiUrl}/providers/me/users`, { headers: { Cookie: `token=${token}` }, cache: 'no-store' }),
    fetch(`${apiUrl}/notifications`, { headers: { Cookie: `token=${token}` }, cache: 'no-store' }),
  ]);
  return {
    users: usersRes.ok ? await usersRes.json() : [],
    unread: notifRes.ok ? (await notifRes.json()).unread : 0,
  };
}

export default async function InstructorDashboard() {
  const user = await requireUser({ role: 'instructor' });
  const { users, unread } = await fetchData();

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Provider</p>
      <h1 className="heading text-4xl font-light mb-2">Welcome, {user.fullName || 'provider'}.</h1>
      <p className="text-cream/60 mb-10">{user.expertise || 'Wellness provider'}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Assigned members</p>
          <p className="heading text-3xl">{users.length}</p>
        </div>
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Unread notifications</p>
          <p className="heading text-3xl">{unread}</p>
        </div>
        <div className="card">
          <p className="text-cream/50 text-xs uppercase tracking-widest mb-2">Active programs</p>
          <p className="heading text-3xl">{new Set(users.map((s) => s.program.id)).size}</p>
        </div>
      </div>
    </>
  );
}
