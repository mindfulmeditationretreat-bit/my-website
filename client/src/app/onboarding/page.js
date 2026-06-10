'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, dashboardPathFor } from '@/lib/api';
import Select from '@/components/Select';

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const GOALS = [
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'better_sleep', label: 'Better Sleep' },
  { id: 'stress_reduction', label: 'Stress Reduction' },
  { id: 'meditation_practice', label: 'Meditation Practice' },
  { id: 'anxiety_management', label: 'Anxiety Management' },
  { id: 'healthy_lifestyle', label: 'Healthy Lifestyle' },
  { id: 'emotional_wellness', label: 'Emotional Wellness' },
  { id: 'fitness_nutrition', label: 'Fitness & Nutrition' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Gate: only verified, not-yet-onboarded users may stay here.
  useEffect(() => {
    api.get('/users/me')
      .then((me) => {
        if (!me.emailVerified) { router.replace('/verify-email'); return; }
        if (me.onboarded) { router.replace(dashboardPathFor(me.role)); return; }
        setReady(true);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  function toggleGoal(id) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!gender) {
      setError('Please select your gender');
      return;
    }
    if (!goals.length) {
      setError('Pick at least one wellness goal');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/users/onboarding', { fullName, age, gender, wellnessGoals: goals });
      const me = await api.get('/users/me');
      router.push(dashboardPathFor(me.role));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-cream/50">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Welcome to Mindful</p>
        <h1 className="heading text-4xl font-light mb-2">Tell us about yourself.</h1>
        <p className="text-cream/60 mb-10">A few details so we can tailor your experience.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Full name</label>
            <input className="input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" min="13" max="120" value={age} onChange={(e) => setAge(e.target.value)} required />
            </div>
            <div>
              <label className="label">Gender</label>
              <Select options={GENDERS} value={gender} onChange={setGender} />
            </div>
          </div>

          <div>
            <label className="label">Your wellness goals</label>
            <p className="text-cream/50 text-xs mb-3">Choose all that apply</p>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => {
                const active = goals.includes(g.id);
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    className={
                      'px-4 py-3 rounded-xl border text-left transition ' +
                      (active
                        ? 'bg-gold/15 border-gold text-cream'
                        : 'bg-black/40 border-gold/20 text-cream/70 hover:border-gold/50')
                    }
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Continue to dashboard'}
          </button>
        </form>
      </div>
    </main>
  );
}
