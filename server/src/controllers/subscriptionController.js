const { eq, and, inArray, count, desc } = require('drizzle-orm');
const { db } = require('../lib/db');
const { subscriptions, programs, users, notifications } = require('../db/schema');
const { sendMail, templates } = require('../lib/mailer');

async function startTrial(req, res, next) {
  try {
    const { programSlug } = req.body;
    const program = await db.query.programs.findFirst({ where: (t, { eq }) => eq(t.slug, programSlug) });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const existing = await db.query.subscriptions.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, req.user.id), eq(t.programId, program.id)),
    });
    if (existing) return res.status(409).json({ message: 'You already have this program' });

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + program.trialDays * 24 * 60 * 60 * 1000);
    const [{ id }] = await db.insert(subscriptions).values({
      userId: req.user.id,
      programId: program.id,
      status: 'trialing',
      trialStartedAt: now,
      trialEndsAt,
      updatedAt: now,
    }).$returningId();
    const [sub, user] = await Promise.all([
      db.query.subscriptions.findFirst({ where: (t, { eq }) => eq(t.id, id) }),
      db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, req.user.id) }),
    ]);
    try {
      const tpl = templates.trialStarted(program.name, program.trialDays);
      await sendMail({ to: user.email, ...tpl });
    } catch (e) { console.error('[startTrial] email failed', e.message); }

    await db.insert(notifications).values({
      userId: req.user.id,
      type: 'trial_started',
      title: `${program.name} trial started`,
      body: `Your ${program.trialDays}-day free trial has begun.`,
      link: '/dashboard/programs',
    });

    res.status(201).json({ ...sub, program });
  } catch (err) { next(err); }
}

async function listMySubscriptions(req, res, next) {
  try {
    const subs = await db.query.subscriptions.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
    const progIds = [...new Set(subs.map(s => s.programId))];
    const instrIds = [...new Set(subs.map(s => s.instructorId).filter(Boolean))];
    const [progsData, instrsData] = await Promise.all([
      progIds.length ? db.query.programs.findMany({ where: (t, { inArray }) => inArray(t.id, progIds) }) : [],
      instrIds.length ? db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, instrIds), columns: { id: true, fullName: true, photoUrl: true, expertise: true, bio: true, availability: true } }) : [],
    ]);
    const progMap = Object.fromEntries(progsData.map(p => [p.id, p]));
    const instrMap = Object.fromEntries(instrsData.map(i => [i.id, i]));
    res.json(subs.map(s => ({
      ...s,
      program: progMap[s.programId] || null,
      instructor: s.instructorId ? instrMap[s.instructorId] || null : null,
    })));
  } catch (err) { next(err); }
}

async function cancelSubscription(req, res, next) {
  try {
    const id = Number(req.params.id);
    const sub = await db.query.subscriptions.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    if (!sub || sub.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await db.update(subscriptions).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(subscriptions.id, id));
    res.json({ message: 'Cancelled' });
  } catch (err) { next(err); }
}

async function userHasActiveAccess(userId) {
  const [{ value }] = await db.select({ value: count() }).from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ['trialing', 'active'])));
  return Number(value) > 0;
}

module.exports = { startTrial, listMySubscriptions, cancelSubscription, userHasActiveAccess };
