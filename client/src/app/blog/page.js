import Link from 'next/link';
import PublicNav from '@/components/PublicNav';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchArticles() {
  try {
    const res = await fetch(`${API}/resources?type=article`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export const metadata = { title: 'Blog — Mindful Wellness' };

export default async function BlogPage() {
  const articles = await fetchArticles();

  return (
    <>
      <PublicNav />
      <main className="max-w-5xl mx-auto px-6 py-20 min-h-screen">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Wellness insights</p>
        <h1 className="heading text-5xl font-light mb-4">The Mindful blog</h1>
        <p className="text-cream/60 mb-16 max-w-xl">Expert articles on nutrition, meditation, and emotional wellness — written by our certified providers.</p>

        {articles.length === 0 ? (
          <div className="card text-center py-16">
            <p className="heading text-2xl text-cream/40 mb-3">Coming soon</p>
            <p className="text-cream/40 text-sm">Our providers are writing the first articles. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {articles.map((a) => (
              <Link key={a.id} href={`/blog/${a.id}`} className="card hover:border-gold/40 transition block group">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gold/70 text-xs uppercase tracking-widest">{a.category}</span>
                  {a.isPremium && <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">Premium</span>}
                </div>
                <h2 className="heading text-2xl mb-3 group-hover:text-gold transition">{a.title}</h2>
                {a.description && <p className="text-cream/60 text-sm leading-relaxed line-clamp-3">{a.description}</p>}
                <p className="text-cream/40 text-xs mt-4">{new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
