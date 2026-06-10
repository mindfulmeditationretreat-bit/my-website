const { eq, and } = require('drizzle-orm');
const { db } = require('../lib/db');
const { progressEntries } = require('../db/schema');

const TYPES = new Set(['weight', 'meditation', 'mood']);

function calcMeditationStreak(entries) {
  const days = [...new Set(
    entries
      .filter((e) => e.type === 'meditation')
      .map((e) => new Date(e.recordedAt).toISOString().slice(0, 10))
  )].sort().reverse();

  if (!days.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

async function addEntry(req, res, next) {
  try {
    const { type, value, note } = req.body;
    if (!TYPES.has(type)) return res.status(400).json({ message: 'Invalid type' });
    const [{ id }] = await db.insert(progressEntries).values({
      userId: req.user.id,
      type,
      value: value != null ? Number(value) : null,
      note: note || null,
    }).$returningId();
    const entry = await db.query.progressEntries.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    res.status(201).json(entry);
  } catch (err) { next(err); }
}

async function listEntries(req, res, next) {
  try {
    const { type } = req.query;
    const entries = await db.query.progressEntries.findMany({
      where: (t, { eq, and }) => {
        const base = eq(t.userId, req.user.id);
        if (type && TYPES.has(type)) return and(base, eq(t.type, type));
        return base;
      },
      orderBy: (t, { desc }) => desc(t.recordedAt),
      limit: 200,
    });

    const allMeditation = type && type !== 'meditation'
      ? await db.query.progressEntries.findMany({
          where: (t, { eq, and }) => and(eq(t.userId, req.user.id), eq(t.type, 'meditation')),
          orderBy: (t, { desc }) => desc(t.recordedAt),
          limit: 200,
        })
      : entries;
    const meditationStreak = calcMeditationStreak(allMeditation);

    res.json({ entries, meditationStreak });
  } catch (err) { next(err); }
}

module.exports = { addEntry, listEntries };
