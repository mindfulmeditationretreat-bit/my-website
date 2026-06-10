import Link from 'next/link';
import PublicNav from '@/components/PublicNav';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchArticle(id) {
  try {
    const res = await fetch(`${API}/resources/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function BlogArticlePage({ params }) {
  const article = await fetchArticle(params.id);

  if (!article || article.type !== 'article') {
    return (
      <>
        <PublicNav />
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-cream/60">Article not found.</p>
          <Link href="/blog" className="text-gold hover:underline text-sm mt-4 inline-block">← Back to blog</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-20 min-h-screen">
        <Link href="/blog" className="text-cream/60 hover:text-gold text-sm mb-8 inline-block">← Back to blog</Link>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-gold/70 text-xs uppercase tracking-widest">{article.category}</span>
          {article.isPremium && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">Premium</span>
          )}
        </div>

        <h1 className="heading text-4xl md:text-5xl font-light mb-4 leading-tight">{article.title}</h1>
        {article.description && (
          <p className="text-cream/60 text-lg mb-8 leading-relaxed">{article.description}</p>
        )}
        <p className="text-cream/40 text-xs mb-12">{new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="border-t border-gold/10 pt-10">
          {article.isPremium && !article.body ? (
            <div className="card border-gold/30 text-center py-12">
              <p className="heading text-2xl mb-4">Premium content</p>
              <p className="text-cream/60 mb-8">This article is available to active subscribers.</p>
              <Link href="/signup" className="btn-primary">Start 14-day free trial</Link>
            </div>
          ) : article.body ? (
            <div className="prose prose-invert max-w-none text-cream/80 leading-relaxed whitespace-pre-wrap text-base">
              {article.body}
            </div>
          ) : (
            <p className="text-cream/40">No content yet.</p>
          )}
        </div>

        {/* CTA at bottom */}
        <div className="mt-16 card border-gold/30 text-center py-10">
          <p className="heading text-2xl mb-3">Ready to start your wellness journey?</p>
          <p className="text-cream/60 text-sm mb-6">14-day free trial · No credit card required</p>
          <Link href="/signup" className="btn-primary">Get started free</Link>
        </div>
      </main>
    </>
  );
}
