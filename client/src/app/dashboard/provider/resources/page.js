'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const TYPES = ['pdf', 'video', 'audio', 'image', 'article'];
const CATEGORIES = ['diet', 'meditation', 'counseling', 'general'];

export default function InstructorResourcesPage() {
  const [resources, setResources] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', type: 'pdf', category: 'general',
    body: '', isPremium: 'true', file: null, externalUrl: '', programId: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const [r, p] = await Promise.all([api.get('/resources'), api.get('/admin/programs').catch(() => [])]);
    setResources(r);
    setPrograms(p.filter ? p.filter((x) => x.active) : []);
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type', form.type);
      fd.append('category', form.category);
      fd.append('body', form.body);
      fd.append('isPremium', form.isPremium);
      if (form.externalUrl) fd.append('externalUrl', form.externalUrl);
      if (form.file) fd.append('file', form.file);
      if (form.programId) fd.append('programId', form.programId);
      await api.upload('/resources', fd);
      setMsg('Resource uploaded.');
      setForm({ title: '', description: '', type: 'pdf', category: 'general', body: '', isPremium: 'true', file: null, externalUrl: '', programId: '' });
      await load();
    } catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Delete this resource?')) return;
    await api.delete(`/resources/${id}`);
    await load();
  }

  return (
    <>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Library</p>
      <h1 className="heading text-4xl font-light mb-8">Resources</h1>

      <div className="card mb-8">
        <h2 className="heading text-2xl mb-4">Upload new resource</h2>
        {msg && <p className="text-gold text-sm mb-4">{msg}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="input" value={form.isPremium} onChange={(e) => setForm({ ...form, isPremium: e.target.value })}>
              <option value="false">Free</option>
              <option value="true">Premium</option>
            </select>
            <select className="input" value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
              <option value="">— Not tied to a program (global) —</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <input className="input" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {form.type === 'article' ? (
            <textarea className="input" rows={6} placeholder="Article body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          ) : (
            <>
              <input className="input" type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
              <input className="input" placeholder="…or external URL (YouTube, Vimeo, etc.)" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} />
            </>
          )}
          <button className="btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload resource'}</button>
        </form>
      </div>

      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="card flex items-center justify-between py-3">
            <div>
              <h3 className="heading text-lg">{r.title}</h3>
              <p className="text-cream/50 text-xs uppercase tracking-widest mt-1">
                {r.category} · {r.type}
                {r.isPremium && ' · Premium'}
                {r.program && ` · ${r.program.name}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/resources/${r.id}`} className="text-cream/60 hover:text-gold text-sm">View</Link>
              <button onClick={() => remove(r.id)} className="text-cream/60 hover:text-red-400 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
