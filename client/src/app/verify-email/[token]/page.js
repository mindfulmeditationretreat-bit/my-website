'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, dashboardPathFor } from '@/lib/api';

export default function VerifyEmailTokenPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.post('/auth/verify-email', { token });
        if (cancelled) return;
        setStatus('verified');
        // If this browser is signed in (the usual case right after signup),
        // continue straight into onboarding; otherwise fall back to login.
        try {
          const me = await api.get('/users/me');
          if (!cancelled) {
            setTimeout(() => router.replace(me.onboarded ? dashboardPathFor(me.role) : '/onboarding'), 1200);
          }
        } catch {
          if (!cancelled) setTimeout(() => router.replace('/login'), 1500);
        }
      } catch (err) {
        if (!cancelled) { setStatus('error'); setMessage(err.message); }
      }
    })();
    return () => { cancelled = true; };
  }, [token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card w-full max-w-md text-center">
        {status === 'verifying' && (
          <>
            <h1 className="heading text-3xl font-light mb-3">Verifying…</h1>
            <p className="text-cream/60">Confirming your email address.</p>
          </>
        )}
        {status === 'verified' && (
          <>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(35,28,15,0.9)' }}>
              <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="heading text-3xl font-light mb-3">Email verified</h1>
            <p className="text-cream/60">Taking you to your account…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="heading text-3xl font-light mb-3">Verification failed</h1>
            <p className="text-red-400 mb-6">{message}</p>
            <Link href="/verify-email" className="btn-outline inline-block">Request a new link</Link>
          </>
        )}
      </div>
    </main>
  );
}
