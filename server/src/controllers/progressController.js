const { prisma } = require('../lib/prisma');

const TYPES = new Set(['weight', 'meditation', 'mood']);

function calcMeditationStreak(entries) {
  // entries are ordered desc by recordedAt; streak = consecutive distinct calendar days ending today/yesterday
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
    const entry = await prisma.progressEntry.create({
      data: {
        userId: req.user.id,
        type,
        value: value != null ? Number(value) : null,
        note: note || null,
      },
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
}

async function listEntries(req, res, next) {
  try {
    const { type } = req.query;
    const where = { userId: req.user.id };
    if (type && TYPES.has(type)) where.type = type;
    const entries = await prisma.progressEntry.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });

    // Always include streak alongside the entries
    const allMeditation = type && type !== 'meditation'
      ? await prisma.progressEntry.findMany({ where: { userId: req.user.id, type: 'meditation' }, orderBy: { recordedAt: 'desc' }, take: 200 })
      : entries;
    const meditationStreak = calcMeditationStreak(allMeditation);

    res.json({ entries, meditationStreak });
  } catch (err) { next(err); }
}

module.exports = { addEntry, listEntries };
