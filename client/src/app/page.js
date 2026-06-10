import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';

export default function Home() {
  return (
    <div className="bg-black min-h-screen">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 60px)' }}>
        {/* Ambient glow — bottom-left */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 70% at 15% 65%, rgba(225,179,104,0.16) 0%, transparent 65%)' }} />

        <div className="relative w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center gap-12 lg:gap-16 py-16 sm:py-20 lg:py-24" style={{ minHeight: 'inherit' }}>

          {/* Left — copy */}
          <div className="flex-1 min-w-0">
            <p className="text-gold tracking-[0.3em] text-[0.7rem] sm:text-xs uppercase mb-5">Holistic Wellness</p>
            <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] xl:text-7xl font-bold text-cream leading-[1.05] sm:leading-[1.02] mb-7">
              Your Complete<br />Wellness<br />Companion
            </h1>
            <p className="text-cream/60 text-lg leading-relaxed mb-10 max-w-[420px]">
              Personalized diet plans, guided meditation, and psychology wellness support — all in one mindful space.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup"
                className="bg-gold text-black font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-gold/90 transition">
                Get Started
              </Link>
              <Link href="/signup"
                className="border border-gold/50 text-cream text-sm px-8 py-3.5 rounded-full hover:border-gold hover:text-gold transition">
                Explore Services
              </Link>
            </div>
          </div>

          {/* Right — app card */}
          <div className="hidden lg:block flex-shrink-0 w-[340px] xl:w-[380px]">
            <div className="rounded-3xl p-4 border border-gold/15 w-full"
              style={{ background: 'rgba(18,14,8,0.92)' }}>

              {/* Inner logo panel */}
              <div className="rounded-2xl flex items-center justify-center mb-3 py-10"
                style={{ background: '#000' }}>
                <Image src="/logo.png" alt="Mindful" width={176} height={176} className="w-44 h-44 object-contain" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '1:1',      label: 'Support' },
                  { value: '3',        label: 'Core Services' },
                  { value: 'Wellness', label: '& Care', gold: true },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl py-4 px-1 text-center"
                    style={{ background: 'rgba(8,6,3,0.97)' }}>
                    <p className={`font-bold text-base leading-none ${s.gold ? 'text-gold' : 'text-cream'}`}>{s.value}</p>
                    <p className="text-cream/50 text-xs mt-1.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Services ── */}
      <section className="bg-black py-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-5">Our Services</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-cream leading-tight max-w-3xl mx-auto">
              Wellness support for your body, mind, and daily life
            </h2>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* Dietician */}
            <div className="rounded-3xl p-8 border border-gold/10 flex flex-col gap-6" style={{ background: 'rgba(20,16,10,0.9)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(35,28,15,0.9)' }}>
                {/* Fork / utensils */}
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-cream mb-3">Dietician Service</h3>
                <p className="text-cream/60 text-sm leading-relaxed">Get expert nutrition guidance and personalized meal plans designed around your lifestyle and goals.</p>
              </div>
              <Link href="/signup" className="text-gold text-sm font-medium hover:text-gold/80 transition">Learn More →</Link>
            </div>

            {/* Meditation */}
            <div className="rounded-3xl p-8 border border-gold/10 flex flex-col gap-6" style={{ background: 'rgba(20,16,10,0.9)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(35,28,15,0.9)' }}>
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c0 0-4 4-4 8s4 8 4 8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c0 0 4 4 4 8s-4 8-4 8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-cream mb-3">Meditation & Yoga</h3>
                <p className="text-cream/60 text-sm leading-relaxed">Join guided meditation sessions to reduce stress, improve focus, and build inner calm.</p>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                <Link href="/signup" className="text-gold hover:text-gold/80 transition">Online →</Link>
                <span className="text-gold/30">|</span>
                <Link href="/signup" className="text-gold hover:text-gold/80 transition">Retreats →</Link>
              </div>
            </div>

            {/* Psychology */}
            <div className="rounded-3xl p-8 border border-gold/10 flex flex-col gap-6" style={{ background: 'rgba(20,16,10,0.9)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(35,28,15,0.9)' }}>
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-cream mb-3">Psychology Wellness</h3>
                <p className="text-cream/60 text-sm leading-relaxed">Receive supportive wellness guidance for emotional balance, stress management, and mental clarity.</p>
              </div>
              <Link href="/signup" className="text-gold text-sm font-medium hover:text-gold/80 transition">Learn More →</Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Why Choose Mindful ── */}
      <section className="py-24 px-6" style={{ background: 'rgba(14,11,7,0.6)' }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div>
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-5">Why Choose Mindful</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-cream leading-tight mb-6">
              A calmer way to care for yourself
            </h2>
            <p className="text-cream/60 text-lg leading-relaxed max-w-[460px]">
              Mindful brings nutrition, meditation, and emotional wellness together through a simple online experience made for busy modern lives.
            </p>
          </div>

          {/* Right — feature pills */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Personalized wellness plans',
              'Certified professionals',
              'Buddhism based meditation',
              'Holistic mind-body approach',
            ].map((feature) => (
              <div key={feature}
                className="rounded-2xl px-6 py-5 border border-gold/10 text-cream font-semibold text-sm"
                style={{ background: 'rgba(20,16,10,0.9)' }}>
                {feature}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-black py-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-5">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-cream leading-tight">
              Start in three simple steps
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Choose your service', desc: 'Select diet, meditation, or psychology wellness support.' },
              { num: '02', title: 'Get Started',         desc: 'Become a member and explore your options.' },
              { num: '03', title: 'Start your wellness journey', desc: 'Follow a clear plan with professional online support.' },
            ].map((step) => (
              <div key={step.num} className="rounded-3xl p-8 border border-gold/10" style={{ background: 'rgba(20,16,10,0.9)' }}>
                <p className="text-3xl font-bold text-gold mb-4">{step.num}</p>
                <h3 className="text-xl font-bold text-cream mb-3">{step.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Programs ── */}
      <section className="py-24 px-6" style={{ background: 'rgba(14,11,7,0.6)' }}>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-5">Featured Programs</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-cream leading-tight">
              Programs designed for real life
            </h2>
          </div>

          {/* Programs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Weight Management Plan',  desc: 'Healthy nutrition guidance for sustainable progress.' },
              { title: 'Stress Relief Meditation', desc: 'Guided calm practices for everyday mental clarity.' },
              { title: 'Emotional Wellness Support', desc: 'Supportive sessions for balance and self-awareness.' },
              { title: 'Healthy Lifestyle Coaching', desc: 'Daily habits that support your body and mind.' },
            ].map((program) => (
              <div key={program.title} className="rounded-3xl p-8 border border-gold/10" style={{ background: 'rgba(20,16,10,0.9)' }}>
                <h3 className="text-lg font-bold text-cream mb-3">{program.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{program.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-black py-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-5">Testimonials</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-cream leading-tight">
              What our clients say
            </h2>
          </div>

          {/* Quotes */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'The diet plan felt practical and easy to follow. I finally understood what works for my lifestyle.', name: 'Anisha R.' },
              { quote: 'The meditation sessions helped me sleep better and feel calmer during work.', name: 'Mark T.' },
              { quote: 'Mindful gave me gentle support when I needed emotional clarity and better routines.', name: 'Priya S.' },
            ].map((t) => (
              <div key={t.name} className="rounded-3xl p-8 border border-gold/10" style={{ background: 'rgba(20,16,10,0.9)' }}>
                <p className="text-cream/70 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-cream font-semibold text-sm">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-black pb-24 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl border border-gold/15 px-8 py-20 text-center"
          style={{ background: 'radial-gradient(ellipse 70% 90% at 50% 0%, rgba(225,179,104,0.12) 0%, rgba(20,16,10,0.9) 60%)' }}>
          <h2 className="text-4xl sm:text-5xl font-bold text-cream leading-tight mb-5">
            Start Your Mindful Journey Today
          </h2>
          <p className="text-cream/60 text-base mb-9 max-w-xl mx-auto">
            Take the first step toward better health, balance, and inner peace.
          </p>
          <Link href="/signup"
            className="inline-block bg-gold text-black font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-gold/90 transition">
            Get Started
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black border-t border-gold/10 px-6 pt-16 pb-8">
        <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <Image src="/logo.png" alt="Mindful" width={72} height={72} className="w-16 h-16 object-contain rounded-xl mb-5" />
            <p className="text-cream/60 text-sm leading-relaxed max-w-[260px]">
              Mindful is your online space for diet, meditation, and psychology wellness support.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold font-bold text-sm mb-5">Quick Links</h3>
            <ul className="space-y-4 text-cream/70 text-sm">
              <li><Link href="/" className="hover:text-gold transition">Home</Link></li>
              <li><Link href="/#services" className="hover:text-gold transition">Services</Link></li>
              <li><Link href="/about" className="hover:text-gold transition">About</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-gold font-bold text-sm mb-5">Services</h3>
            <ul className="space-y-4 text-cream/70 text-sm">
              <li><Link href="/signup" className="hover:text-gold transition">Diet Plan</Link></li>
              <li><Link href="/signup" className="hover:text-gold transition">Online Meditation</Link></li>
              <li><Link href="/signup" className="hover:text-gold transition">Psychology Wellness</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gold font-bold text-sm mb-5">Contact</h3>
            <ul className="space-y-4 text-cream/70 text-sm">
              <li><a href="mailto:info@mindful.com" className="hover:text-gold transition">info@mindful.com</a></li>
              <li><a href="tel:+9779800000000" className="hover:text-gold transition">+977 9800000000</a></li>
              <li className="pt-1">
                <span className="hover:text-gold transition cursor-pointer">Facebook</span>
                <span className="text-cream/30"> · </span>
                <span className="hover:text-gold transition cursor-pointer">Instagram</span>
                <span className="text-cream/30"> · </span>
                <span className="hover:text-gold transition cursor-pointer">LinkedIn</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-6xl mx-auto mt-14 pt-6 border-t border-gold/10 text-center">
          <p className="text-cream/40 text-sm">© {new Date().getFullYear()} Mindful. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
