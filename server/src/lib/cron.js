const cron = require('node-cron');
const { prisma } = require('./prisma');
const { sendMail, templates } = require('./mailer');
const { notify } = require('./notify');

async function expireTrials() {
  const now = new Date();
  const expiring = await prisma.subscription.findMany({
    where: { status: 'trialing', trialEndsAt: { lte: now } },
    include: { program: true, user: true },
  });
  for (const sub of expiring) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'expired' },
    });
    await notify(sub.userId, {
      type: 'trial_expired',
      title: `Your ${sub.program.name} trial has ended`,
      body: 'Subscribe to keep your premium access.',
      link: '/dashboard/programs',
      email: true,
    });
  }
  if (expiring.length) console.log(`[cron] expired ${expiring.length} trial(s)`);
}

async function notifyEndingTrials() {
  const threshold = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const ending = await prisma.subscription.findMany({
    where: {
      status: 'trialing',
      trialEndsAt: { gt: now, lte: threshold },
      trialEndingNotified: false,
    },
    include: { program: true, user: true },
  });
  for (const sub of ending) {
    const daysLeft = Math.max(1, Math.ceil((sub.trialEndsAt - now) / (1000 * 60 * 60 * 24)));
    const tpl = templates.trialEnding(sub.program.name, daysLeft);
    if (sub.user?.email) await sendMail({ to: sub.user.email, ...tpl });
    await prisma.notification.create({
      data: {
        userId: sub.userId,
        type: 'trial_ending',
        title: tpl.subject,
        body: `Your ${sub.program.name} trial ends in ${daysLeft} day(s).`,
        link: '/dashboard/programs',
      },
    });
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { trialEndingNotified: true },
    });
  }
  if (ending.length) console.log(`[cron] notified ${ending.length} ending trial(s)`);
}

function startCron() {
  cron.schedule('0 * * * *', async () => {
    try { await expireTrials(); } catch (e) { console.error('[cron] expireTrials', e); }
    try { await notifyEndingTrials(); } catch (e) { console.error('[cron] notifyEndingTrials', e); }
  });
  console.log('[cron] trial-expiry job scheduled (hourly)');
}

module.exports = { startCron, expireTrials, notifyEndingTrials };
