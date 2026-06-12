'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const TYPE_COLOR = {
  pdf:     'text-red-300    bg-red-400/10    border-red-400/20',
  video:   'text-purple-300 bg-purple-400/10 border-purple-400/20',
  audio:   'text-blue-300   bg-blue-400/10   border-blue-400/20',
  image:   'text-pink-300   bg-pink-400/10   border-pink-400/20',
  article: 'text-green-300  bg-green-400/10  border-green-400/20',
};

export default function AdminResourcesPage() {
  const [resources, setResources]       = useState([]);
  const [programs, setPrograms]         = useState([]);
  const [programFilter, setProgramFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [loading, setLoading]           = useState(true);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (programFilter) qs.set('programId', programFilter);
      if (typeFilter)    qs.set('type', typeFilter);
      const [r, p] = await Promise.all([
        api.get(`/resources${qs.toString() ? '?' + qs : ''}`),
        api.get('/admin/programs'),
      ]);
      setResources(Array.isArray(r) ? r : []);
      setPrograms(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error('[resources] load failed', err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [programFilter, typeFilter]);

  async function remove(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.delete(`/resources/${id}`);
    setResources((rs) => rs.filter((r) => r.id !== id));
  }

  const totalPremium = resources.filter((r) => r.isPremium).length;
  const totalFree    = resources.length - totalPremium;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Admin · Content</p>
          <h1 className="heading text-4xl font-light mb-1">Resource library</h1>
          <p className="text-cream/50 text-sm">{resources.length} resources · {totalFree} free · {totalPremium} premium</p>
        </div>
        <Link href="/dashboard/provider/resources" className="btn-primary">+ Upload resource</Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-cream/40 text-xs uppercase tracking-widest self-center mr-1">Program</span>
          {[{ id: '', label: 'All' }, { id: 'null', label: 'Unassigned' }, ...programs.map((p) => ({ id: String(p.id), label: p.name }))].map((opt) => (
            <button key={opt.id} onClick={() => setProgramFilter(opt.id)}
              className={'px-3 py-1 rounded-full border text-xs transition ' +
                (programFilter === opt.id ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60 hover:border-gold/40')}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-cream/40 text-xs uppercase tracking-widest self-center mr-1">Type</span>
          {['', 'pdf', 'video', 'audio', 'image', 'article'].map((t) => (
            <button key={t || 'all'} onClick={() => setTypeFilter(t)}
              className={'px-3 py-1 rounded-full border text-xs transition ' +
                (typeFilter === t ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60 hover:border-gold/40')}>
              {t || 'All types'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="text-cream/50 p-6">Loading…</p>
        ) : resources.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-cream/40 text-sm">No resources found. Try adjusting the filters.</p>
          </div>
        ) : (
        <>
          {/* Mobile cards (below md) */}
          <ul className="md:hidden divide-y divide-gold/[0.07]">
            {resources.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/dashboard/resources/${r.id}`} className="min-w-0 block">
                    <p className="text-cream hover:text-gold transition font-medium truncate">{r.title}</p>
                    {r.description && <p className="text-cream/40 text-xs truncate">{r.description}</p>}
                  </Link>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${TYPE_COLOR[r.type] || ''}`}>
                    {r.type}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-cream/60 capitalize">{r.category}</span>
                    {r.program && <span className="text-cream/40">· {r.program.name}</span>}
                    {r.isPremium
                      ? <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold">Premium</span>
                      : <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cream/50">Free</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/dashboard/resources/${r.id}`} className="text-xs text-gold hover:underline">View</Link>
                    <button onClick={() => remove(r.id, r.title)} className="text-xs text-cream/40 hover:text-red-400 transition">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table (md and up) */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10">
                {['Title', 'Type', 'Category', 'Program', 'Access', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-cream/40 text-xs uppercase tracking-widest font-normal last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-b border-gold/[0.07] hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 max-w-[220px]">
                    <Link href={`/dashboard/resources/${r.id}`} className="text-cream hover:text-gold transition font-medium truncate block">
                      {r.title}
                    </Link>
                    {r.description && <p className="text-cream/40 text-xs truncate">{r.description}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${TYPE_COLOR[r.type] || ''}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-cream/60 capitalize">{r.category}</td>
                  <td className="px-5 py-3.5">
                    {r.program
                      ? <span className="text-cream/60 text-xs">{r.program.name}</span>
                      : <span className="text-cream/30 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.isPremium
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold">Premium</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cream/50">Free</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/resources/${r.id}`} className="text-xs text-gold hover:underline">View</Link>
                      <button onClick={() => remove(r.id, r.title)} className="text-xs text-cream/40 hover:text-red-400 transition">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
        )}
      </div>
    </>
  );
}
