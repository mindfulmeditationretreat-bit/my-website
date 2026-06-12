'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, googleLoginUrl } from '@/lib/api';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 010-4.22V7.05H2.18a11 11 0 000 9.9l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function EyeIcon({ off }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      {off ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.58 10.58a2 2 0 002.83 2.83M9.88 4.24A9.1 9.1 0 0112 4c5 0 9 4 10 8a13.2 13.2 0 01-2.16 3.19M6.6 6.6C4.4 7.9 2.8 9.8 2 12c1 4 5 8 10 8a9.5 9.5 0 004.4-1.06" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH = [
  { label: '', color: '' },
  { label: 'Weak', color: 'bg-red-500' },
  { label: 'Fair', color: 'bg-orange-400' },
  { label: 'Good', color: 'bg-yellow-400' },
  { label: 'Strong', color: 'bg-green-500' },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'instructor' ? 'instructor' : 'user';

  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [expertise, setExpertise] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const isInstructor = role === 'instructor';
  const strength = passwordStrength(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = email && password.length >= 8 && password === confirm && !loading
    && (!isInstructor || fullName.trim());

  function switchRole(r) {
    setRole(r);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = { email, password, role };
      if (fullName.trim()) payload.fullName = fullName.trim();
      if (isInstructor) {
        if (expertise.trim()) payload.expertise = expertise.trim();
        if (bio.trim()) payload.bio = bio.trim();
        if (availability.trim()) payload.availability = availability.trim();
      }
      const res = await api.post('/auth/signup', payload);
      if (res?.pending) { setPendingApproval(true); return; }
      router.push(res.emailSent ? '/verify-email?sent=1' : '/verify-email?sent=0');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (pendingApproval) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="card w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(225,179,104,0.12)', border: '1px solid rgba(225,179,104,0.3)' }}>
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="heading text-2xl font-light mb-2">Application received.</h1>
          <p className="text-yellow-400/90 text-sm font-medium mb-5">
            You are not verified yet.
          </p>
          <p className="text-cream/60 text-sm leading-relaxed mb-6">
            To complete your verification, please send an email with your proper credentials and supporting documents to:
          </p>
          <a href="mailto:info@mindful.com"
            className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-5 py-3 text-gold font-medium text-sm hover:bg-gold/10 transition mb-6">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            info@mindful.com
          </a>
          <p className="text-cream/40 text-xs leading-relaxed mb-7">
            Include your full name, professional certificates, government-issued ID, and any relevant qualifications. Once reviewed, an admin will approve your account.
          </p>
          <Link href="/dashboard/instructor" className="btn-primary inline-block">Go to Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card w-full max-w-md">

        {/* Role toggle */}
        <div className="flex rounded-xl border border-gold/20 bg-black/30 p-1 mb-7">
          <button type="button" onClick={() => switchRole('user')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${role === 'user' ? 'bg-gold text-black' : 'text-cream/60 hover:text-cream'}`}>
            Join as Member
          </button>
          <button type="button" onClick={() => switchRole('instructor')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${isInstructor ? 'bg-gold text-black' : 'text-cream/60 hover:text-cream'}`}>
            Join as Instructor
          </button>
        </div>

        <h1 className="heading text-3xl font-light mb-2">
          {isInstructor ? 'Become an instructor.' : 'Begin your journey.'}
        </h1>
        <p className="text-cream/60 mb-8">
          {isInstructor
            ? 'Share your expertise with the Mindful community.'
            : '14-day free trial · No card required'}
        </p>

        {!isInstructor && (
          <>
            <a href={googleLoginUrl()} className="btn-outline w-full mb-4 gap-3">
              <GoogleIcon /> Continue with Google
            </a>
            <div className="flex items-center gap-3 text-cream/40 text-xs my-4">
              <div className="flex-1 h-px bg-gold/10" /> OR <div className="flex-1 h-px bg-gold/10" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {isInstructor && (
            <div>
              <label htmlFor="fullName" className="label">Full Name *</label>
              <input id="fullName" className="input" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required autoFocus
                placeholder="Your full name" />
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              autoFocus={!isInstructor} placeholder="you@example.com" />
          </div>

          {isInstructor && (
            <>
              <div>
                <label htmlFor="expertise" className="label">Expertise</label>
                <input id="expertise" className="input" value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="e.g. Clinical Dietitian, Meditation Coach" />
              </div>
              <div>
                <label htmlFor="availability" className="label">Availability</label>
                <input id="availability" className="input" value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Mon–Fri · 10am–6pm" />
              </div>
              <div>
                <label htmlFor="bio" className="label">Bio</label>
                <textarea id="bio" className="input" rows={3} value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your background and approach…" />
              </div>
            </>
          )}

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input id="password" className="input pr-12" type={showPassword ? 'text' : 'password'}
                minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="new-password" placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-gold transition">
                <EyeIcon off={showPassword} />
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH[strength].color : 'bg-gold/15'}`} />
                  ))}
                </div>
                <p className="text-cream/40 text-xs mt-1">
                  {strength >= 1 ? `Strength: ${STRENGTH[strength].label}` : 'Minimum 8 characters'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="label">Confirm password</label>
            <div className="relative">
              <input id="confirm" className="input pr-12" type={showPassword ? 'text' : 'password'}
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                autoComplete="new-password" placeholder="Re-enter your password" />
            </div>
            {mismatch && <p className="text-red-400 text-xs mt-1">Passwords do not match.</p>}
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}

          <button className="btn-primary w-full" disabled={!canSubmit}>
            {loading
              ? 'Creating account…'
              : isInstructor ? 'Apply as Instructor' : 'Create account'}
          </button>

          {!isInstructor && (
            <p className="text-cream/40 text-xs text-center leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-gold/80 hover:text-gold">Terms</Link> and{' '}
              <Link href="/privacy" className="text-gold/80 hover:text-gold">Privacy Policy</Link>.
            </p>
          )}
        </form>

        <p className="text-cream/60 text-sm text-center mt-6">
          Already a member? <Link href="/login" className="text-gold hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignupForm />
    </Suspense>
  );
}
