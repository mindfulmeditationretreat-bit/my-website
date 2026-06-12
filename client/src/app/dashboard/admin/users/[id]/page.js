'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Select from '@/components/Select';

const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_STYLE = {
  trialing:  'bg-gold/15 text-gold border-gold/30',
  active:    'bg-green-500/15 text-green-400 border-green-500/30',
  expired:   'bg-red-500/10 text-red-400/80 border-red-500/20',
  cancelled: 'bg-white/5 text-cream/50 border-white/10',
};

function StatusPill({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] uppercase tracking-widest ${STATUS_STYLE[status] || STATUS_STYLE.cancelled}`}>
      {status}
    </span>
  );
}

// Compute trial timeline from a subscription record.
function trialInfo(s) {
  if (!s.trialStartedAt || !s.trialEndsAt) return null;
  const dayMs = 86400000;
  const start = new Date(s.trialStartedAt);
  const end = new Date(s.trialEndsAt);
  const now = new Date();
  const totalDays = Math.max(1, Math.round((end - start) / dayMs));
  const elapsed = Math.min(totalDays, Math.max(0, Math.floor((now - start) / dayMs)));
  const left = Math.max(0, Math.ceil((end - now) / dayMs));
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  return { start, end, totalDays, elapsed, left, pct, expired: now > end };
}

export default function AdminUserEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({});
  const [assignForm, setAssignForm] = useState({ programId: '', instructorId: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    const [u, instrs, progs] = await Promise.all([
      api.get(`/admin/users/${id}`),
      api.get('/instructors'),
      api.get('/admin/programs'),
    ]);
    setUser(u);
    setInstructors(instrs);
    setPrograms(progs.filter((p) => p.active));
    setForm({ fullName: u.fullName || '', role: u.role, active: u.active, expertise: u.expertise || '', bio: u.bio || '', availability: u.availability || '' });
  }
  useEffect(() => { load(); }, [id]);

  async function save(e) {
    e.preventDefault();
    setMsg('');
    try { await api.patch(`/admin/users/${id}`, form); setMsg('Saved.'); await load(); }
    catch (err) { setMsg(err.message); }
  }

  async function assignInstructor(subId, instructorId) {
    await api.post(`/admin/subscriptions/${subId}/assign-instructor`, { instructorId: instructorId || null });
    setMsg('Instructor updated.');
    await load();
  }

  async function handleAssignProgram(e) {
    e.preventDefault();
    setMsg('');
    if (!assignForm.programId) return;
    try {
      await api.post(`/admin/users/${id}/assign-program`, {
        programId: Number(assignForm.programId),
        instructorId: assignForm.instructorId ? Number(assignForm.instructorId) : undefined,
      });
      setAssignForm({ programId: '', instructorId: '' });
      setMsg('Program assigned successfully.');
      await load();
    } catch (err) { setMsg(err.message); }
  }

  async function deleteUser() {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    await api.delete(`/admin/users/${id}`);
    router.push('/dashboard/admin/users');
  }

  if (!user) return <p className="text-cream/60">Loading…</p>;

  const enrolledProgramIds = new Set((user.subscriptions || []).map((s) => s.programId));
  const availablePrograms = programs.filter((p) => !enrolledProgramIds.has(p.id));
  const subs = user.subscriptions || [];

  const instructorOptions = instructors.map((i) => ({ value: String(i.id), label: i.expertise ? `${i.fullName} · ${i.expertise}` : i.fullName }));
  const programOptions = availablePrograms.map((p) => ({ value: String(p.id), label: `${p.name} · ${p.trialDays}-day trial` }));

  const initial = (user.fullName || user.email || '?').trim()[0]?.toUpperCase() || '?';

  return (
    <>
      <Link href="/dashboard/admin/users" className="text-cream/60 hover:text-gold text-sm">← Back to users</Link>

      {/* Header */}
      <div className="card mt-4 mb-6 flex flex-wrap items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-cream/80 text-2xl flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="heading text-3xl font-light leading-tight truncate">{user.fullName || user.email}</h1>
          <p className="text-cream/50 text-sm truncate">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-[11px] uppercase tracking-widest">{user.role}</span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] uppercase tracking-widest ${user.active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400/80 border-red-500/20'}`}>
              {user.active ? 'Active' : 'Inactive'}
            </span>
            <span className="text-cream/40 text-xs">· Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="heading text-3xl text-gold">{subs.length}</p>
          <p className="text-cream/40 text-xs uppercase tracking-widest">subscription{subs.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {msg && <div className="card mb-6 border-gold/40"><p className="text-gold text-sm">{msg}</p></div>}

      {/* Account details */}
      <form onSubmit={save} className="card space-y-5 mb-6">
        <div>
          <h2 className="heading text-2xl">Account details</h2>
          <p className="text-cream/50 text-sm mt-1">Manage this member's name, role and account status.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <Select options={ROLES} value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          </div>
        </div>

        {form.role === 'instructor' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Expertise</label>
              <input className="input" placeholder="e.g. Clinical nutrition" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} />
            </div>
            <div>
              <label className="label">Availability</label>
              <input className="input" placeholder="Mon–Fri · 10am–6pm" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Bio</label>
              <textarea className="input" rows={3} placeholder="Short professional bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
        )}

        {/* Active toggle */}
        <label className="flex items-center justify-between gap-4 rounded-xl border border-gold/15 bg-black/20 px-4 py-3 cursor-pointer">
          <span>
            <span className="text-cream text-sm">Account active</span>
            <span className="block text-cream/40 text-xs">Inactive accounts cannot log in.</span>
          </span>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-gold" />
        </label>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button className="btn-primary">Save changes</button>
          <button type="button" onClick={deleteUser} className="text-red-400/80 hover:text-red-400 text-sm hover:underline">Delete user</button>
        </div>
      </form>

      {/* Subscriptions & instructors */}
      <div className="card mb-6">
        <div className="mb-5">
          <h2 className="heading text-2xl">Subscriptions &amp; instructors</h2>
          <p className="text-cream/50 text-sm mt-1">Track each plan's trial timeline and assign the instructor who will support this member.</p>
        </div>

        {subs.length === 0 ? (
          <p className="text-cream/50 text-sm">No subscriptions yet. Enrol this member in a program below.</p>
        ) : (
          <div className="space-y-4">
            {subs.map((s) => {
              const ti = trialInfo(s);
              return (
                <div key={s.id} className="rounded-2xl border border-gold/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="heading text-xl">{s.program.name}</h3>
                        <StatusPill status={s.status} />
                      </div>
                      {ti && (
                        <p className="text-cream/40 text-xs mt-1">
                          Started {ti.start.toLocaleDateString()} · Ends {ti.end.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Trial progress */}
                  {ti && s.status === 'trialing' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-cream/60">Day {ti.elapsed} of {ti.totalDays}</span>
                        <span className={ti.left <= 3 ? 'text-red-400' : 'text-gold'}>
                          {ti.expired ? 'Trial ended' : `${ti.left} day${ti.left === 1 ? '' : 's'} left`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full transition-all ${ti.left <= 3 ? 'bg-red-500/70' : 'bg-gold/70'}`} style={{ width: `${ti.pct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Instructor assignment */}
                  <div className="sm:max-w-sm">
                    <label className="label">Assigned instructor</label>
                    {instructors.length === 0 ? (
                      <p className="text-cream/40 text-xs">No instructors available. Create one from the Instructors page.</p>
                    ) : (
                      <Select
                        options={[{ value: '', label: '— No instructor —' }, ...instructorOptions]}
                        value={s.instructorId ? String(s.instructorId) : ''}
                        onChange={(v) => assignInstructor(s.id, v ? Number(v) : null)}
                        placeholder="— No instructor —"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enrol in a program */}
      <form onSubmit={handleAssignProgram} className="card mb-6 space-y-5">
        <div>
          <h2 className="heading text-2xl">Enrol in a program</h2>
          <p className="text-cream/50 text-sm mt-1">Start a new trial for this member and optionally assign an instructor right away.</p>
        </div>
        {programs.length === 0 ? (
          <p className="text-cream/50 text-sm">No programs yet. Add a program from the Programs page before you can enrol users.</p>
        ) : availablePrograms.length === 0 ? (
          <p className="text-cream/50 text-sm">This user is already enrolled in every available program.</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Program</label>
                <Select options={programOptions} value={assignForm.programId} onChange={(v) => setAssignForm({ ...assignForm, programId: v })} placeholder="— Select program —" />
              </div>
              <div>
                <label className="label">Assign instructor (optional)</label>
                <Select
                  options={[{ value: '', label: '— No instructor yet —' }, ...instructorOptions]}
                  value={assignForm.instructorId}
                  onChange={(v) => setAssignForm({ ...assignForm, instructorId: v })}
                  placeholder="— No instructor yet —"
                />
              </div>
            </div>
            <button className="btn-primary" disabled={!assignForm.programId}>Enrol</button>
          </>
        )}
      </form>

    </>
  );
}
