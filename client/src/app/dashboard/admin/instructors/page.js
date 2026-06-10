'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminInstructorsPage() {
  const [list, setList] = useState([]);

  useEffect(() => {
    api.get('/admin/users?role=instructor').then(setList);
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Admin</p>
          <h1 className="heading text-4xl font-light">Instructors</h1>
        </div>
        <Link href="/dashboard/admin/users/new" className="btn-primary">+ Add instructor</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {list.map((u) => (
          <Link key={u.id} href={`/dashboard/admin/users/${u.id}`} className="card hover:border-gold/40 transition">
            <h3 className="heading text-xl">{u.fullName || u.email}</h3>
            <p className="text-cream/60 text-sm mt-1">{u.email}</p>
            <p className="text-gold/80 text-xs uppercase tracking-widest mt-3">{u.active ? 'Active' : 'Inactive'}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
