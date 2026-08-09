'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = {
  user: [
    { href: '/dashboard',               label: 'Overview',       exact: true },
    { href: '/dashboard/assessment',    label: 'Assessment' },
    { href: '/dashboard/diet',          label: 'Diet hub' },
    { href: '/dashboard/meditation',    label: 'Meditation' },
    { href: '/dashboard/travel',        label: 'Travel' },
    { href: '/dashboard/journal',       label: 'Journal' },
    { href: '/dashboard/events',        label: 'Events' },
    { href: '/dashboard/courses',       label: 'Courses' },
    { href: '/dashboard/programs',      label: 'My Programs' },
    { href: '/dashboard/resources',     label: 'Resources' },
    { href: '/dashboard/messages',      label: 'Messages' },
    { href: '/dashboard/progress',      label: 'Progress' },
    { href: '/dashboard/notifications', label: 'Notifications' },
  ],
  instructor: [
    { href: '/dashboard/provider',           label: 'Overview', exact: true },
    { href: '/dashboard/provider/users',     label: 'My Users' },
    { href: '/dashboard/messages',           label: 'Messages' },
    { href: '/dashboard/provider/resources', label: 'Resources' },
    { href: '/dashboard/provider/slots',     label: 'Consult slots' },
  ],
  admin: [
    { href: '/dashboard/admin',               label: 'Overview',      exact: true },
    { href: '/dashboard/admin/users',         label: 'Users' },
    { href: '/dashboard/admin/providers',     label: 'Providers' },
    { href: '/dashboard/admin/programs',      label: 'Programs' },
    { href: '/dashboard/admin/subscriptions', label: 'Subscriptions' },
    { href: '/dashboard/admin/resources',     label: 'Resources' },
    { href: '/dashboard/admin/wellness',      label: 'Wellness content' },
    { href: '/dashboard/admin/analytics',     label: 'Analytics' },
    { href: '/dashboard/admin/broadcasts',    label: 'Broadcasts' },
  ],
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const items = NAV[role] || NAV.user;
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || (!item.exact && pathname?.startsWith(item.href + '/'));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              'block px-4 py-2.5 rounded-xl text-sm transition ' +
              (active
                ? 'bg-gold/15 text-cream border border-gold/30'
                : 'text-cream/60 hover:text-cream hover:bg-white/[0.03]')
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
