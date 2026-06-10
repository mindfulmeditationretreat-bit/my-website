'use client';
import { useEffect, useRef, useState } from 'react';
import { api, assetUrl } from '@/lib/api';
import Select from '@/components/Select';

const GOALS = [
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'better_sleep', label: 'Better Sleep' },
  { id: 'stress_reduction', label: 'Stress Reduction' },
  { id: 'meditation_practice', label: 'Meditation Practice' },
  { id: 'anxiety_management', label: 'Anxiety Management' },
  { id: 'healthy_lifestyle', label: 'Healthy Lifestyle' },
  { id: 'emotional_wellness', label: 'Emotional Wellness' },
  { id: 'fitness_nutrition', label: 'Fitness & Nutrition' },
];

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const NOTIF_PREFS = [
  { id: 'email_messages', label: 'Email me when I receive a message' },
  { id: 'email_trial_ending', label: 'Email me when my trial is ending' },
  { id: 'email_broadcasts', label: 'Email me broadcasts & announcements' },
  { id: 'email_new_resources', label: 'Email me when new resources are uploaded' },
];

const genderLabel = (v) => GENDERS.find((g) => g.value === v)?.label || null;
const goalLabel = (id) => GOALS.find((g) => g.id === id)?.label || id.replaceAll('_', ' ');

function ViewField({ label, value }) {
  return (
    <div>
      <p className="text-cream/40 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-cream">{value || <span className="text-cream/40">Not set</span>}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editingPwd, setEditingPwd] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [form, setForm] = useState({});
  const [pwd, setPwd] = useState({ current: '', next: '' });
  const [prefs, setPrefs] = useState({});
  const [msg, setMsg] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoRef = useRef(null);

  function hydrateForm(u) {
    setForm({
      fullName: u.fullName || '',
      age: u.age || '',
      gender: u.gender || '',
      address: u.address || '',
      phone: u.phone || '',
      travelCountry: u.travelCountry || '',
      bio: u.bio || '',
      expertise: u.expertise || '',
      availability: u.availability || '',
      wellnessGoals: u.wellnessGoals || [],
    });
  }

  useEffect(() => {
    api.get('/users/me').then((u) => {
      setMe(u);
      hydrateForm(u);
      setPrefs(u.notificationPrefs || {});
    });
  }, []);

  function toggleGoal(id) {
    setForm((f) => ({ ...f, wellnessGoals: f.wellnessGoals.includes(id) ? f.wellnessGoals.filter((g) => g !== id) : [...f.wellnessGoals, id] }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  function startEditing() {
    hydrateForm(me);
    setPhotoPreview(null);
    setMsg('');
    setEditing(true);
  }

  function cancelEditing() {
    hydrateForm(me);
    setPhotoPreview(null);
    setEditing(false);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMsg('');
    try {
      const file = photoRef.current?.files?.[0];
      let newPhotoUrl;
      if (file) {
        const fd = new FormData();
        fd.append('photo', file);
        Object.entries(form).forEach(([k, v]) => {
          fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
        });
        const res = await api.upload('/users/me', fd, 'PATCH');
        newPhotoUrl = res.photoUrl;
      } else {
        await api.patch('/users/me', form);
      }
      // Reflect the saved values back into the view
      setMe((m) => ({ ...m, ...form, ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}) }));
      setPhotoPreview(null);
      setEditing(false);
      setMsg('Profile saved.');
    } catch (err) { setMsg(err.message); }
  }

  function cancelPwd() {
    setPwd({ current: '', next: '' });
    setEditingPwd(false);
  }

  async function changePassword(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/users/me/password', { currentPassword: pwd.current, newPassword: pwd.next });
      setPwd({ current: '', next: '' });
      setEditingPwd(false);
      setMsg('Password updated.');
    } catch (err) { setMsg(err.message); }
  }

  function cancelPrefs() {
    setPrefs(me.notificationPrefs || {});
    setEditingPrefs(false);
  }

  async function savePrefs(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/users/me/notification-prefs', { prefs });
      setMe((m) => ({ ...m, notificationPrefs: prefs }));
      setEditingPrefs(false);
      setMsg('Notification preferences saved.');
    } catch (err) { setMsg(err.message); }
  }

  async function resendVerification() {
    try { await api.post('/auth/resend-verification'); setMsg('Verification email sent.'); }
    catch (err) { setMsg(err.message); }
  }

  if (!me) return <p className="text-cream/60">Loading…</p>;

  const currentPhoto = photoPreview || (me.photoUrl ? assetUrl(me.photoUrl) : null);

  const Avatar = (
    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 overflow-hidden flex-shrink-0">
      {currentPhoto ? (
        <img src={currentPhoto} alt="Profile photo" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-cream/30 text-2xl select-none">
          {me.fullName?.[0]?.toUpperCase() || me.email?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Profile</p>
      <h1 className="heading text-3xl sm:text-4xl font-light mb-8">Account settings</h1>
      {msg && <div className="card mb-6 border-gold/40"><p className="text-gold">{msg}</p></div>}

      {/* ── Personal info: view by default, edit on demand ── */}
      {!editing ? (
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              {Avatar}
              <div className="min-w-0">
                <h2 className="heading text-xl sm:text-2xl leading-tight break-words">{me.fullName || 'Your name'}</h2>
                <p className="text-cream/60 text-sm break-all">{me.email}</p>
                {me.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-green-400 text-xs mt-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Verified
                  </span>
                ) : (
                  <button type="button" onClick={resendVerification} className="text-gold text-xs mt-1.5 hover:underline">
                    Email not verified · Resend
                  </button>
                )}
              </div>
            </div>
            <button type="button" onClick={startEditing} className="btn-outline text-sm px-4 py-2 flex-shrink-0 w-full sm:w-auto">Edit profile</button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6 border-t border-gold/10">
            <ViewField label="Age" value={me.age} />
            <ViewField label="Gender" value={genderLabel(me.gender)} />
            <ViewField label="Phone" value={me.phone} />
            <ViewField label="Interested country" value={me.travelCountry} />
            <ViewField label="Address" value={me.address} />
          </div>

          {me.role === 'user' && (
            <div className="pt-6 mt-6 border-t border-gold/10">
              <p className="text-cream/40 text-xs uppercase tracking-widest mb-3">Wellness goals</p>
              {me.wellnessGoals?.length ? (
                <div className="flex flex-wrap gap-2">
                  {me.wellnessGoals.map((g) => (
                    <span key={g} className="px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-cream/80 text-sm">{goalLabel(g)}</span>
                  ))}
                </div>
              ) : (
                <p className="text-cream/40 text-sm">No goals set yet.</p>
              )}
            </div>
          )}

          {me.role === 'instructor' && (
            <div className="grid sm:grid-cols-2 gap-5 pt-6 mt-6 border-t border-gold/10">
              <ViewField label="Expertise" value={me.expertise} />
              <ViewField label="Availability" value={me.availability} />
              <div className="sm:col-span-2"><ViewField label="Bio" value={me.bio} /></div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={saveProfile} className="card space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="heading text-2xl">Edit profile</h2>
            <button type="button" onClick={cancelEditing} className="text-cream/50 text-sm hover:text-cream">Cancel</button>
          </div>

          {/* Photo upload */}
          <div className="flex items-center gap-5">
            {Avatar}
            <div>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handlePhotoChange} />
              <label htmlFor="photo-upload" className="btn-outline cursor-pointer text-sm px-4 py-2">Change photo</label>
              <p className="text-cream/40 text-xs mt-1">JPG, PNG or WebP · max 25 MB</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input opacity-60" value={me.email} disabled />
              {!me.emailVerified && (
                <button type="button" onClick={resendVerification} className="text-gold text-xs mt-1 hover:underline">Resend verification email</button>
              )}
            </div>
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </div>
            <div>
              <label className="label">Gender</label>
              <Select options={GENDERS} value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" placeholder="+1 9435679832" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Interested country to travel</label>
              <input className="input" placeholder="e.g. Japan, Nepal…" value={form.travelCountry} onChange={(e) => setForm({ ...form, travelCountry: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input className="input" placeholder="City, Country" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          {me.role === 'user' && (
            <div>
              <label className="label">Wellness goals</label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => {
                  const active = form.wellnessGoals?.includes(g.id);
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

          {me.role === 'instructor' && (
            <>
              <div>
                <label className="label">Expertise</label>
                <input className="input" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} />
              </div>
              <div>
                <label className="label">Availability</label>
                <input className="input" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Mon–Fri · 10am–6pm" />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea className="input" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button className="btn-primary">Save profile</button>
            <button type="button" onClick={cancelEditing} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {/* ── Password: view by default, edit on demand ── */}
      {!editingPwd ? (
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="heading text-2xl mb-1">Password</h2>
              <p className="text-cream/50 text-sm tracking-[0.3em] leading-none">••••••••••</p>
            </div>
            <button type="button" onClick={() => { setMsg(''); setEditingPwd(true); }} className="btn-outline text-sm px-4 py-2 flex-shrink-0 w-full sm:w-auto">Change password</button>
          </div>
        </div>
      ) : (
        <form onSubmit={changePassword} className="card space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="heading text-2xl">Change password</h2>
            <button type="button" onClick={cancelPwd} className="text-cream/50 text-sm hover:text-cream">Cancel</button>
          </div>
          <input className="input" type="password" placeholder="Current password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} autoComplete="current-password" />
          <input className="input" type="password" placeholder="New password (min 8)" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} autoComplete="new-password" />
          <div className="flex gap-3">
            <button className="btn-primary">Update password</button>
            <button type="button" onClick={cancelPwd} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {/* ── Notification preferences: view by default, edit on demand ── */}
      {!editingPrefs ? (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <h2 className="heading text-2xl">Notification preferences</h2>
            <button type="button" onClick={() => { setMsg(''); setEditingPrefs(true); }} className="btn-outline text-sm px-4 py-2 flex-shrink-0 w-full sm:w-auto">Edit</button>
          </div>
          <div className="space-y-1">
            {NOTIF_PREFS.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-2 border-b border-gold/10 last:border-0">
                <span className="text-cream/80 text-sm">{p.label}</span>
                {prefs[p.id] ? (
                  <span className="inline-flex items-center gap-1.5 text-green-400 text-xs flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    On
                  </span>
                ) : (
                  <span className="text-cream/30 text-xs flex-shrink-0">Off</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={savePrefs} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="heading text-2xl">Notification preferences</h2>
            <button type="button" onClick={cancelPrefs} className="text-cream/50 text-sm hover:text-cream">Cancel</button>
          </div>
          <div className="space-y-3">
            {NOTIF_PREFS.map((p) => (
              <label key={p.id} className="flex items-center gap-3 text-cream/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!prefs[p.id]}
                  onChange={(e) => setPrefs({ ...prefs, [p.id]: e.target.checked })}
                  className="w-4 h-4 accent-gold"
                />
                {p.label}
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="btn-primary">Save preferences</button>
            <button type="button" onClick={cancelPrefs} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}
    </>
  );
}
