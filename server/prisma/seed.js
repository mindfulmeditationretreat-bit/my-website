const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
  { email: 'dietician@mindful.local',  fullName: 'Aanya Sharma',  expertise: 'Clinical Dietitian',        bio: 'RD with 8 years experience in plant-forward nutrition.' },
  { email: 'meditation@mindful.local', fullName: 'Rohan Bajracharya', expertise: 'Meditation & Yoga Coach', bio: 'Vipassana teacher and certified yoga instructor.' },
  { email: 'counselor@mindful.local',  fullName: 'Dr. Priya Rana', expertise: 'Wellness Counselor',       bio: 'Licensed clinical counselor specializing in stress & anxiety.' },
];

async function main() {
  for (const p of PROGRAMS) {
    await prisma.program.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log(`Seeded ${PROGRAMS.length} programs`);

  const adminPass = await bcrypt.hash('admin12345', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mindful.local' },
    update: {},
    create: {
      email: 'admin@mindful.local',
      passwordHash: adminPass,
      role: 'admin',
      fullName: 'Mindful Admin',
      onboarded: true,
      emailVerified: true,
    },
  });
  console.log('Seeded admin: admin@mindful.local / admin12345');

  const instrPass = await bcrypt.hash('instructor12345', 10);
  for (const i of INSTRUCTORS) {
    await prisma.user.upsert({
      where: { email: i.email },
      update: {},
      create: {
        email: i.email,
        passwordHash: instrPass,
        role: 'instructor',
        fullName: i.fullName,
        expertise: i.expertise,
        bio: i.bio,
        availability: 'Mon–Fri · 10am–6pm',
        onboarded: true,
        emailVerified: true,
      },
    });
  }
  console.log(`Seeded ${INSTRUCTORS.length} instructors (password: instructor12345)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
