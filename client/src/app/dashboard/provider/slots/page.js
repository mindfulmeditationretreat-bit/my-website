'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ProviderSlotsPage() {
  const [slot, setSlot] = useState({ startsAt: '', endsAt: '', mode: 'online', location: '' });
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/diet/slots', slot);
      setMsg('Slot created.');
      setSlot({ startsAt: '', endsAt: '', mode: 'online', location: '' });
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <>
      <Link href="/dashboard/provider" className="text-cream/60 hover:text-gold text-sm">← Provider</Link>
      <h1 className="heading text-4xl font-light mt-6 mb-6">Consult slots</h1>
      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}
      <form onSubmit={submit} className="card max-w-xl space-y-4">
        <div>
          <label className="label">Starts</label>
          <input className="input" type="datetime-local" value={slot.startsAt}
            onChange={(e) => setSlot({ ...slot, startsAt: e.target.value })} required />
        </div>
        <div>
          <label className="label">Ends</label>
          <input className="input" type="datetime-local" value={slot.endsAt}
            onChange={(e) => setSlot({ ...slot, endsAt: e.target.value })} required />
        </div>
        <div>
          <label className="label">Mode</label>
          <select className="input" value={slot.mode} onChange={(e) => setSlot({ ...slot, mode: e.target.value })}>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
          </select>
        </div>
        <div>
          <label className="label">Location (optional)</label>
          <input className="input" value={slot.location} onChange={(e) => setSlot({ ...slot, location: e.target.value })} />
        </div>
        <button className="btn-primary">Add slot</button>
      </form>
    </>
  );
}
