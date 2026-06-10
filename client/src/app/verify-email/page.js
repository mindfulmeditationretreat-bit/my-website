'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, dashboardPathFor } from '@/lib/api';

export default function CheckEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const pollRef = useRef(null);

  function goNext(me) {
    router.replace(me.onboarded ? dashboardPathFor(me.role) : '/onboarding');
  }

  // Confirm the user is logged in & unverified; then poll so the page
  // advances automatically once they click the link (even in another tab).
  useEffect(() => {
    let cancelled = false;

    async function check(initial) {
      try {
        const me = await api.get('/users/me');
        if (cancelled) return;
        if (me.emailVerified) { goNext(me); return; }
        if (initial) { setEmail(me.email || ''); setReady(true); }
      } catch {
        if (!cancelled && initial) router.replace('/login');
      }
    }

    check(true);
    pollRef.current = setInterval(() => check(false), 4000);
    return () => { cancelled = true; clearInterval(pollRef.current); };
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function resend() {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
      setCooldown(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-cream/50">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card w-full max-w-md text-center">
        {/* Envelope icon */}
        <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(35,28,15,0.9)' }}>
          <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
          </svg>
        </div>

        <h1 className="heading text-3xl font-light mb-2">Check your inbox</h1>
        <p className="text-cream/60 text-sm mb-8 leading-relaxed">
          We sent a verification link to{' '}
          <span className="text-cream">{email || 'your email'}</span>. Click it to verify your
          account and continue. This page will update automatically once you do.
        </p>

        <p className="text-cream/50 text-xs mb-6">The link expires in 10 minutes.</p>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4" role="alert">
            {error}
          </p>
        )}
        {sent && !error && (
          <p className="text-gold/90 text-sm mb-4">A new verification link is on its way.</p>
        )}

        <button
          type="button"
          onClick={resend}
          disabled={resending || cooldown > 0}
          className="text-gold text-sm font-medium hover:underline disabled:opacity-40 disabled:no-underline"
        >
          {resending ? 'Sending…' : cooldown > 0 ? `Resend link in ${cooldown}s` : "Didn't get it? Resend link"}
        </button>
      </div>
    </main>
  );
}
