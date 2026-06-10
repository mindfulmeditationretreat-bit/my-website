'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, dashboardPathFor, googleLoginUrl } from '@/lib/api';

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await api.post('/auth/login', { email, password });
      router.push(user.onboarded ? dashboardPathFor(user.role) : '/onboarding');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card w-full max-w-md">
        <h1 className="heading text-3xl font-light mb-1">Welcome back.</h1>
        <p className="text-cream/60 text-sm mb-8">Log in to continue your wellness journey.</p>

        <a href={googleLoginUrl()} className="btn-outline w-full mb-4 gap-3">
          <GoogleIcon /> Continue with Google
        </a>
        <div className="flex items-center gap-3 text-cream/40 text-xs my-4">
          <div className="flex-1 h-px bg-gold/10" /> OR <div className="flex-1 h-px bg-gold/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              autoFocus placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input id="password" className="input pr-12" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)} required
                autoComplete="current-password" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-gold transition">
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={loading || !email || !password}>
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <div className="flex justify-between text-sm mt-6 text-cream/60">
          <Link href="/forgot-password" className="hover:text-gold">Forgot password?</Link>
          <Link href="/signup" className="text-gold hover:underline">Create account</Link>
        </div>
      </div>
    </main>
  );
}
