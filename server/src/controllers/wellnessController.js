const { eq } = require('drizzle-orm');
const { db } = require('../lib/db');
const {
  wellnessAssessments, journeyItems,
} = require('../db/schema');

function avg(vals) {
  const nums = vals.map(Number).filter((n) => !Number.isNaN(n));
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function buildJourney(mental, physical, spiritual, overall) {
  const items = [];
  const goal =
    mental <= physical && mental <= spiritual ? 'Reduce Stress' :
    physical <= mental && physical <= spiritual ? 'Improve Physical Wellness' :
    'Deepen Spiritual Practice';

  items.push({ title: '10 min meditation daily', category: 'meditation', sortOrder: 1 });
  if (physical < 75) items.push({ title: 'Diet consultation', category: 'diet', sortOrder: 2 });
  if (spiritual < 80 || overall < 70) items.push({ title: 'Weekend mindfulness retreat', category: 'travel', sortOrder: 3 });
  if ((mental?.sleep_quality ?? 50) < 70) items.push({ title: 'Sleep improvement challenge', category: 'mental', sortOrder: 4 });
  if ((physical?.health_goals || '').toString()) items.push({ title: 'Follow your meal plan 5 days this week', category: 'diet', sortOrder: 5 });
  items.push({ title: 'Write in your wellness journal', category: 'journal', sortOrder: 6 });
  return { goal, items };
}

async function getScores(req, res, next) {
  try {
    const latest = await db.query.wellnessAssessments.findFirst({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
    const journey = await db.query.journeyItems.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { asc }) => asc(t.sortOrder),
    });
    res.json({
      assessment: latest || null,
      scores: latest ? {
        overall: latest.overallScore,
        mental: latest.mentalScore,
        physical: latest.physicalScore,
        spiritual: latest.spiritualScore,
      } : null,
      journey,
      currentGoal: journey.length ? inferGoal(journey) : null,
    });
  } catch (err) { next(err); }
}

function inferGoal(journey) {
  if (journey.some((j) => /stress|sleep|meditation/i.test(j.title) && !j.completed)) return 'Reduce Stress';
  if (journey.some((j) => /diet|meal/i.test(j.title) && !j.completed)) return 'Improve Physical Wellness';
  return 'Your Recommended Journey';
}

async function submitAssessment(req, res, next) {
  try {
    const { mental = {}, physical = {}, spiritual = {} } = req.body;

    const mentalScore = scoreFromLikert(mental, [
      'stress_level', 'anxiety_level', 'sleep_quality', 'emotional_balance', 'energy_level',
    ]);
    // Invert stress/anxiety (higher input = worse) — UI will send 0-100 where 100 is best after client maps,
    // but accept raw 1-10 and normalize
    const normalize = (v, invert = false) => {
      let n = Number(v);
      if (Number.isNaN(n)) return 50;
      if (n <= 10) n = n * 10; // 1-10 scale → 10-100
      n = Math.min(100, Math.max(0, n));
      return invert ? 100 - n : n;
    };
    const mScore = avg([
      normalize(mental.stress_level, true),
      normalize(mental.anxiety_level, true),
      normalize(mental.sleep_quality),
      normalize(mental.emotional_balance),
      normalize(mental.energy_level),
    ]);
    const weight = Number(physical.weight);
    const height = Number(physical.height);
    let bmi = null;
    if (weight && height) bmi = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;
    const pScore = avg([
      bmi ? (bmi >= 18.5 && bmi <= 24.9 ? 85 : bmi < 18.5 || bmi > 30 ? 45 : 65) : 60,
      physical.health_goals ? 75 : 55,
      Array.isArray(physical.dietary_preferences) && physical.dietary_preferences.length ? 80 : 60,
    ]);
    const sScore = avg([
      normalize(spiritual.meditation_experience),
      normalize(spiritual.spiritual_interest),
      normalize(spiritual.life_purpose_clarity),
      spiritual.interest_in_retreats ? 80 : 55,
    ]);
    const overall = Math.round((mScore + pScore + sScore) / 3);

    const physicalPayload = { ...physical, bmi };
    const [{ id }] = await db.insert(wellnessAssessments).values({
      userId: req.user.id,
      mental,
      physical: physicalPayload,
      spiritual,
      mentalScore: mScore,
      physicalScore: pScore,
      spiritualScore: sScore,
      overallScore: overall,
    }).$returningId();

    // Rebuild journey
    await db.delete(journeyItems).where(eq(journeyItems.userId, req.user.id));
    const { goal, items } = buildJourney(mental, physicalPayload, spiritual, overall);
    if (items.length) {
      await db.insert(journeyItems).values(
        items.map((it) => ({ userId: req.user.id, ...it }))
      );
    }

    const assessment = await db.query.wellnessAssessments.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
    const journey = await db.query.journeyItems.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { asc }) => asc(t.sortOrder),
    });

    res.status(201).json({
      assessment,
      scores: { overall, mental: mScore, physical: pScore, spiritual: sScore },
      journey,
      currentGoal: goal,
    });
  } catch (err) { next(err); }
}

async function toggleJourneyItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await db.query.journeyItems.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, id), eq(t.userId, req.user.id)),
    });
    if (!item) return res.status(404).json({ message: 'Not found' });
    await db.update(journeyItems)
      .set({ completed: !item.completed })
      .where(eq(journeyItems.id, id));
    res.json({ id, completed: !item.completed });
  } catch (err) { next(err); }
}

module.exports = { getScores, submitAssessment, toggleJourneyItem };
