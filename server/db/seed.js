require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../src/db/index');
const { programs, users } = require('../src/db/schema');
const { sql } = require('drizzle-orm');

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

async function main() {
  // Programs — insert, skip on duplicate slug
  for (const p of PROGRAMS) {
    await db.insert(programs).values(p).onDuplicateKeyUpdate({ set: { slug: p.slug } });
  }
  console.log(`Seeded ${PROGRAMS.length} programs`);

  // Admin user
  const adminPass = await bcrypt.hash('admin12345', 10);
  await db.insert(users).values({
    email: 'admin@mindful.local',
    passwordHash: adminPass,
    role: 'admin',
    fullName: 'Mindful Admin',
    onboarded: true,
    emailVerified: true,
  }).onDuplicateKeyUpdate({ set: { email: 'admin@mindful.local' } });
  console.log('Seeded admin: admin@mindful.local / admin12345');

  // Instructors
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
    }).onDuplicateKeyUpdate({ set: { email: i.email } });
  }
  console.log(`Seeded ${INSTRUCTORS.length} instructors (password: instructor12345)`);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
