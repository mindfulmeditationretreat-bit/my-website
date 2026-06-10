import Link from 'next/link';
import { headers } from 'next/headers';

async function fetchPrograms() {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
  try {
    const res = await fetch(`${apiUrl}/programs`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function ProgramsPage() {
  const programs = await fetchPrograms();
  headers();
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Programs</p>
        <h1 className="heading text-5xl font-light mb-4">Choose your path.</h1>
        <p className="text-cream/70 mb-12 max-w-xl">Every program starts with a 14-day free trial — full access, no card required.</p>

        {programs.length === 0 ? (
          <div className="card text-center py-16">
            <p className="heading text-2xl mb-2">No programs yet</p>
            <p className="text-cream/60 text-sm">Our wellness programs will appear here soon. Please check back later.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {programs.map((p) => (
              <div key={p.id} className="card flex flex-col">
                <h3 className="heading text-2xl mb-3">{p.name}</h3>
                <p className="text-cream/70 mb-4 flex-1">{p.description}</p>
                {Array.isArray(p.features) && (
                  <ul className="text-cream/70 text-sm space-y-1 mb-6">
                    {p.features.map((f) => <li key={f}>· {f}</li>)}
                  </ul>
                )}
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-gold heading text-xl">{(p.priceCents / 100).toLocaleString()} {p.currency}</p>
                    <p className="text-cream/50 text-xs">{p.trialDays}-day free trial</p>
                  </div>
                  <Link href="/signup" className="text-gold text-sm hover:underline">Start →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
