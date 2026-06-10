import Link from 'next/link';
import Image from 'next/image';
import UserMenu from '@/components/UserMenu';
import Sidebar from '@/components/Sidebar';
import MobileSidebarToggle from '@/components/MobileSidebarToggle';
import NotificationBell from '@/components/NotificationBell';
import SocketProvider from '@/components/SocketProvider';
import { requireUser } from '@/lib/auth';

export default async function DashboardLayout({ children }) {
  const user = await requireUser();
  const isAdmin = user.role === 'admin';
  const wrap  = 'w-full px-4 sm:px-6 lg:px-8';
  const cols  = isAdmin ? 'md:grid-cols-[240px_1fr]' : 'md:grid-cols-[220px_1fr]';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gold/10 sticky top-0 bg-ink/90 backdrop-blur z-30">
        <div className={`${wrap} py-4 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <MobileSidebarToggle role={user.role} />
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/navbarlogo.png" alt="Mindful" width={40} height={40} className="h-10 w-auto hidden md:block" priority />
              {isAdmin && <span className="text-xs uppercase tracking-[0.2em] text-gold/70 font-medium hidden sm:inline">Admin</span>}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu name={user.fullName} email={user.email} photoUrl={user.photoUrl} />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={`${wrap} py-6 md:py-8 md:grid ${cols} md:gap-8`}>
        {/* Desktop sidebar */}
        <aside className="hidden md:block md:sticky md:top-24 md:self-start">
          <Sidebar role={user.role} />
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          <SocketProvider>{children}</SocketProvider>
        </main>
      </div>
    </div>
  );
}
