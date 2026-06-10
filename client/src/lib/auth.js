import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function getCurrentUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function requireUser({ role } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.onboarded && user.role === 'user') redirect('/onboarding');
  if (role && user.role !== role) redirect('/dashboard');
  return user;
}
