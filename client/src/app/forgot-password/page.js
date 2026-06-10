'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card w-full max-w-md">
        <Link href="/"><Image src="/navbarlogo.png" alt="Mindful" width={48} height={48} className="h-12 w-auto" /></Link>
        <h1 className="heading text-3xl font-light mt-6 mb-2">Reset password</h1>
        <p className="text-cream/60 mb-8">We'll email you a reset link.</p>
        {done ? (
          <p className="text-cream/80">If an account exists for that email, a reset link has been sent.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="text-cream/60 text-sm text-center mt-6">
          <Link href="/login" className="text-gold hover:underline">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
