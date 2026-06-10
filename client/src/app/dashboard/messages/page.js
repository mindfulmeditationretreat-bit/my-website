'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/messages').then((c) => { setConversations(c); setLoading(false); });
  }, []);

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Conversations</p>
      <h1 className="heading text-4xl font-light mb-8">Messages</h1>

      {loading ? <p className="text-cream/60">Loading…</p>
        : conversations.length === 0 ? (
          <p className="text-cream/60">No conversations yet. Once an instructor is assigned, your chat will appear here.</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => (
              <Link key={c.peer.id} href={`/dashboard/messages/${c.peer.id}`} className="card flex items-center justify-between hover:border-gold/40 transition">
                <div>
                  <h3 className="heading text-xl">{c.peer.fullName || 'Unknown'}</h3>
                  <p className="text-cream/60 text-sm line-clamp-1 mt-1">{c.lastMessage.body}</p>
                </div>
                <div className="text-right">
                  <p className="text-cream/40 text-xs">{new Date(c.lastMessage.createdAt).toLocaleDateString()}</p>
                  {c.unread > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gold text-ink text-xs">{c.unread}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
    </>
  );
}
