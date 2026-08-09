'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, assetUrl } from '@/lib/api';

const CAT_LABEL = {
  weight_loss: 'Weight Loss', diabetes: 'Diabetes Friendly', heart: 'Heart Healthy',
  vegetarian: 'Vegetarian', vegan: 'Vegan', ayurvedic: 'Ayurvedic', buddhist_vegetarian: 'Buddhist Vegetarian',
};

const FOOD_BEHAVIOURS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'nonvegetarian', label: 'Non-vegetarian' },
  { id: 'eggetarian', label: 'Eggetarian' },
];

const MEDICAL_OPTS = ['PCOS / PCOD', 'Thyroid', 'Diabetes', 'Hypertension', 'Other'];

const EMPTY_FORM = {
  age: '',
  sex: '',
  weightKg: '',
  heightCm: '',
  foodBehaviour: '',
  foodAllergy: '',
  medicalConditions: [],
  medicalOther: '',
  medication: '',
  drinkingSmoking: '',
  fastingOrNoMeat: '',
  canCarryTiffin: null,
};

function liveBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h) return null;
  return Math.round((w / ((h / 100) ** 2)) * 10) / 10;
}

function liveIbw(heightCm) {
  const h = Number(heightCm);
  if (!h) return null;
  return Math.round((h - 100) * 10) / 10;
}

function liveCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi <= 24.9) return 'Normal weight';
  if (bmi <= 29.9) return 'Overweight';
  if (bmi <= 34.9) return 'Obesity Class I';
  if (bmi <= 39.9) return 'Obesity Class II';
  return 'Obesity Class III';
}

const BMI_CHART = [
  { range: '< 18.5', category: 'Underweight' },
  { range: '18.5 – 24.9', category: 'Normal weight' },
  { range: '25.0 – 29.9', category: 'Overweight' },
  { range: '30.0 – 34.9', category: 'Obesity Class I' },
  { range: '35.0 – 39.9', category: 'Obesity Class II' },
  { range: '≥ 40.0', category: 'Obesity Class III' },
];

export default function DietHubPage() {
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('profile');

  async function load() {
    const [p, pl, s, b] = await Promise.all([
      api.get('/diet/profile').catch(() => null),
      api.get('/diet/meal-plans').catch(() => []),
      api.get('/diet/slots').catch(() => []),
      api.get('/diet/bookings').catch(() => []),
    ]);
    setProfile(p);
    setPlans(pl);
    setSlots(s);
    setBookings(b);
    if (p) {
      setForm({
        age: p.age ?? '',
        sex: p.sex || '',
        weightKg: p.weightKg ?? '',
        heightCm: p.heightCm ?? '',
        foodBehaviour: p.foodBehaviour || '',
        foodAllergy: p.foodAllergy || '',
        medicalConditions: Array.isArray(p.medicalConditions) ? p.medicalConditions : [],
        medicalOther: p.medicalOther || '',
        medication: p.medication || '',
        drinkingSmoking: p.drinkingSmoking || '',
        fastingOrNoMeat: p.fastingOrNoMeat || '',
        canCarryTiffin: p.canCarryTiffin,
      });
    }
  }

  useEffect(() => { load(); }, []);

  const previewBmi = liveBmi(form.weightKg, form.heightCm);
  const previewIbw = liveIbw(form.heightCm);
  const previewCat = liveCategory(previewBmi);

  function toggleCondition(c) {
    setForm((f) => ({
      ...f,
      medicalConditions: f.medicalConditions.includes(c)
        ? f.medicalConditions.filter((x) => x !== c)
        : [...f.medicalConditions, c],
    }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.put('/diet/profile', {
        ...form,
        age: form.age === '' ? null : Number(form.age),
        weightKg: form.weightKg === '' ? null : Number(form.weightKg),
        heightCm: form.heightCm === '' ? null : Number(form.heightCm),
        canCarryTiffin: form.canCarryTiffin,
      });
      setProfile(res);
      setMsg('Health details saved.');
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function logCompliance(planId) {
    await api.post(`/diet/meal-plans/${planId}/log`, { compliant: true });
    setMsg('Logged meal plan compliance for today.');
  }

  async function book(id) {
    await api.post(`/diet/slots/${id}/book`, {});
    setMsg('Consultation booked.');
    await load();
  }

  return (
    <>
      <Link href="/dashboard" className="text-cream/60 hover:text-gold text-sm">← Dashboard</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">Diet counseling hub</p>
      <h1 className="heading text-4xl font-light mb-8">Nourish with clarity.</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['profile', 'plans', 'booking'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={'px-4 py-2 rounded-full border text-sm capitalize ' +
              (tab === t ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
            {t === 'plans' ? 'Meal plans' : t === 'booking' ? 'Book consult' : 'Your details'}
          </button>
        ))}
      </div>

      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-6 max-w-2xl">
          <div className="card space-y-4">
            <h2 className="heading text-2xl">Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Age</label>
                <input className="input" type="number" min="1" max="120" value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div>
                <label className="label">Sex</label>
                <select className="input" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                  <option value="">— Select —</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input className="input" type="number" step="0.1" value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input className="input" type="number" step="0.1" value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gold/20 bg-black/30 px-4 py-3">
                <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">IBW (ideal body weight)</p>
                <p className="heading text-2xl text-gold">{previewIbw != null ? `${previewIbw} kg` : '—'}</p>
                <p className="text-cream/40 text-xs mt-1">height (cm) − 100</p>
              </div>
              <div className="rounded-xl border border-gold/20 bg-black/30 px-4 py-3">
                <p className="text-cream/50 text-xs uppercase tracking-widest mb-1">BMI (kg/m²)</p>
                <p className="heading text-2xl text-gold">{previewBmi != null ? previewBmi : '—'}</p>
                <p className="text-cream/70 text-xs mt-1">{previewCat || 'Enter height & weight'}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gold/15">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gold/15 text-left text-cream/50 text-xs uppercase tracking-widest">
                    <th className="px-4 py-2.5 font-medium">BMI (kg/m²)</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {BMI_CHART.map((row) => {
                    const active = previewCat === row.category;
                    return (
                      <tr key={row.range} className={active ? 'bg-gold/10 text-cream' : 'text-cream/60'}>
                        <td className="px-4 py-2 border-t border-gold/10">{row.range}</td>
                        <td className="px-4 py-2 border-t border-gold/10">{row.category}{active ? ' ← you' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="heading text-2xl">Food & lifestyle</h2>

            <div>
              <label className="label">Food behaviour</label>
              <div className="flex flex-wrap gap-2">
                {FOOD_BEHAVIOURS.map((b) => (
                  <button key={b.id} type="button" onClick={() => setForm({ ...form, foodBehaviour: b.id })}
                    className={'px-4 py-2 rounded-full border text-sm ' +
                      (form.foodBehaviour === b.id ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Food allergy (if any)</label>
              <input className="input" placeholder="e.g. Peanuts, dairy"
                value={form.foodAllergy} onChange={(e) => setForm({ ...form, foodAllergy: e.target.value })} />
            </div>

            <div>
              <label className="label">Medical condition</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {MEDICAL_OPTS.map((c) => {
                  const on = form.medicalConditions.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => toggleCondition(c)}
                      className={'px-3 py-1.5 rounded-full border text-sm ' +
                        (on ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
                      {c}
                    </button>
                  );
                })}
              </div>
              {form.medicalConditions.includes('Other') && (
                <input className="input" placeholder="Other medical condition"
                  value={form.medicalOther} onChange={(e) => setForm({ ...form, medicalOther: e.target.value })} />
              )}
            </div>

            <div>
              <label className="label">Medication (if any)</label>
              <input className="input" value={form.medication}
                onChange={(e) => setForm({ ...form, medication: e.target.value })} />
            </div>

            <div>
              <label className="label">Drinking / smoking — how often (day / week)</label>
              <input className="input" placeholder="e.g. None · or 2 drinks/week · occasional smoking"
                value={form.drinkingSmoking} onChange={(e) => setForm({ ...form, drinkingSmoking: e.target.value })} />
            </div>

            <div>
              <label className="label">Fasting or no-meat day (if any)</label>
              <input className="input" placeholder="e.g. Tuesday no meat · Ekadashi fasting"
                value={form.fastingOrNoMeat} onChange={(e) => setForm({ ...form, fastingOrNoMeat: e.target.value })} />
            </div>

            <div>
              <label className="label">Able to carry tiffin?</label>
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} type="button"
                    onClick={() => setForm({ ...form, canCarryTiffin: v })}
                    className={'px-5 py-2 rounded-full border text-sm ' +
                      (form.canCarryTiffin === v ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn-primary">Save details</button>
        </form>
      )}

      {tab === 'plans' && (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="card">
              <p className="text-gold/70 text-xs uppercase tracking-widest mb-1">{CAT_LABEL[p.category] || p.category}</p>
              <h3 className="heading text-xl mb-2">{p.title}</h3>
              <p className="text-cream/60 text-sm mb-4">{p.description}</p>
              {p.body && <p className="text-cream/50 text-xs mb-4 leading-relaxed">{p.body}</p>}
              <div className="flex flex-wrap gap-2">
                {p.fileUrl && (
                  <a href={assetUrl(p.fileUrl)} target="_blank" rel="noreferrer" className="btn-outline py-2 px-4 text-sm">Download</a>
                )}
                <button type="button" className="btn-primary py-2 px-4 text-sm" onClick={() => logCompliance(p.id)}>
                  Log compliance
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && <p className="text-cream/60">No meal plans yet.</p>}
        </div>
      )}

      {tab === 'booking' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="heading text-2xl mb-4">Available slots</h2>
            {slots.length === 0 ? (
              <p className="text-cream/60 text-sm">No open slots right now. Check back soon.</p>
            ) : (
              <div className="space-y-3">
                {slots.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/15 bg-black/20 px-4 py-3">
                    <div>
                      <p className="text-cream text-sm">
                        {new Date(s.startsAt).toLocaleString()} · <span className="text-gold">{s.mode.replace('_', ' ')}</span>
                      </p>
                      <p className="text-cream/50 text-xs mt-1">
                        {s.instructor?.fullName || 'Provider'}{s.instructor?.expertise ? ` · ${s.instructor.expertise}` : ''}
                        {s.location ? ` · ${s.location}` : ''}
                      </p>
                    </div>
                    <button type="button" className="btn-primary py-2 px-4 text-sm" onClick={() => book(s.id)}>Book</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {bookings.length > 0 && (
            <div className="card">
              <h2 className="heading text-xl mb-3">Your bookings</h2>
              <ul className="space-y-2">
                {bookings.map((b) => (
                  <li key={b.id} className="text-cream/70 text-sm">
                    {new Date(b.startsAt).toLocaleString()} · {b.mode} · {b.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
