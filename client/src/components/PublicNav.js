'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const LINKS = [
  { href: '/#about',    label: 'About' },
  { href: '/login',     label: 'Login' },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-gold/10">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/"><Image src="/navbarlogo.png" alt="Mindful" width={56} height={56} className="h-14 w-auto" priority /></Link>

        {/* Desktop — links + button all on the right */}
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-cream/80 hover:text-gold transition text-sm tracking-wide">{l.label}</Link>
          ))}
          <Link href="/signup" className="bg-gold text-black font-medium text-sm px-6 py-2.5 rounded-full hover:bg-gold/90 transition">Get Started</Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-cream/70 p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-gold/10 bg-black/95 px-6 pb-6 space-y-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-cream/80 hover:text-gold py-2 text-sm border-b border-gold/10">{l.label}</Link>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/signup" onClick={() => setOpen(false)} className="bg-gold text-black font-medium text-sm py-3 rounded-full text-center hover:bg-gold/90 transition">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
