'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const GOALS = [
  { id: 'weight_loss',         label: 'Weight Loss' },
  { id: 'better_sleep',        label: 'Better Sleep' },
  { id: 'stress_reduction',    label: 'Stress Reduction' },
  { id: 'meditation_practice', label: 'Meditation Practice' },
  { id: 'anxiety_management',  label: 'Anxiety Management' },
  { id: 'healthy_lifestyle',   label: 'Healthy Lifestyle' },
  { id: 'emotional_wellness',  label: 'Emotional Wellness' },
  { id: 'fitness_nutrition',   label: 'Fitness & Nutrition' },
];

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', fullName: '', role: 'user',
    age: '', gender: '', wellnessGoals: [],
    expertise: '', bio: '', availability: '',
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const loginUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/login';

  function toggleGoal(id) {
    setForm((f) => ({
      ...f,
      wellnessGoals: f.wellnessGoals.includes(id)
        ? f.wellnessGoals.filter((g) => g !== id)
        : [...f.wellnessGoals, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : null,
      };
      const res = await api.post('/admin/users', payload);
      setResult(res);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <>
      <Link href="/dashboard/admin/users" className="text-cream/60 hover:text-gold text-sm">← Back</Link>
      <h1 className="heading text-4xl font-light mt-6 mb-8">Create user</h1>

      {result ? (
        <div className="card">
          <h2 className="heading text-2xl mb-4">User created</h2>
          <div className="rounded-xl border border-gold/20 bg-black/30 divide-y divide-gold/10">
            <div className="px-4 py-3">
              <p className="text-cream/40 text-xs uppercase tracking-widest mb-1">Email</p>
              <p className="text-cream">{result.email}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-cream/40 text-xs uppercase tracking-widest mb-1">Temporary password</p>
              <code className="text-gold font-mono text-lg tracking-wide">{result.tempPassword}</code>
            </div>
            <div className="px-4 py-3">
              <p className="text-cream/40 text-xs uppercase tracking-widest mb-1">Login URL</p>
              <a href={loginUrl} target="_blank" rel="noreferrer" className="text-gold hover:underline break-all">{loginUrl}</a>
            </div>
          </div>
          {result.emailSent ? (
            <p className="text-green-400/80 text-sm mt-4">✓ Login email sent to {result.email} with the password and a login link.</p>
          ) : (
            <p className="text-yellow-400/80 text-sm mt-4">
              ⚠ Email was not sent {result.emailError ? `(${result.emailError})` : '(SMTP not configured)'}.
              Please share the email, temporary password and login URL with the user manually.
            </p>
          )}
          <button onClick={() => router.push('/dashboard/admin/users')} className="btn-primary mt-6">Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <h2 className="heading text-xl mb-3">Account</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Role *</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="heading text-xl mb-3">Personal info</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label className="label">Age</label>
                <input className="input" type="number" min="1" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">— Select —</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {form.role === 'user' && (
            <div>
              <h2 className="heading text-xl mb-3">Wellness goals</h2>
              <p className="text-cream/50 text-xs mb-3">Filling these skips onboarding for the user.</p>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => {
                  const active = form.wellnessGoals.includes(g.id);
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGoal(g.id)}
                      className={'px-3 py-2 rounded-xl border text-left text-sm transition ' +
                        (active ? 'bg-gold/15 border-gold text-cream' : 'bg-black/40 border-gold/20 text-cream/70 hover:border-gold/50')}>
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {form.role === 'instructor' && (
            <div>
              <h2 className="heading text-xl mb-3">Instructor profile</h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Expertise</label>
                  <input className="input" placeholder="e.g. Clinical Dietitian" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} />
                </div>
                <div>
                  <label className="label">Availability</label>
                  <input className="input" placeholder="Mon–Fri · 10am–6pm" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button>
        </form>
      )}
    </>
  );
}
