import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchInstructors() {
  try {
    const res = await fetch(`${API}/instructors`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export const metadata = { title: 'Our Instructors — Mindful' };

export default async function InstructorsPage() {
  const instructors = await fetchInstructors();

  return (
    <main className="min-h-screen">
      <nav className="border-b border-gold/10 py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/"><Image src="/navbarlogo.png" alt="Mindful" width={40} height={40} className="h-10 w-auto" /></a>
          <div className="flex gap-4 text-sm">
            <a href="/login" className="text-cream/70 hover:text-gold transition">Log in</a>
            <a href="/signup" className="btn-primary py-2 px-5">Start free trial</a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Our team</p>
        <h1 className="heading text-5xl font-light mb-4">Expert instructors</h1>
        <p className="text-cream/60 mb-16 max-w-xl">Each member is paired with a certified specialist who designs a plan around their unique wellness goals.</p>

        {instructors.length === 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {['Dietician', 'Meditation', 'Counseling'].map((s) => (
              <div key={s} className="card text-center opacity-50">
                <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 mx-auto mb-4" />
                <p className="heading text-xl text-cream/40">{s} Specialist</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {instructors.map((i) => (
              <a key={i.id} href={`/instructors/${i.id}`} className="card hover:border-gold/40 transition block text-center group">
                <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 overflow-hidden flex items-center justify-center mx-auto mb-4">
                  {i.photoUrl
                    ? <img src={i.photoUrl.startsWith('http') ? i.photoUrl : `http://localhost:5000${i.photoUrl}`} alt={i.fullName} className="w-full h-full object-cover" />
                    : <span className="heading text-2xl text-gold">{(i.fullName || '?')[0]}</span>}
                </div>
                <h3 className="heading text-xl mb-1 group-hover:text-gold transition">{i.fullName}</h3>
                {i.expertise && <p className="text-gold/70 text-xs uppercase tracking-widest mb-3">{i.expertise}</p>}
                {i.bio && <p className="text-cream/60 text-sm line-clamp-3 leading-relaxed">{i.bio}</p>}
                {i.availability && (
                  <p className="text-cream/40 text-xs mt-4">Available: {i.availability}</p>
                )}
                <p className="text-gold text-sm mt-4 opacity-0 group-hover:opacity-100 transition">View profile →</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
