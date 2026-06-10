'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.get('/notifications');
    setItems(data.notifications);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function markAll() {
    await api.post('/notifications/read-all');
    await load();
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Inbox</p>
          <h1 className="heading text-4xl font-light">Notifications</h1>
        </div>
        <button onClick={markAll} className="text-cream/70 hover:text-gold text-sm">Mark all read</button>
      </div>

      {loading ? <p className="text-cream/60">Loading…</p>
        : items.length === 0 ? <p className="text-cream/60">No notifications yet.</p>
        : (
          <div className="space-y-3">
            {items.map((n) => (
              <div key={n.id} className={'card ' + (!n.readAt ? 'border-gold/40' : '')}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="heading text-lg">{n.title}</h3>
                    {n.body && <p className="text-cream/70 text-sm mt-1">{n.body}</p>}
                    {n.link && <Link href={n.link} className="text-gold text-sm mt-2 inline-block hover:underline">Open →</Link>}
                  </div>
                  <p className="text-cream/40 text-xs whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  );
}
