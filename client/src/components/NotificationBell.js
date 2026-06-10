'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api.get('/notifications');
        if (mounted) setUnread(data.unread || 0);
      } catch { /* ignore */ }
    }
    load();
    const t = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-gold/30 text-cream/80 hover:text-gold hover:border-gold/60 transition"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a3 3 0 006 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-ink text-[10px] font-semibold leading-none">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
