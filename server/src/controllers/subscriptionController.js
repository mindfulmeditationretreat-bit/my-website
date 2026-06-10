const { prisma } = require('../lib/prisma');
const { sendMail, templates } = require('../lib/mailer');

async function startTrial(req, res, next) {
  try {
    const { programSlug } = req.body;
    const program = await prisma.program.findUnique({ where: { slug: programSlug } });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const existing = await prisma.subscription.findUnique({
      where: { userId_programId: { userId: req.user.id, programId: program.id } },
    });
    if (existing) return res.status(409).json({ message: 'You already have this program' });

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + program.trialDays * 24 * 60 * 60 * 1000);
    const sub = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        programId: program.id,
        status: 'trialing',
        trialStartedAt: now,
        trialEndsAt,
      },
      include: { program: true },
    });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    try {
      const tpl = templates.trialStarted(program.name, program.trialDays);
      await sendMail({ to: user.email, ...tpl });
    } catch (e) { console.error('[startTrial] email failed', e.message); }

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'trial_started',
        title: `${program.name} trial started`,
        body: `Your ${program.trialDays}-day free trial has begun.`,
        link: '/dashboard/programs',
      },
    });

    res.status(201).json(sub);
  } catch (err) { next(err); }
}

async function listMySubscriptions(req, res, next) {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      include: {
        program: true,
        instructor: { select: { id: true, fullName: true, photoUrl: true, expertise: true, bio: true, availability: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(subs);
  } catch (err) { next(err); }
}

async function cancelSubscription(req, res, next) {
  try {
    const id = Number(req.params.id);
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub || sub.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await prisma.subscription.update({ where: { id }, data: { status: 'cancelled' } });
    res.json({ message: 'Cancelled' });
  } catch (err) { next(err); }
}

async function userHasActiveAccess(userId) {
  const count = await prisma.subscription.count({
    where: { userId, status: { in: ['trialing', 'active'] } },
  });
  return count > 0;
}

module.exports = { startTrial, listMySubscriptions, cancelSubscription, userHasActiveAccess };
