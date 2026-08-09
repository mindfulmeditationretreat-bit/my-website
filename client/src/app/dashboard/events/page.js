'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/events').then(setEvents).catch(() => setEvents([]));
  }, []);

  return (
    <>
      <Link href="/dashboard" className="text-cream/60 hover:text-gold text-sm">← Dashboard</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">Events & retreats</p>
      <h1 className="heading text-4xl font-light mb-8">What&apos;s gathering.</h1>

      <div className="space-y-4">
        {events.length === 0 && <p className="text-cream/60">No upcoming events yet.</p>}
        {events.map((e) => (
          <div key={e.id} className="card flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-gold/70 text-xs uppercase tracking-widest mb-1">
                {e.type.replace(/_/g, ' ')} · {e.mode.replace(/_/g, ' ')}
              </p>
              <h3 className="heading text-2xl mb-2">{e.title}</h3>
              <p className="text-cream/60 text-sm mb-2">{e.description}</p>
              <p className="text-cream/50 text-xs">
                {new Date(e.startsAt).toLocaleString()}
                {e.location ? ` · ${e.location}` : ''}
              </p>
            </div>
            {e.linkUrl && (
              <a href={e.linkUrl} target="_blank" rel="noreferrer" className="btn-primary py-2 px-4 text-sm">Join</a>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
