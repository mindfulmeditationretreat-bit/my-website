'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminWellnessContentPage() {
  const [tab, setTab] = useState('meal');
  const [msg, setMsg] = useState('');
  const [meal, setMeal] = useState({ title: '', slug: '', category: 'weight_loss', description: '', body: '' });
  const [med, setMed] = useState({ title: '', category: 'mindfulness', description: '', durationSec: 600 });
  const [retreat, setRetreat] = useState({
    title: '', slug: '', category: 'meditation_retreat', country: 'Nepal',
    description: '', durationDays: 7, priceCents: 0, isMonastery: false,
  });
  const [event, setEvent] = useState({ title: '', type: 'online_session', startsAt: '', mode: 'online', description: '' });
  const [course, setCourse] = useState({ title: '', slug: '', description: '', priceCents: 0, lessons: '' });
  const [slot, setSlot] = useState({ startsAt: '', endsAt: '', mode: 'online', location: '' });

  async function post(path, body) {
    setMsg('');
    try {
      await api.post(path, body);
      setMsg('Saved.');
    } catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <Link href="/dashboard/admin" className="text-cream/60 hover:text-gold text-sm">← Admin</Link>
      <h1 className="heading text-4xl font-light mt-6 mb-6">Wellness content</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['meal', 'meditation', 'retreat', 'event', 'course', 'slot'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={'px-3 py-1.5 rounded-full border text-xs capitalize ' +
              (tab === t ? 'bg-gold/20 border-gold' : 'border-gold/20 text-cream/60')}>
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}

      {tab === 'meal' && (
        <form className="card space-y-3 max-w-xl" onSubmit={(e) => { e.preventDefault(); post('/diet/meal-plans', meal); }}>
          <input className="input" placeholder="Title" value={meal.title} onChange={(e) => setMeal({ ...meal, title: e.target.value })} required />
          <input className="input" placeholder="Slug" value={meal.slug} onChange={(e) => setMeal({ ...meal, slug: e.target.value })} required />
          <input className="input" placeholder="Category" value={meal.category} onChange={(e) => setMeal({ ...meal, category: e.target.value })} />
          <textarea className="input" placeholder="Description" value={meal.description} onChange={(e) => setMeal({ ...meal, description: e.target.value })} />
          <textarea className="input" placeholder="Body" value={meal.body} onChange={(e) => setMeal({ ...meal, body: e.target.value })} />
          <button className="btn-primary">Add meal plan</button>
        </form>
      )}

      {tab === 'meditation' && (
        <form className="card space-y-3 max-w-xl" onSubmit={(e) => { e.preventDefault(); post('/meditation', med); }}>
          <input className="input" placeholder="Title" value={med.title} onChange={(e) => setMed({ ...med, title: e.target.value })} required />
          <input className="input" placeholder="Category" value={med.category} onChange={(e) => setMed({ ...med, category: e.target.value })} />
          <textarea className="input" placeholder="Description" value={med.description} onChange={(e) => setMed({ ...med, description: e.target.value })} />
          <input className="input" type="number" placeholder="Duration seconds" value={med.durationSec} onChange={(e) => setMed({ ...med, durationSec: Number(e.target.value) })} />
          <button className="btn-primary">Add meditation</button>
        </form>
      )}

      {tab === 'retreat' && (
        <form className="card space-y-3 max-w-xl" onSubmit={(e) => { e.preventDefault(); post('/travel/retreats', { ...retreat, priceCents: Number(retreat.priceCents) }); }}>
          <input className="input" placeholder="Title" value={retreat.title} onChange={(e) => setRetreat({ ...retreat, title: e.target.value })} required />
          <input className="input" placeholder="Slug" value={retreat.slug} onChange={(e) => setRetreat({ ...retreat, slug: e.target.value })} required />
          <input className="input" placeholder="Category" value={retreat.category} onChange={(e) => setRetreat({ ...retreat, category: e.target.value })} />
          <input className="input" placeholder="Country" value={retreat.country} onChange={(e) => setRetreat({ ...retreat, country: e.target.value })} />
          <textarea className="input" placeholder="Description" value={retreat.description} onChange={(e) => setRetreat({ ...retreat, description: e.target.value })} />
          <input className="input" type="number" placeholder="Duration days" value={retreat.durationDays} onChange={(e) => setRetreat({ ...retreat, durationDays: Number(e.target.value) })} />
          <input className="input" type="number" placeholder="Price cents" value={retreat.priceCents} onChange={(e) => setRetreat({ ...retreat, priceCents: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-cream/70">
            <input type="checkbox" className="accent-gold" checked={retreat.isMonastery} onChange={(e) => setRetreat({ ...retreat, isMonastery: e.target.checked })} />
            Monastery
          </label>
          <button className="btn-primary">Add retreat</button>
        </form>
      )}

      {tab === 'event' && (
        <form className="card space-y-3 max-w-xl" onSubmit={(e) => { e.preventDefault(); post('/events', event); }}>
          <input className="input" placeholder="Title" value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} required />
          <input className="input" placeholder="Type" value={event.type} onChange={(e) => setEvent({ ...event, type: e.target.value })} />
          <input className="input" type="datetime-local" value={event.startsAt} onChange={(e) => setEvent({ ...event, startsAt: e.target.value })} required />
          <select className="input" value={event.mode} onChange={(e) => setEvent({ ...event, mode: e.target.value })}>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <textarea className="input" placeholder="Description" value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} />
          <button className="btn-primary">Add event</button>
        </form>
      )}

      {tab === 'course' && (
        <form className="card space-y-3 max-w-xl" onSubmit={(e) => {
          e.preventDefault();
          post('/courses', {
            ...course,
            priceCents: Number(course.priceCents) || 0,
            lessons: course.lessons.split('\n').map((x) => x.trim()).filter(Boolean),
          });
        }}>
          <input className="input" placeholder="Title" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} required />
          <input className="input" placeholder="Slug" value={course.slug} onChange={(e) => setCourse({ ...course, slug: e.target.value })} required />
          <textarea className="input" placeholder="Description" value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} />
          <input className="input" type="number" placeholder="Price cents" value={course.priceCents} onChange={(e) => setCourse({ ...course, priceCents: e.target.value })} />
          <textarea className="input" placeholder="Lessons (one per line)" value={course.lessons} onChange={(e) => setCourse({ ...course, lessons: e.target.value })} />
          <button className="btn-primary">Add course</button>
        </form>
      )}

      {tab === 'slot' && (
        <form className="card space-y-3 max-w-xl" onSubmit={(e) => { e.preventDefault(); post('/diet/slots', slot); }}>
          <p className="text-cream/50 text-sm">Create consult slot (providers/admins).</p>
          <input className="input" type="datetime-local" value={slot.startsAt} onChange={(e) => setSlot({ ...slot, startsAt: e.target.value })} required />
          <input className="input" type="datetime-local" value={slot.endsAt} onChange={(e) => setSlot({ ...slot, endsAt: e.target.value })} required />
          <select className="input" value={slot.mode} onChange={(e) => setSlot({ ...slot, mode: e.target.value })}>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
          </select>
          <input className="input" placeholder="Location (optional)" value={slot.location} onChange={(e) => setSlot({ ...slot, location: e.target.value })} />
          <button className="btn-primary">Add slot</button>
        </form>
      )}
    </>
  );
}
