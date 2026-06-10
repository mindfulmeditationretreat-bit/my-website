const { prisma } = require('../lib/prisma');

async function listInstructors(_req, res, next) {
  try {
    const instructors = await prisma.user.findMany({
      where: { role: 'instructor', active: true },
      select: { id: true, fullName: true, photoUrl: true, expertise: true, bio: true, availability: true },
    });
    res.json(instructors);
  } catch (err) { next(err); }
}

async function getInstructor(req, res, next) {
  try {
    const id = Number(req.params.id);
    const instructor = await prisma.user.findFirst({
      where: { id, role: 'instructor' },
      select: { id: true, fullName: true, photoUrl: true, expertise: true, bio: true, availability: true },
    });
    if (!instructor) return res.status(404).json({ message: 'Not found' });
    res.json(instructor);
  } catch (err) { next(err); }
}

async function myAssignedUsers(req, res, next) {
  try {
    const subs = await prisma.subscription.findMany({
      where: { instructorId: req.user.id },
      include: {
        user: { select: { id: true, email: true, fullName: true, photoUrl: true, wellnessGoals: true } },
        program: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(subs);
  } catch (err) { next(err); }
}

async function getAssignedUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const sub = await prisma.subscription.findFirst({
      where: { userId, instructorId: req.user.id },
      include: {
        user: { select: {
          id: true, email: true, fullName: true, photoUrl: true,
          age: true, gender: true, wellnessGoals: true,
        }},
        program: true,
      },
    });
    if (!sub) return res.status(404).json({ message: 'Not found or not assigned to you' });
    const notes = await prisma.instructorNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, fullName: true } } },
    });
    res.json({ ...sub, notes });
  } catch (err) { next(err); }
}

async function addNote(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: 'Note body required' });
    const assigned = await prisma.subscription.findFirst({
      where: { userId, instructorId: req.user.id },
    });
    if (!assigned) return res.status(403).json({ message: 'Not your assigned user' });
    const note = await prisma.instructorNote.create({
      data: { userId, authorId: req.user.id, body },
    });
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
    const assigned = await prisma.subscription.findFirst({
      where: { userId, instructorId: req.user.id },
    });
    if (!assigned) return res.status(403).json({ message: 'Not your assigned user' });
    const { type } = req.query;
    const TYPES = new Set(['weight', 'meditation', 'mood']);
    const where = { userId };
    if (type && TYPES.has(type)) where.type = type;
    const entries = await prisma.progressEntry.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
    const allMed = (type && type !== 'meditation')
      ? await prisma.progressEntry.findMany({ where: { userId, type: 'meditation' }, orderBy: { recordedAt: 'desc' }, take: 200 })
      : entries;
    res.json({ entries, meditationStreak: calcMeditationStreak(allMed) });
  } catch (err) { next(err); }
}

module.exports = { listInstructors, getInstructor, myAssignedUsers, getAssignedUser, addNote, getAssignedUserProgress };
