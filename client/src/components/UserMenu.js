'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, assetUrl } from '@/lib/api';

export default function UserMenu({ name, email, photoUrl }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function logout() {
    await api.post('/auth/logout');
    router.push('/login');
    router.refresh();
  }

  const photo = photoUrl ? assetUrl(photoUrl) : null;
  const initial = (name || email || '?').trim()[0]?.toUpperCase() || '?';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full border border-gold/30 hover:border-gold/60 transition p-1 pr-2"
      >
        <span className="w-8 h-8 rounded-full bg-gold/10 overflow-hidden flex items-center justify-center text-cream/80 text-sm font-medium">
          {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : initial}
        </span>
        <svg className={`w-4 h-4 text-cream/50 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl border border-gold/25 bg-[#0d0a06] shadow-glow overflow-hidden py-1 fade-in-down z-40"
        >
          <Link
            href="/dashboard/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-cream/80 hover:bg-gold/10 hover:text-cream transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="3.2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0114 0" />
            </svg>
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-cream/80 hover:bg-gold/10 hover:text-gold transition text-left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4h6a2 2 0 012 2v12a2 2 0 01-2 2h-6" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
