'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ScoreRing from '@/components/ScoreRing';

const DIET_PREFS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Halal', 'Local / seasonal'];

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [mental, setMental] = useState({
    stress_level: 5, anxiety_level: 5, sleep_quality: 5, emotional_balance: 5, energy_level: 5,
  });
  const [physical, setPhysical] = useState({
    weight: '', height: '', health_goals: '', dietary_preferences: [],
  });
  const [spiritual, setSpiritual] = useState({
    meditation_experience: 5, spiritual_interest: 5, life_purpose_clarity: 5, interest_in_retreats: false,
  });

  function Scale({ label, value, onChange, invertHint }) {
    return (
      <div className="mb-5">
        <div className="flex justify-between gap-2 mb-2">
          <label className="label mb-0">{label}</label>
          <span className="text-gold text-sm">{value}/10</span>
        </div>
        <input type="range" min="1" max="10" value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-gold" />
        {invertHint && <p className="text-cream/40 text-xs mt-1">{invertHint}</p>}
      </div>
    );
  }

  function togglePref(p) {
    setPhysical((f) => ({
      ...f,
      dietary_preferences: f.dietary_preferences.includes(p)
        ? f.dietary_preferences.filter((x) => x !== p)
        : [...f.dietary_preferences, p],
    }));
  }

  async function submit() {
    setBusy(true); setError('');
    try {
      const res = await api.post('/wellness/assessment', { mental, physical, spiritual });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (result?.scores) {
    return (
      <>
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Assessment complete</p>
        <h1 className="heading text-4xl font-light mb-8">Your Mindful Score</h1>
        <div className="card text-center mb-8">
          <p className="heading text-5xl text-gold mb-6">{result.scores.overall}<span className="text-cream/40 text-2xl">/100</span></p>
          <div className="grid grid-cols-3 gap-4 justify-items-center">
            <ScoreRing score={result.scores.mental} label="Mental" />
            <ScoreRing score={result.scores.physical} label="Physical" />
            <ScoreRing score={result.scores.spiritual} label="Spiritual" />
          </div>
          {result.currentGoal && (
            <p className="text-cream/70 text-sm mt-8">Recommended focus: <span className="text-gold">{result.currentGoal}</span></p>
          )}
        </div>
        <button className="btn-primary" onClick={() => router.push('/dashboard')}>Go to dashboard</button>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard" className="text-cream/60 hover:text-gold text-sm">← Back</Link>
      <p className="text-gold tracking-[0.3em] text-xs uppercase mt-6 mb-3">Wellness assessment</p>
      <h1 className="heading text-4xl font-light mb-2">Know where you are.</h1>
      <p className="text-cream/50 text-sm mb-8">Three short check-ins · Mental · Physical · Spiritual</p>

      <div className="flex gap-2 mb-8">
        {['Mental', 'Physical', 'Spiritual'].map((t, i) => (
          <button key={t} type="button" onClick={() => setStep(i)}
            className={'px-4 py-2 rounded-full border text-sm transition ' +
              (step === i ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
            {t}
          </button>
        ))}
      </div>

      <div className="card max-w-xl">
        {step === 0 && (
          <>
            <h2 className="heading text-2xl mb-4">Mental wellness</h2>
            <Scale label="Stress level" value={mental.stress_level} invertHint="Higher = more stress"
              onChange={(v) => setMental({ ...mental, stress_level: v })} />
            <Scale label="Anxiety level" value={mental.anxiety_level} invertHint="Higher = more anxiety"
              onChange={(v) => setMental({ ...mental, anxiety_level: v })} />
            <Scale label="Sleep quality" value={mental.sleep_quality}
              onChange={(v) => setMental({ ...mental, sleep_quality: v })} />
            <Scale label="Emotional balance" value={mental.emotional_balance}
              onChange={(v) => setMental({ ...mental, emotional_balance: v })} />
            <Scale label="Energy level" value={mental.energy_level}
              onChange={(v) => setMental({ ...mental, energy_level: v })} />
            <button className="btn-primary mt-2" onClick={() => setStep(1)}>Continue</button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="heading text-2xl mb-4">Physical wellness</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Weight (kg)</label>
                <input className="input" type="number" value={physical.weight}
                  onChange={(e) => setPhysical({ ...physical, weight: e.target.value })} />
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input className="input" type="number" value={physical.height}
                  onChange={(e) => setPhysical({ ...physical, height: e.target.value })} />
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Health goals</label>
              <input className="input" placeholder="e.g. Lose 5kg, better energy"
                value={physical.health_goals}
                onChange={(e) => setPhysical({ ...physical, health_goals: e.target.value })} />
            </div>
            <p className="label">Dietary preferences</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {DIET_PREFS.map((p) => {
                const on = physical.dietary_preferences.includes(p);
                return (
                  <button key={p} type="button" onClick={() => togglePref(p)}
                    className={'px-3 py-1.5 rounded-full border text-sm ' +
                      (on ? 'bg-gold/20 border-gold text-cream' : 'border-gold/20 text-cream/60')}>
                    {p}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button className="btn-outline" onClick={() => setStep(0)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(2)}>Continue</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="heading text-2xl mb-4">Spiritual wellness</h2>
            <Scale label="Meditation experience" value={spiritual.meditation_experience}
              onChange={(v) => setSpiritual({ ...spiritual, meditation_experience: v })} />
            <Scale label="Religious / spiritual interest" value={spiritual.spiritual_interest}
              onChange={(v) => setSpiritual({ ...spiritual, spiritual_interest: v })} />
            <Scale label="Life purpose clarity" value={spiritual.life_purpose_clarity}
              onChange={(v) => setSpiritual({ ...spiritual, life_purpose_clarity: v })} />
            <label className="flex items-center justify-between gap-4 rounded-xl border border-gold/15 bg-black/20 px-4 py-3 mb-6 cursor-pointer">
              <span className="text-cream text-sm">Interested in retreats</span>
              <input type="checkbox" className="accent-gold" checked={spiritual.interest_in_retreats}
                onChange={(e) => setSpiritual({ ...spiritual, interest_in_retreats: e.target.checked })} />
            </label>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button className="btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" disabled={busy} onClick={submit}>
                {busy ? 'Calculating…' : 'See my score'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
