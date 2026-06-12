const { eq, and, inArray, desc } = require('drizzle-orm');
const { db } = require('../lib/db');
const { users, programs, subscriptions, instructorNotes, progressEntries } = require('../db/schema');

async function listInstructors(_req, res, next) {
  try {
    const rows = await db.query.users.findMany({
      where: (t, { eq, and }) => and(eq(t.role, 'instructor'), eq(t.active, true)),
      columns: { id: true, fullName: true, photoUrl: true, expertise: true, bio: true, availability: true },
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function getInstructor(req, res, next) {
  try {
    const id = Number(req.params.id);
    const instructor = await db.query.users.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, id), eq(t.role, 'instructor')),
      columns: { id: true, fullName: true, photoUrl: true, expertise: true, bio: true, availability: true },
    });
    if (!instructor) return res.status(404).json({ message: 'Not found' });
    res.json(instructor);
  } catch (err) { next(err); }
}

async function myAssignedUsers(req, res, next) {
  try {
    const subs = await db.query.subscriptions.findMany({
      where: (t, { eq }) => eq(t.instructorId, req.user.id),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
    const userIds = [...new Set(subs.map(s => s.userId))];
    const progIds = [...new Set(subs.map(s => s.programId))];
    const [usersData, progsData] = await Promise.all([
      userIds.length ? db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, userIds), columns: { id: true, email: true, fullName: true, photoUrl: true, wellnessGoals: true } }) : [],
      progIds.length ? db.query.programs.findMany({ where: (t, { inArray }) => inArray(t.id, progIds), columns: { id: true, name: true, slug: true } }) : [],
    ]);
    const userMap = Object.fromEntries(usersData.map(u => [u.id, u]));
    const progMap = Object.fromEntries(progsData.map(p => [p.id, p]));
    res.json(subs.map(s => ({ ...s, user: userMap[s.userId] || null, program: progMap[s.programId] || null })));
  } catch (err) { next(err); }
}

async function getAssignedUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const sub = await db.query.subscriptions.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.instructorId, req.user.id)),
    });
    if (!sub) return res.status(404).json({ message: 'Not found or not assigned to you' });

    const [userRow, progRow, notes] = await Promise.all([
      db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, userId), columns: { id: true, email: true, fullName: true, photoUrl: true, age: true, gender: true, wellnessGoals: true } }),
      db.query.programs.findFirst({ where: (t, { eq }) => eq(t.id, sub.programId) }),
      db.query.instructorNotes.findMany({ where: (t, { eq }) => eq(t.userId, userId), orderBy: (t, { desc }) => desc(t.createdAt) }),
    ]);
    const authorIds = [...new Set(notes.map(n => n.authorId))];
    const authorsData = authorIds.length
      ? await db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, authorIds), columns: { id: true, fullName: true } })
      : [];
    const authorMap = Object.fromEntries(authorsData.map(a => [a.id, a]));
    res.json({ ...sub, user: userRow, program: progRow, notes: notes.map(n => ({ ...n, author: authorMap[n.authorId] || null })) });
  } catch (err) { next(err); }
}

async function addNote(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: 'Note body required' });
    const assigned = await db.query.subscriptions.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.instructorId, req.user.id)),
    });
    if (!assigned) return res.status(403).json({ message: 'Not your assigned user' });
    const [{ id }] = await db.insert(instructorNotes).values({ userId, authorId: req.user.id, body }).$returningId();
    const note = await db.query.instructorNotes.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    res.status(201).json(note);
  } catch (err) { next(err); }
}

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
    const diff = Math.round((new Date(days[i - 1]) - new Date(days[i])) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

async function getAssignedUserProgress(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const assigned = await db.query.subscriptions.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.instructorId, req.user.id)),
    });
    if (!assigned) return res.status(403).json({ message: 'Not your assigned user' });

    const { type } = req.query;
    const TYPES = new Set(['weight', 'meditation', 'mood']);
    const entries = await db.query.progressEntries.findMany({
      where: (t, { eq, and }) => {
        const base = eq(t.userId, userId);
        if (type && TYPES.has(type)) return and(base, eq(t.type, type));
        return base;
      },
      orderBy: (t, { desc }) => desc(t.recordedAt),
      limit: 200,
    });

    const allMed = (type && type !== 'meditation')
      ? await db.query.progressEntries.findMany({
          where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.type, 'meditation')),
          orderBy: (t, { desc }) => desc(t.recordedAt),
          limit: 200,
        })
      : entries;
    res.json({ entries, meditationStreak: calcMeditationStreak(allMed) });
  } catch (err) { next(err); }
}

module.exports = { listInstructors, getInstructor, myAssignedUsers, getAssignedUser, addNote, getAssignedUserProgress };
