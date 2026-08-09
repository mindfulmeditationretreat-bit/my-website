const { eq, and, desc, sql } = require('drizzle-orm');
const { db } = require('../lib/db');
const {
  meditations, meditationFavorites, meditationPlays,
  dailyPractices, dailyPracticeLogs,
} = require('../db/schema');

const DEFAULT_PRACTICES = [
  { practiceText: '5 minutes of mindful breathing', reflectionPrompt: 'What are you grateful for today?', challengeText: 'Walk 10 minutes mindfully.' },
  { practiceText: 'Body scan for 8 minutes', reflectionPrompt: 'Where do you feel tension in your body?', challengeText: 'Put your phone away during one meal.' },
  { practiceText: 'Loving-kindness for yourself and others', reflectionPrompt: 'Who needs your kindness today?', challengeText: 'Offer a genuine compliment to someone.' },
  { practiceText: 'Silent sitting — watch the breath', reflectionPrompt: 'What thought kept returning?', challengeText: 'Spend 15 minutes outdoors without headphones.' },
  { practiceText: 'Gratitude meditation', reflectionPrompt: 'Name three quiet joys from today.', challengeText: 'Write one kind note to yourself.' },
];

function todayDate() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

async function ensureTodayPractice() {
  const day = todayDate();
  let row = await db.query.dailyPractices.findFirst({
    where: (t, { eq }) => eq(t.practiceDate, day),
  });
  if (row) return row;
  // MySQL date compare can be finicky — try by string match via all recent
  const all = await db.query.dailyPractices.findMany({ limit: 30 });
  row = all.find((p) => dateKey(p.practiceDate) === dateKey(day));
  if (row) return row;
  const pick = DEFAULT_PRACTICES[day.getDay() % DEFAULT_PRACTICES.length];
  try {
    const [{ id }] = await db.insert(dailyPractices).values({
      practiceDate: day,
      ...pick,
    }).$returningId();
    return db.query.dailyPractices.findFirst({ where: (t, { eq }) => eq(t.id, id) });
  } catch {
    const again = await db.query.dailyPractices.findMany({ limit: 30 });
    return again.find((p) => dateKey(p.practiceDate) === dateKey(day)) || { ...pick, practiceDate: day };
  }
}

function calcStreak(plays) {
  const days = [...new Set(plays.map((p) => dateKey(p.playedAt)))].sort().reverse();
  if (!days.length) return 0;
  const today = dateKey(new Date());
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((new Date(days[i - 1]) - new Date(days[i])) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

async function listMeditations(req, res, next) {
  try {
    const { category } = req.query;
    const rows = await db.query.meditations.findMany({
      where: (t, { eq, and }) => {
        const base = eq(t.active, true);
        if (category) return and(base, eq(t.category, category));
        return base;
      },
      orderBy: (t, { asc }) => asc(t.title),
    });
    let favIds = new Set();
    if (req.user?.id) {
      const favs = await db.query.meditationFavorites.findMany({
        where: (t, { eq }) => eq(t.userId, req.user.id),
      });
      favIds = new Set(favs.map((f) => f.meditationId));
    }
    res.json(rows.map((m) => ({ ...m, favorited: favIds.has(m.id) })));
  } catch (err) { next(err); }
}

async function toggleFavorite(req, res, next) {
  try {
    const meditationId = Number(req.params.id);
    const existing = await db.query.meditationFavorites.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, req.user.id), eq(t.meditationId, meditationId)),
    });
    if (existing) {
      await db.delete(meditationFavorites).where(eq(meditationFavorites.id, existing.id));
      return res.json({ favorited: false });
    }
    await db.insert(meditationFavorites).values({ userId: req.user.id, meditationId });
    res.json({ favorited: true });
  } catch (err) { next(err); }
}

async function recordPlay(req, res, next) {
  try {
    const meditationId = Number(req.params.id);
    await db.insert(meditationPlays).values({ userId: req.user.id, meditationId });
    const plays = await db.query.meditationPlays.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.playedAt),
      limit: 200,
    });
    res.json({ ok: true, streak: calcStreak(plays) });
  } catch (err) { next(err); }
}

async function myMeditationStats(req, res, next) {
  try {
    const plays = await db.query.meditationPlays.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.playedAt),
      limit: 200,
    });
    const favs = await db.query.meditationFavorites.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
    });
    res.json({ streak: calcStreak(plays), favoritesCount: favs.length, playsCount: plays.length });
  } catch (err) { next(err); }
}

async function getDailyPractice(req, res, next) {
  try {
    const practice = await ensureTodayPractice();
    const day = todayDate();
    const logs = await db.query.dailyPracticeLogs.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      limit: 40,
    });
    const log = logs.find((l) => dateKey(l.practiceDate) === dateKey(day)) || null;
    res.json({ practice, log });
  } catch (err) { next(err); }
}

async function saveDailyPractice(req, res, next) {
  try {
    const day = todayDate();
    const { practiceDone, challengeDone, reflection } = req.body;
    const logs = await db.query.dailyPracticeLogs.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      limit: 40,
    });
    const existing = logs.find((l) => dateKey(l.practiceDate) === dateKey(day));
    if (existing) {
      await db.update(dailyPracticeLogs).set({
        practiceDone: practiceDone != null ? !!practiceDone : existing.practiceDone,
        challengeDone: challengeDone != null ? !!challengeDone : existing.challengeDone,
        reflection: reflection !== undefined ? reflection : existing.reflection,
      }).where(eq(dailyPracticeLogs.id, existing.id));
      const row = await db.query.dailyPracticeLogs.findFirst({ where: (t, { eq }) => eq(t.id, existing.id) });
      return res.json(row);
    }
    const [{ id }] = await db.insert(dailyPracticeLogs).values({
      userId: req.user.id,
      practiceDate: day,
      practiceDone: !!practiceDone,
      challengeDone: !!challengeDone,
      reflection: reflection || null,
    }).$returningId();
    const row = await db.query.dailyPracticeLogs.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    res.status(201).json(row);
  } catch (err) { next(err); }
}

async function adminUpsertMeditation(req, res, next) {
  try {
    const { id, title, category, description, audioUrl, durationSec, isPremium, active } = req.body;
    if (!title || !category) return res.status(400).json({ message: 'title and category required' });
    if (id) {
      await db.update(meditations).set({
        title, category,
        description: description || null,
        audioUrl: audioUrl || null,
        durationSec: durationSec ? Number(durationSec) : 300,
        isPremium: !!isPremium,
        active: active !== false,
      }).where(eq(meditations.id, Number(id)));
      return res.json(await db.query.meditations.findFirst({ where: (t, { eq }) => eq(t.id, Number(id)) }));
    }
    const [{ id: newId }] = await db.insert(meditations).values({
      title, category,
      description: description || null,
      audioUrl: audioUrl || null,
      durationSec: durationSec ? Number(durationSec) : 300,
      isPremium: !!isPremium,
    }).$returningId();
    res.status(201).json(await db.query.meditations.findFirst({ where: (t, { eq }) => eq(t.id, newId) }));
  } catch (err) { next(err); }
}

module.exports = {
  listMeditations, toggleFavorite, recordPlay, myMeditationStats,
  getDailyPractice, saveDailyPractice, adminUpsertMeditation,
};
