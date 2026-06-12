'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = {
  user: [
    { href: '/dashboard',               label: 'Overview',       exact: true },
    { href: '/dashboard/programs',      label: 'My Programs' },
    { href: '/dashboard/resources',     label: 'Resources' },
    { href: '/dashboard/messages',      label: 'Messages' },
    { href: '/dashboard/progress',      label: 'Progress' },
    { href: '/dashboard/notifications', label: 'Notifications' },
  ],
  instructor: [
    { href: '/dashboard/instructor',           label: 'Overview', exact: true },
    { href: '/dashboard/instructor/users',     label: 'My Users' },
    { href: '/dashboard/messages',             label: 'Messages' },
    { href: '/dashboard/instructor/resources', label: 'Resources' },
  ],
  admin: [
    { href: '/dashboard/admin',               label: 'Overview',      exact: true },
    { href: '/dashboard/admin/users',         label: 'Users' },
    { href: '/dashboard/admin/instructors',   label: 'Providers' },
    { href: '/dashboard/admin/programs',      label: 'Programs' },
    { href: '/dashboard/admin/subscriptions', label: 'Subscriptions' },
    { href: '/dashboard/admin/resources',     label: 'Resources' },
    { href: '/dashboard/admin/analytics',     label: 'Analytics' },
    { href: '/dashboard/admin/broadcasts',    label: 'Broadcasts' },
  ],
};

export default function MobileSidebarToggle({ role }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Portal target only available after mount (client-side)
  useEffect(() => { setMounted(true); }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const items = NAV[role] || NAV.user;

  const drawer = (
    <>
      {/* Backdrop */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          zIndex: 9999,
          background: '#0d0d0d',
          borderRight: '1px solid rgba(212,175,55,0.15)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.8)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(212,175,55,0.1)', flexShrink: 0 }}>
          <Link href="/" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image src="/navbarlogo.png" alt="Mindful" width={36} height={36} style={{ height: '36px', width: 'auto' }} />
          </Link>
          <button
            onClick={() => setOpen(false)}
            style={{ color: 'rgba(255,255,255,0.5)', padding: '6px', lineHeight: 0 }}
            aria-label="Close menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {items.map((item) => {
            const active = pathname === item.href || (!item.exact && pathname?.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  marginBottom: '4px',
                  fontSize: '15px',
                  fontWeight: active ? '500' : '400',
                  color: active ? '#f5f0e8' : 'rgba(245,240,232,0.55)',
                  background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden p-2 text-cream/70 hover:text-gold transition"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Drawer rendered into document.body via portal — escapes the header's
          backdrop-filter stacking context so position:fixed works correctly */}
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
