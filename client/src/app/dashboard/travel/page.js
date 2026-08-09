'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'buddhist_monastery_stay', label: 'Monastery stay' },
  { id: 'meditation_retreat', label: 'Meditation retreat' },
  { id: 'silent_retreat', label: 'Silent retreat' },
  { id: 'yoga_retreat', label: 'Yoga retreat' },
  { id: 'spiritual_pilgrimage', label: 'Pilgrimage' },
  { id: 'volunteer_travel', label: 'Volunteer' },
];

export default function TravelHubPage() {
  const [destinations, setDestinations] = useState([]);
  const [retreats, setRetreats] = useState([]);
  const [filters, setFilters] = useState({
    country: '', category: '', maxBudget: '', intensity: '',
    english: false, women: false, privateRoom: false, monastery: false, q: '',
  });
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('marketplace');

  async function load(f = filters) {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v === true) params.set(k, '1');
      else if (v) params.set(k, v);
    });
    const [d, r] = await Promise.all([
      api.get('/travel/destinations'),
      api.get(`/travel/retreats?${params.toString()}`),
    ]);
    setDestinations(d);
    setRetreats(r);
  }

  useEffect(() => { load(); }, []);

  function setF(patch) {
    const next = { ...filters, ...patch };
    setFilters(next);
    load(next);
  }

  async function toggleSave(id) {
    const res = await api.post(`/travel/retreats/${id}/save`);
    setRetreats((rows) => rows.map((r) => (r.id === id ? { ...r, saved: res.saved } : r)));
  }

  async function waitlist(id) {
    await api.post(`/travel/retreats/${id}/waitlist`, {});
    setRetreats((rows) => rows.map((r) => (r.id === id ? { ...r, waitlisted: true } : r)));
    setMsg('Joined waitlist.');
  }

  return (
    <>
      <Link href="/dashboard" className="text-cream/60 hover:text-gold text-sm">← Dashboard</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">Spiritual travel hub</p>
      <h1 className="heading text-4xl font-light mb-2">Go deeper, gently.</h1>
      <p className="text-cream/50 text-sm mb-8">Destinations, retreats, and monastery stays.</p>

      <div className="flex gap-2 mb-6">
        {['marketplace', 'monastery'].map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); if (t === 'monastery') setF({ monastery: true }); else setF({ monastery: false }); }}
            className={'px-4 py-2 rounded-full border text-sm ' +
              (tab === t ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
            {t === 'monastery' ? 'Monastery finder' : 'Destination marketplace'}
          </button>
        ))}
      </div>

      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}

      {tab === 'marketplace' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {destinations.map((d) => (
            <button key={d.id} type="button" onClick={() => setF({ country: d.country })}
              className="card text-left hover:border-gold/40 transition">
              <p className="text-gold/70 text-xs uppercase tracking-widest mb-1">{d.country}</p>
              <h3 className="heading text-xl mb-2">{d.name}</h3>
              <p className="text-cream/60 text-sm">{d.summary}</p>
            </button>
          ))}
        </div>
      )}

      <div className="card mb-6">
        <h2 className="heading text-xl mb-4">{tab === 'monastery' ? 'Search monastery stays' : 'Filter retreats'}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <input className="input" placeholder="Search…" value={filters.q}
            onChange={(e) => setF({ q: e.target.value })} />
          <select className="input" value={filters.country} onChange={(e) => setF({ country: e.target.value })}>
            <option value="">Any country</option>
            {['Nepal', 'Sri Lanka', 'Thailand', 'India'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={filters.category} onChange={(e) => setF({ category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.id || 'all'} value={c.id}>{c.label}</option>)}
          </select>
          <select className="input" value={filters.intensity} onChange={(e) => setF({ intensity: e.target.value })}>
            <option value="">Any intensity</option>
            <option value="gentle">Gentle</option>
            <option value="moderate">Moderate</option>
            <option value="intense">Intense</option>
          </select>
          <input className="input" type="number" placeholder="Max budget (USD)" value={filters.maxBudget}
            onChange={(e) => setF({ maxBudget: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-cream/70">
          {[
            ['english', 'English spoken'],
            ['women', 'Women allowed'],
            ['privateRoom', 'Private room'],
            ['monastery', 'Monastery only'],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-gold" checked={!!filters[k]}
                onChange={(e) => setF({ [k]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {retreats.map((r) => (
          <div key={r.id} className="card">
            <p className="text-gold/70 text-xs uppercase tracking-widest mb-1">
              {r.country} · {r.category.replace(/_/g, ' ')}
              {r.isMonastery ? ' · monastery' : ''}
            </p>
            <h3 className="heading text-xl mb-2">{r.title}</h3>
            <p className="text-cream/60 text-sm mb-3">{r.description}</p>
            <p className="text-cream/50 text-xs mb-4">
              {r.durationDays} days · {r.priceDisplay} · {r.meditationIntensity}
              {r.englishSpoken ? ' · English' : ''}
              {r.privateRoom ? ' · Private room' : ''}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-outline py-2 px-4 text-sm" onClick={() => toggleSave(r.id)}>
                {r.saved ? 'Saved ✓' : 'Save'}
              </button>
              <button type="button" className="btn-primary py-2 px-4 text-sm" onClick={() => waitlist(r.id)}
                disabled={r.waitlisted}>
                {r.waitlisted ? 'On waitlist' : 'Join waitlist'}
              </button>
            </div>
          </div>
        ))}
        {retreats.length === 0 && <p className="text-cream/60">No retreats match these filters.</p>}
      </div>
    </>
  );
}
