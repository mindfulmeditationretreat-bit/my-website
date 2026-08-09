require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../src/db/index');
const {
  programs, users, mealPlans, meditations, destinations, retreats, events, courses, consultSlots,
} = require('../src/db/schema');

const PROGRAMS = [
  {
    slug: 'dietician',
    name: 'Dietician Service',
    description: 'Personalized diet plans from certified dieticians.',
    features: ['1-on-1 dietician', 'Weekly meal plan', 'Progress reviews'],
    priceCents: 199900,
    trialDays: 14,
    category: 'diet',
  },
  {
    slug: 'meditation',
    name: 'Meditation & Yoga',
    description: 'Guided meditation and yoga programs for daily practice.',
    features: ['Daily guided sessions', 'Yoga library', 'Streak tracking'],
    priceCents: 149900,
    trialDays: 14,
    category: 'meditation',
  },
  {
    slug: 'counseling',
    name: 'Wellness Counseling',
    description: 'Confidential sessions with licensed wellness counselors.',
    features: ['Weekly counseling', 'Mood journal', 'Crisis resources'],
    priceCents: 249900,
    trialDays: 14,
    category: 'counseling',
  },
];

const INSTRUCTORS = [
  { email: 'dietician@mindful.local',  fullName: 'Aanya Sharma',       expertise: 'Clinical Dietitian',        bio: 'RD with 8 years experience in plant-forward nutrition.' },
  { email: 'meditation@mindful.local', fullName: 'Rohan Bajracharya',  expertise: 'Meditation & Yoga Coach',   bio: 'Vipassana teacher and certified yoga instructor.' },
  { email: 'counselor@mindful.local',  fullName: 'Dr. Priya Rana',     expertise: 'Wellness Counselor',        bio: 'Licensed clinical counselor specializing in stress & anxiety.' },
];

const MEAL_PLANS = [
  { title: 'Weight Loss', slug: 'weight-loss', category: 'weight_loss', description: 'Balanced deficit plan with local Kathmandu ingredients.', body: 'Focus on whole grains, dal, seasonal vegetables. 3 meals + 1 snack.' },
  { title: 'Diabetes Friendly', slug: 'diabetes-friendly', category: 'diabetes', description: 'Low-GI meals to support stable blood sugar.', body: 'Prioritize fiber, lean protein, and controlled portions of rice/roti.' },
  { title: 'Heart Healthy', slug: 'heart-healthy', category: 'heart', description: 'Sodium-aware, heart-supportive meals.', body: 'Olive oil or mustard oil in moderation, leafy greens, legumes.' },
  { title: 'Vegetarian', slug: 'vegetarian', category: 'vegetarian', description: 'Complete vegetarian plates with protein variety.', body: 'Paneer, tofu, lentils, eggs optional.' },
  { title: 'Vegan', slug: 'vegan', category: 'vegan', description: 'Plant-only nourishing templates.', body: 'Legumes, nuts, seeds, fortified plant milk.' },
  { title: 'Ayurvedic', slug: 'ayurvedic', category: 'ayurvedic', description: 'Warming, dosha-aware meal rhythm.', body: 'Cooked foods, spices like turmeric, cumin, ginger.' },
  { title: 'Buddhist Vegetarian', slug: 'buddhist-vegetarian', category: 'buddhist_vegetarian', description: 'Simple sattvic vegetarian fare.', body: 'Avoid onion/garlic if preferred; emphasize mindfulness at meals.' },
];

const MEDITATIONS = [
  { title: 'Anxiety Relief Breath', category: 'anxiety_relief', description: 'Settle the nervous system with paced breathing.', durationSec: 600 },
  { title: 'Better Sleep Wind-Down', category: 'better_sleep', description: 'Body scan to prepare for rest.', durationSec: 900 },
  { title: 'Everyday Mindfulness', category: 'mindfulness', description: 'Open awareness for daily clarity.', durationSec: 600 },
  { title: 'Self-Confidence Soften', category: 'self_confidence', description: 'Kind inner dialogue practice.', durationSec: 720 },
  { title: 'Compassion Practice', category: 'compassion', description: 'Extend care to self and others.', durationSec: 800 },
  { title: 'Buddhist Sitting', category: 'buddhist_meditation', description: 'Quiet observation of breath and mind.', durationSec: 1200 },
  { title: 'Loving Kindness (Metta)', category: 'loving_kindness', description: 'Classic metta phrases.', durationSec: 900 },
  { title: 'Breath Awareness', category: 'breath_awareness', description: 'Anchor attention on the breath.', durationSec: 500 },
];

const DESTINATIONS = [
  { country: 'Nepal', name: 'Kathmandu Valley', slug: 'kathmandu-valley', summary: 'Temples, monasteries, and Himalayan gateways.' },
  { country: 'Nepal', name: 'Pokhara & Lakeside', slug: 'pokhara', summary: 'Calm lakeside practice with mountain views.' },
  { country: 'Sri Lanka', name: 'Kandy & Cultural Triangle', slug: 'kandy', summary: 'Sacred sites and forest monasteries.' },
  { country: 'Thailand', name: 'Chiang Mai', slug: 'chiang-mai', summary: 'Temple stays and vipassana centers.' },
  { country: 'India', name: 'Dharamshala', slug: 'dharamshala', summary: 'Tibetan Buddhist learning and retreats.' },
];

const RETREATS = [
  { title: 'Kopan Monastery Stay', slug: 'kopan-monastery', category: 'buddhist_monastery_stay', country: 'Nepal', durationDays: 7, priceCents: 35000, isMonastery: true, meditationIntensity: 'moderate', privateRoom: false, description: 'Introductory monastery immersion near Kathmandu.' },
  { title: 'Silent Vipassana Week', slug: 'silent-vipassana-nepal', category: 'silent_retreat', country: 'Nepal', durationDays: 10, priceCents: 0, isMonastery: true, meditationIntensity: 'intense', description: 'Noble silence and sitting practice.' },
  { title: 'Himalayan Yoga Retreat', slug: 'himalayan-yoga', category: 'yoga_retreat', country: 'Nepal', durationDays: 5, priceCents: 45000, meditationIntensity: 'gentle', privateRoom: true, description: 'Yoga, pranayama, and mountain walks near Pokhara.' },
  { title: 'Sri Lanka Forest Monastery', slug: 'sl-forest-monastery', category: 'buddhist_monastery_stay', country: 'Sri Lanka', durationDays: 14, priceCents: 20000, isMonastery: true, meditationIntensity: 'intense', englishSpoken: true, description: 'Forest tradition stay with dana-based contribution.' },
  { title: 'Chiang Mai Meditation Retreat', slug: 'chiang-mai-meditation', category: 'meditation_retreat', country: 'Thailand', durationDays: 7, priceCents: 28000, isMonastery: true, description: 'Temple-based meditation for beginners and intermediates.' },
  { title: 'Dharamshala Pilgrimage', slug: 'dharamshala-pilgrimage', category: 'spiritual_pilgrimage', country: 'India', durationDays: 8, priceCents: 40000, meditationIntensity: 'moderate', description: 'Teachings, walks, and community practice.' },
  { title: 'Volunteer at a Nepal Monastery', slug: 'volunteer-nepal-monastery', category: 'volunteer_travel', country: 'Nepal', durationDays: 21, priceCents: 15000, isMonastery: true, womenAllowed: true, description: 'Service, simple living, and daily practice.' },
];

const COURSES = [
  { title: 'Meditation for Beginners', slug: 'meditation-beginners', description: 'Build a sustainable daily sitting habit.', priceCents: 299900, lessons: ['Posture & breath', 'Working with distraction', '7-day starter plan'] },
  { title: 'Buddhist Philosophy Essentials', slug: 'buddhist-philosophy', description: 'Core ideas for modern practitioners.', priceCents: 399900, lessons: ['Four Noble Truths', 'Impermanence', 'Compassion in action'] },
  { title: 'Mindful Eating', slug: 'mindful-eating', description: 'Bring awareness to meals and cravings.', priceCents: 249900, lessons: ['Hunger cues', 'Slow eating', 'Emotional eating'] },
  { title: 'Stress Management', slug: 'stress-management', description: 'Practical tools for calm under pressure.', priceCents: 299900, lessons: ['Nervous system basics', 'Breath tools', 'Boundaries'] },
  { title: 'Living a Meaningful Life', slug: 'meaningful-life', description: 'Values, purpose, and gentle discipline.', priceCents: 349900, lessons: ['Values map', 'Daily rituals', 'Service'] },
];

async function main() {
  for (const p of PROGRAMS) {
    await db.insert(programs).values(p).onDuplicateKeyUpdate({ set: { slug: p.slug } });
  }
  console.log(`Seeded ${PROGRAMS.length} programs`);

  const adminPass = await bcrypt.hash('admin12345', 10);
  await db.insert(users).values({
    email: 'admin@mindful.local',
    passwordHash: adminPass,
    role: 'admin',
    fullName: 'Mindful Admin',
    onboarded: true,
    emailVerified: true,
    updatedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { email: 'admin@mindful.local' } });
  console.log('Seeded admin: admin@mindful.local / admin12345');

  const asonPass = await bcrypt.hash('#asonG12', 10);
  await db.insert(users).values({
    email: 'ason.gautam@gmail.com',
    passwordHash: asonPass,
    role: 'admin',
    fullName: 'Ason Gautam',
    onboarded: true,
    emailVerified: true,
    updatedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { role: 'admin', onboarded: true, emailVerified: true } });
  console.log('Seeded admin: ason.gautam@gmail.com / #asonG12');

  const instrPass = await bcrypt.hash('instructor12345', 10);
  for (const i of INSTRUCTORS) {
    await db.insert(users).values({
      email: i.email,
      passwordHash: instrPass,
      role: 'instructor',
      fullName: i.fullName,
      expertise: i.expertise,
      bio: i.bio,
      availability: 'Mon–Fri · 10am–6pm',
      onboarded: true,
      emailVerified: true,
      updatedAt: new Date(),
    }).onDuplicateKeyUpdate({ set: { email: i.email } });
  }
  console.log(`Seeded ${INSTRUCTORS.length} instructors (password: instructor12345)`);

  for (const m of MEAL_PLANS) {
    await db.insert(mealPlans).values(m).onDuplicateKeyUpdate({ set: { title: m.title } });
  }
  console.log(`Seeded ${MEAL_PLANS.length} meal plans`);

  for (const m of MEDITATIONS) {
    await db.insert(meditations).values(m).onDuplicateKeyUpdate({ set: { title: m.title } });
  }
  console.log(`Seeded ${MEDITATIONS.length} meditations`);

  for (const d of DESTINATIONS) {
    await db.insert(destinations).values(d).onDuplicateKeyUpdate({ set: { name: d.name } });
  }
  console.log(`Seeded ${DESTINATIONS.length} destinations`);

  for (const r of RETREATS) {
    await db.insert(retreats).values(r).onDuplicateKeyUpdate({ set: { title: r.title } });
  }
  console.log(`Seeded ${RETREATS.length} retreats`);

  for (const c of COURSES) {
    await db.insert(courses).values(c).onDuplicateKeyUpdate({ set: { title: c.title } });
  }
  console.log(`Seeded ${COURSES.length} courses`);

  const soon = new Date(Date.now() + 3 * 86400000);
  soon.setHours(10, 0, 0, 0);
  try {
    await db.insert(events).values({
      title: 'Online Mindfulness Session',
      type: 'online_session',
      description: '30-minute group sit and short talk.',
      startsAt: soon,
      endsAt: new Date(soon.getTime() + 30 * 60000),
      mode: 'online',
    });
  } catch (_) { /* ignore dupes */ }

  const retreatEvent = new Date(Date.now() + 14 * 86400000);
  try {
    await db.insert(events).values({
      title: 'Weekend Mindfulness Retreat — Kathmandu',
      type: 'meditation_retreat',
      description: 'Two-day local retreat with guided practice.',
      startsAt: retreatEvent,
      mode: 'in_person',
      location: 'Kathmandu Valley',
    });
  } catch (_) { /* ignore */ }

  const dietician = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.email, 'dietician@mindful.local') });
  if (dietician) {
    for (let i = 1; i <= 5; i++) {
      const start = new Date(Date.now() + i * 86400000);
      start.setHours(11, 0, 0, 0);
      const end = new Date(start.getTime() + 45 * 60000);
      try {
        await db.insert(consultSlots).values({
          instructorId: dietician.id,
          startsAt: start,
          endsAt: end,
          mode: i % 2 === 0 ? 'in_person' : 'online',
          location: i % 2 === 0 ? 'Kathmandu clinic' : null,
        });
      } catch (_) { /* ignore */ }
    }
    console.log('Seeded consult slots for dietician');
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
