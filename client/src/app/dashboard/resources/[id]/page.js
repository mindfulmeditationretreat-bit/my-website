'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, assetUrl } from '@/lib/api';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/resources/${id}`)
      .then(setResource)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return (
    <div className="card">
      <p className="text-red-400 mb-4">{error}</p>
      <Link href="/dashboard/programs" className="text-gold">Start a free trial →</Link>
    </div>
  );
  if (!resource) return <p className="text-cream/60">Loading…</p>;

  const url = assetUrl(resource.url);

  return (
    <>
      <Link href="/dashboard/resources" className="text-cream/60 hover:text-gold text-sm">← Back to library</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">{resource.category} · {resource.type}</p>
      <h1 className="heading text-4xl font-light mb-2">{resource.title}</h1>
      {resource.description && <p className="text-cream/60 mb-8">{resource.description}</p>}

      <div className="card">
        {resource.type === 'article' && resource.body && (
          <div className="prose prose-invert max-w-none text-cream/80 whitespace-pre-wrap">{resource.body}</div>
        )}
        {resource.type === 'video' && url && (
          <video controls className="w-full rounded-xl"><source src={url} /></video>
        )}
        {resource.type === 'audio' && url && (
          <audio controls className="w-full"><source src={url} /></audio>
        )}
        {resource.type === 'image' && url && (
          <img src={url} alt={resource.title} className="w-full rounded-xl" />
        )}
        {resource.type === 'pdf' && url && (
          <iframe src={url} className="w-full h-[80vh] rounded-xl bg-white" />
        )}
        {!url && resource.type !== 'article' && (
          <p className="text-cream/60">No file uploaded.</p>
        )}
      </div>
    </>
  );
}
