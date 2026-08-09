const { eq, gte, desc, asc, inArray } = require('drizzle-orm');
const { db } = require('../lib/db');
const {
  healthProfiles, mealPlans, mealPlanLogs, consultSlots,
} = require('../db/schema');

function calcBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h) return null;
  return Math.round((w / ((h / 100) ** 2)) * 10) / 10;
}

function calcIbw(heightCm) {
  const h = Number(heightCm);
  if (!h) return null;
  return Math.round((h - 100) * 10) / 10;
}

function bmiCategory(bmi) {
  if (bmi == null || Number.isNaN(Number(bmi))) return null;
  const v = Number(bmi);
  if (v < 18.5) return 'Underweight';
  if (v <= 24.9) return 'Normal weight';
  if (v <= 29.9) return 'Overweight';
  if (v <= 34.9) return 'Obesity Class I';
  if (v <= 39.9) return 'Obesity Class II';
  return 'Obesity Class III';
}

function enrichProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    ibw: profile.ibw ?? calcIbw(profile.heightCm),
    bmiCategory: profile.bmiCategory || bmiCategory(profile.bmi),
    bmiChart: [
      { range: '< 18.5', category: 'Underweight' },
      { range: '18.5 – 24.9', category: 'Normal weight' },
      { range: '25.0 – 29.9', category: 'Overweight' },
      { range: '30.0 – 34.9', category: 'Obesity Class I' },
      { range: '35.0 – 39.9', category: 'Obesity Class II' },
      { range: '≥ 40.0', category: 'Obesity Class III' },
    ],
  };
}

async function getHealthProfile(req, res, next) {
  try {
    const profile = await db.query.healthProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, req.user.id),
    });
    res.json(enrichProfile(profile));
  } catch (err) { next(err); }
}

async function upsertHealthProfile(req, res, next) {
  try {
    const {
      age, sex, weightKg, heightCm,
      foodBehaviour, foodAllergy,
      medicalConditions, medicalOther, medication,
      drinkingSmoking, fastingOrNoMeat, canCarryTiffin,
      medicalConcerns, dietPreferences,
    } = req.body;

    const w = weightKg != null && weightKg !== '' ? Number(weightKg) : null;
    const h = heightCm != null && heightCm !== '' ? Number(heightCm) : null;
    const bmi = calcBmi(w, h);
    const ibw = calcIbw(h);
    const category = bmiCategory(bmi);

    const conditions = Array.isArray(medicalConditions)
      ? medicalConditions
      : (typeof medicalConditions === 'string' && medicalConditions.trim()
          ? medicalConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : null);

    const data = {
      age: age != null && age !== '' ? Number(age) : null,
      sex: sex || null,
      weightKg: w,
      heightCm: h,
      bmi,
      ibw,
      bmiCategory: category,
      foodBehaviour: foodBehaviour || null,
      foodAllergy: foodAllergy || null,
      medicalConditions: conditions,
      medicalOther: medicalOther || null,
      medication: medication || null,
      drinkingSmoking: drinkingSmoking || null,
      fastingOrNoMeat: fastingOrNoMeat || null,
      canCarryTiffin: canCarryTiffin == null ? null : !!canCarryTiffin,
      medicalConcerns: medicalConcerns || (conditions ? conditions.join(', ') : null),
      dietPreferences: Array.isArray(dietPreferences) ? dietPreferences : (dietPreferences || null),
      updatedAt: new Date(),
    };

    const existing = await db.query.healthProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, req.user.id),
    });
    if (existing) {
      await db.update(healthProfiles).set(data).where(eq(healthProfiles.userId, req.user.id));
    } else {
      await db.insert(healthProfiles).values({ userId: req.user.id, ...data });
    }
    const profile = await db.query.healthProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, req.user.id),
    });
    res.json(enrichProfile(profile));
  } catch (err) { next(err); }
}

async function listMealPlans(req, res, next) {
  try {
    const rows = await db.query.mealPlans.findMany({
      where: (t, { eq }) => eq(t.active, true),
      orderBy: (t, { asc }) => asc(t.title),
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function getMealPlan(req, res, next) {
  try {
    const id = Number(req.params.id);
    const plan = await db.query.mealPlans.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
    if (!plan || !plan.active) return res.status(404).json({ message: 'Not found' });
    res.json(plan);
  } catch (err) { next(err); }
}

async function logMealCompliance(req, res, next) {
  try {
    const mealPlanId = Number(req.params.id);
    const { compliant = true, note, loggedOn } = req.body;
    const day = loggedOn ? new Date(loggedOn) : new Date();
    day.setHours(12, 0, 0, 0);
    const [{ id }] = await db.insert(mealPlanLogs).values({
      userId: req.user.id,
      mealPlanId,
      loggedOn: day,
      compliant: !!compliant,
      note: note || null,
    }).$returningId();
    const row = await db.query.mealPlanLogs.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    res.status(201).json(row);
  } catch (err) { next(err); }
}

async function myMealLogs(req, res, next) {
  try {
    const rows = await db.query.mealPlanLogs.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.loggedOn),
      limit: 60,
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function listOpenSlots(req, res, next) {
  try {
    const now = new Date();
    const slots = await db.query.consultSlots.findMany({
      where: (t, { eq, and, gte }) => and(eq(t.status, 'open'), gte(t.startsAt, now)),
      orderBy: (t, { asc }) => asc(t.startsAt),
      limit: 50,
    });
    const instrIds = [...new Set(slots.map((s) => s.instructorId))];
    const instructors = instrIds.length
      ? await db.query.users.findMany({
          where: (t, { inArray }) => inArray(t.id, instrIds),
          columns: { id: true, fullName: true, expertise: true, photoUrl: true },
        })
      : [];
    const map = Object.fromEntries(instructors.map((i) => [i.id, i]));
    res.json(slots.map((s) => ({ ...s, instructor: map[s.instructorId] || null })));
  } catch (err) { next(err); }
}

async function bookSlot(req, res, next) {
  try {
    const id = Number(req.params.id);
    const slot = await db.query.consultSlots.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
    if (!slot || slot.status !== 'open') return res.status(409).json({ message: 'Slot unavailable' });
    await db.update(consultSlots).set({
      status: 'booked',
      bookedById: req.user.id,
      note: req.body?.note || null,
    }).where(eq(consultSlots.id, id));
    const updated = await db.query.consultSlots.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    res.json(updated);
  } catch (err) { next(err); }
}

async function myBookings(req, res, next) {
  try {
    const slots = await db.query.consultSlots.findMany({
      where: (t, { eq }) => eq(t.bookedById, req.user.id),
      orderBy: (t, { desc }) => desc(t.startsAt),
      limit: 30,
    });
    res.json(slots);
  } catch (err) { next(err); }
}

// Admin / provider content
async function adminUpsertMealPlan(req, res, next) {
  try {
    const { id, title, slug, category, description, fileUrl, body, isPremium, active } = req.body;
    if (!title || !slug || !category) return res.status(400).json({ message: 'title, slug, category required' });
    if (id) {
      await db.update(mealPlans).set({
        title, slug, category,
        description: description || null,
        fileUrl: fileUrl || null,
        body: body || null,
        isPremium: !!isPremium,
        active: active !== false,
      }).where(eq(mealPlans.id, Number(id)));
      const row = await db.query.mealPlans.findFirst({ where: (t, { eq }) => eq(t.id, Number(id)) });
      return res.json(row);
    }
    const [{ id: newId }] = await db.insert(mealPlans).values({
      title, slug, category,
      description: description || null,
      fileUrl: fileUrl || null,
      body: body || null,
      isPremium: !!isPremium,
    }).$returningId();
    const row = await db.query.mealPlans.findFirst({ where: (t, { eq }) => eq(t.id, newId) });
    res.status(201).json(row);
  } catch (err) { next(err); }
}

async function createSlot(req, res, next) {
  try {
    const instructorId = req.user.role === 'admin' && req.body.instructorId
      ? Number(req.body.instructorId)
      : req.user.id;
    const { startsAt, endsAt, mode, location } = req.body;
    if (!startsAt || !endsAt) return res.status(400).json({ message: 'startsAt and endsAt required' });
    const [{ id }] = await db.insert(consultSlots).values({
      instructorId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      mode: mode === 'in_person' ? 'in_person' : 'online',
      location: location || null,
    }).$returningId();
    const row = await db.query.consultSlots.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    res.status(201).json(row);
  } catch (err) { next(err); }
}

module.exports = {
  getHealthProfile, upsertHealthProfile,
  listMealPlans, getMealPlan, logMealCompliance, myMealLogs,
  listOpenSlots, bookSlot, myBookings,
  adminUpsertMealPlan, createSlot,
};
