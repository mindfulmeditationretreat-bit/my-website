const { eq, and, inArray, count } = require('drizzle-orm');
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
    const sub = await db.query.subscriptions.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: { program: true },
    });

    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, req.user.id) });
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

    res.status(201).json(sub);
  } catch (err) { next(err); }
}

async function listMySubscriptions(req, res, next) {
  try {
    const subs = await db.query.subscriptions.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      with: {
        program: true,
        instructor: { columns: { id: true, fullName: true, photoUrl: true, expertise: true, bio: true, availability: true } },
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
    res.json(subs);
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
