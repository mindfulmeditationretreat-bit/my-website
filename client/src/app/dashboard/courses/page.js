'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/courses').then(setCourses).catch(() => setCourses([]));
  }, []);

  async function enroll(id) {
    await api.post(`/courses/${id}/enroll`);
    setCourses((rows) => rows.map((c) => (c.id === id ? { ...c, enrolled: true } : c)));
    setMsg('Enrolled. Full payment gateway can be wired when deploy is back.');
  }

  return (
    <>
      <Link href="/dashboard" className="text-cream/60 hover:text-gold text-sm">← Dashboard</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">Courses</p>
      <h1 className="heading text-4xl font-light mb-2">Build once. Return often.</h1>
      <p className="text-cream/50 text-sm mb-8">Self-paced paths for lasting practice.</p>

      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="card">
            <h3 className="heading text-2xl mb-2">{c.title}</h3>
            <p className="text-cream/60 text-sm mb-3">{c.description}</p>
            <p className="text-gold text-sm mb-4">{c.priceDisplay}</p>
            {Array.isArray(c.lessons) && c.lessons.length > 0 && (
              <ul className="text-cream/50 text-xs space-y-1 mb-4">
                {c.lessons.map((l) => <li key={l}>· {l}</li>)}
              </ul>
            )}
            <button type="button" className="btn-primary py-2 px-4 text-sm" disabled={c.enrolled}
              onClick={() => enroll(c.id)}>
              {c.enrolled ? 'Enrolled ✓' : 'Enroll'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
