'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      router.push('/login?reset=success');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card w-full max-w-md">
        <Link href="/"><Image src="/navbarlogo.png" alt="Mindful" width={48} height={48} className="h-12 w-auto" /></Link>
        <h1 className="heading text-3xl font-light mt-6 mb-8">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" type="password" placeholder="New password (min 8 chars)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  );
}
