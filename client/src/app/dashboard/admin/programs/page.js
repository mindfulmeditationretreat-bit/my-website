'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({});
  const [msg, setMsg]           = useState('');
  const [busy, setBusy]         = useState(false);

  async function load() { setPrograms(await api.get('/admin/programs')); }
  useEffect(() => { load(); }, []);

  function startEdit(p) {
    setEditing(p.id);
    setMsg('');
    setForm({
      name:        p.name,
      description: p.description || '',
      // Show price in NPR (not raw cents) so admin sees "1999" not "199900"
      priceNPR:    p.priceCents / 100,
      currency:    p.currency,
      trialDays:   p.trialDays,
      active:      p.active,
    });
  }

  async function save() {
    setBusy(true);
    try {
      await api.patch(`/admin/programs/${editing}`, {
        name:        form.name,
        description: form.description,
        priceCents:  Math.round(Number(form.priceNPR) * 100),
        currency:    form.currency,
        trialDays:   Number(form.trialDays),
        active:      form.active,
      });
      setMsg('Changes saved successfully.');
      setEditing(null);
      await load();
    } catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Admin · Programs</p>
        <h1 className="heading text-4xl font-light mb-1">Program management</h1>
        <p className="text-cream/50 text-sm">Edit pricing, trial settings and program details.</p>
      </div>

      {msg && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-gold/30 bg-gold/5 text-gold text-sm">{msg}</div>
      )}

      {programs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="heading text-xl mb-2">No programs yet</p>
          <p className="text-cream/50 text-sm">Run the database seed to create the default programs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((p) => (
            <div key={p.id} className="card">
              {editing === p.id ? (
                /* ── Edit form ── */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="heading text-xl">Editing: {p.name}</h3>
                    <button onClick={() => setEditing(null)} className="text-cream/40 hover:text-cream text-sm">✕ Cancel</button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Program name</label>
                      <input className="input" value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Currency</label>
                      <input className="input" value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea className="input" rows={3} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Price ({form.currency || 'NPR'})</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40 text-sm">{form.currency || 'NPR'}</span>
                        <input className="input pl-14" type="number" min="0" step="1"
                          value={form.priceNPR}
                          onChange={(e) => setForm({ ...form, priceNPR: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Free trial (days)</label>
                      <input className="input" type="number" min="0" value={form.trialDays}
                        onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-cream/80 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-gold"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                    <span>Active — visible to users</span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button onClick={save} disabled={busy} className="btn-primary">
                      {busy ? 'Saving…' : 'Save changes'}
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-outline text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                /* ── View row ── */
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="heading text-xl">{p.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${p.active ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-cream/40 border-white/10 bg-white/5'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-cream/60 text-sm mb-3">{p.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-gold heading text-lg">
                          {(p.priceCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          <span className="text-cream/50 text-xs ml-1">{p.currency}/mo</span>
                        </span>
                        <span className="text-cream/50 text-sm border-l border-gold/10 pl-4">
                          {p.trialDays}-day free trial
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => startEdit(p)}
                    className="btn-outline text-sm px-4 py-2">
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
