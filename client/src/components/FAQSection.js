'use client';
import { useState } from 'react';

const FAQS = [
  {
    q: 'What is included in the 14-day free trial?',
    a: 'You get full premium access to all resources, your assigned instructor, and the complete program — no credit card required. After the trial, you keep your account and free content.',
  },
  {
    q: 'Can I switch programs after signing up?',
    a: 'Yes. You can start a trial on any of the three programs independently. Your dashboard tracks each program separately.',
  },
  {
    q: 'How does instructor assignment work?',
    a: 'Once you start a program, our admin team assigns you a specialist — a certified dietician, meditation instructor, or wellness counselor. You can message them directly from your dashboard.',
  },
  {
    q: 'What happens after my trial ends?',
    a: 'You will receive a reminder 2 days before your trial expires. After expiry, premium resources and instructor messaging are paused until you subscribe. Your account and all free content remain accessible.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'All data is encrypted in transit (HTTPS) and at rest. Your wellness journal, messages, and progress are never shared with third parties.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept eSewa for Nepali members. International payment options are coming soon.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="px-6 py-24 max-w-3xl mx-auto">
      <p className="text-gold tracking-[0.3em] text-xs uppercase text-center mb-3">Questions</p>
      <h2 className="heading text-4xl font-light text-center mb-12">Frequently asked</h2>
      <div className="space-y-2">
        {FAQS.map((f, i) => (
          <div key={i} className="border border-gold/20 rounded-2xl overflow-hidden">
            <button
              className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 text-cream/90 hover:text-gold transition"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium">{f.q}</span>
              <svg className={'w-5 h-5 flex-shrink-0 transition-transform ' + (open === i ? 'rotate-45' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-cream/70 text-sm leading-relaxed border-t border-gold/10">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
