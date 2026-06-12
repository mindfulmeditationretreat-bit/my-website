'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

const AUDIENCES = [
  { value: 'all',         label: 'Everyone',           desc: 'All users + providers on the platform' },
  { value: 'users',       label: 'All users',           desc: 'Only regular members' },
  { value: 'instructors', label: 'Providers only',      desc: 'Dieticians, meditation & counseling staff' },
  { value: 'trial',       label: 'Trial users only',    desc: 'Members currently on a free trial' },
];

const CHAR_WARN = 500;

export default function AdminBroadcastsPage() {
  const [form, setForm]     = useState({ audience: 'all', title: '', body: '', email: true });
  const [status, setStatus] = useState(null); // { ok: bool, msg: string }
  const [busy, setBusy]     = useState(false);
  const [history, setHistory] = useState([]);

  async function send(e) {
    e.preventDefault();
    setBusy(true); setStatus(null);
    try {
      const res = await api.post('/admin/broadcast', form);
      setStatus({ ok: true, msg: res.message || 'Broadcast sent successfully.' });
      setHistory((h) => [{ ...form, sentAt: new Date().toISOString(), id: Date.now() }, ...h]);
      setForm({ ...form, title: '', body: '' });
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally { setBusy(false); }
  }

  const selectedAudience = AUDIENCES.find((a) => a.value === form.audience);

  return (
    <>
      <div className="mb-8">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Admin · Broadcasts</p>
        <h1 className="heading text-4xl font-light mb-1">Broadcasts</h1>
        <p className="text-cream/50 text-sm">Send announcements, updates and promotions to your members.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* Compose */}
        <form onSubmit={send} className="space-y-5">

          {/* Audience selector */}
          <div className="card">
            <h2 className="heading text-lg mb-4">Audience</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {AUDIENCES.map((a) => (
                <label key={a.value}
                  className={'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ' +
                    (form.audience === a.value
                      ? 'border-gold bg-gold/10'
                      : 'border-gold/20 hover:border-gold/40')}>
                  <input type="radio" className="mt-0.5 accent-gold" name="audience"
                    value={a.value} checked={form.audience === a.value}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })} />
                  <div>
                    <p className="text-cream text-sm font-medium">{a.label}</p>
                    <p className="text-cream/50 text-xs mt-0.5">{a.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="card space-y-4">
            <h2 className="heading text-lg">Message</h2>
            <div>
              <label className="label">Subject / Title</label>
              <input className="input" placeholder="e.g. New resources available this week"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Body</label>
                <span className={`text-xs ${form.body.length > CHAR_WARN ? 'text-yellow-400' : 'text-cream/30'}`}>
                  {form.body.length} chars
                </span>
              </div>
              <textarea className="input" rows={6}
                placeholder="Write your announcement here. Keep it clear and concise."
                value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            </div>

            {/* Channel */}
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="w-5 h-5 rounded-md bg-gold/20 border border-gold/40 flex items-center justify-center">
                  <span className="text-gold text-xs">✓</span>
                </div>
                <span className="text-cream/70 text-sm">In-app notification</span>
                <span className="text-cream/30 text-xs">(always sent)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-gold"
                  checked={form.email} onChange={(e) => setForm({ ...form, email: e.target.checked })} />
                <span className="text-cream/70 text-sm">Also send by email</span>
              </label>
            </div>

            {status && (
              <div className={`px-4 py-3 rounded-xl border text-sm ${status.ok ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                {status.ok ? '✓' : '✕'} {status.msg}
              </div>
            )}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Sending…' : `Send to ${selectedAudience?.label}`}
            </button>
          </div>
        </form>

        {/* Preview + History */}
        <div className="space-y-5">
          {/* Live preview */}
          <div className="card">
            <p className="text-cream/40 text-xs uppercase tracking-widest mb-3">Preview</p>
            <div className="bg-black/40 rounded-xl p-4 border border-gold/10">
              <p className="text-gold text-xs uppercase tracking-widest mb-1">Mindful</p>
              <p className="text-cream font-medium mb-1">{form.title || 'Your subject line'}</p>
              <p className="text-cream/60 text-sm leading-relaxed whitespace-pre-wrap">
                {form.body || 'Your message will appear here…'}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-cream/40">
              <span>To:</span>
              <span className="text-cream/70">{selectedAudience?.label}</span>
              <span className="ml-auto">{form.email ? 'Email + In-app' : 'In-app only'}</span>
            </div>
          </div>

          {/* Sent history (session only) */}
          {history.length > 0 && (
            <div className="card">
              <p className="text-cream/40 text-xs uppercase tracking-widest mb-3">Sent this session</p>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="border-b border-gold/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-cream text-sm font-medium">{h.title}</p>
                      <span className="text-xs text-green-400 flex-shrink-0">✓ sent</span>
                    </div>
                    <p className="text-cream/50 text-xs mt-0.5">
                      {AUDIENCES.find((a) => a.value === h.audience)?.label}
                      {' · '}
                      {new Date(h.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
