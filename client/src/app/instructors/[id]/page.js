import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchInstructor(id) {
  try {
    const res = await fetch(`${API}/instructors/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function InstructorProfilePage({ params }) {
  const instructor = await fetchInstructor(params.id);

  if (!instructor) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-cream/60">Provider not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-gold/10 py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/"><Image src="/navbarlogo.png" alt="Mindful" width={40} height={40} className="h-10 w-auto" /></a>
          <div className="flex gap-4 text-sm">
            <a href="/instructors" className="text-cream/70 hover:text-gold transition">← All providers</a>
            <a href="/signup" className="btn-primary py-2 px-5">Start free trial</a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-12">
          <div className="w-32 h-32 rounded-full bg-gold/10 border border-gold/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {instructor.photoUrl
              ? <img src={instructor.photoUrl.startsWith('http') ? instructor.photoUrl : `http://localhost:5000${instructor.photoUrl}`} alt={instructor.fullName} className="w-full h-full object-cover" />
              : <span className="heading text-4xl text-gold">{(instructor.fullName || '?')[0]}</span>}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="heading text-4xl font-light mb-2">{instructor.fullName}</h1>
            {instructor.expertise && (
              <p className="text-gold tracking-[0.2em] text-xs uppercase mb-4">{instructor.expertise}</p>
            )}
            {instructor.availability && (
              <p className="text-cream/50 text-sm">Available: {instructor.availability}</p>
            )}
          </div>
        </div>

        {instructor.bio && (
          <div className="card mb-8">
            <h2 className="heading text-2xl mb-4">About</h2>
            <p className="text-cream/70 leading-relaxed whitespace-pre-wrap">{instructor.bio}</p>
          </div>
        )}

        <div className="card mb-8">
          <h2 className="heading text-2xl mb-4">Specialization</h2>
          <p className="text-cream/70">{instructor.expertise || 'Wellness specialist'}</p>
        </div>

        <div className="card bg-gold/5 border-gold/30 text-center py-10">
          <h2 className="heading text-3xl mb-4">Work with {instructor.fullName?.split(' ')[0]}</h2>
          <p className="text-cream/60 mb-8">Start your 14-day free trial and get personally assigned to a specialist.</p>
          <a href="/signup" className="btn-primary">Start free trial</a>
        </div>
      </div>
    </main>
  );
}
