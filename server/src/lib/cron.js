const cron = require('node-cron');
const { db } = require('./prisma');
const { subscriptions, notifications } = require('../db/schema');
const { eq, and, lte, gt } = require('drizzle-orm');
const { sendMail, templates } = require('./mailer');
const { notify } = require('./notify');

async function expireTrials() {
  const now = new Date();
  const expiring = await db.query.subscriptions.findMany({
    where: (t, { and: a, eq: e, lte: l }) => a(e(t.status, 'trialing'), l(t.trialEndsAt, now)),
    with: { program: true, user: true },
  });
  for (const sub of expiring) {
    await db.update(subscriptions).set({ status: 'expired' }).where(eq(subscriptions.id, sub.id));
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
  const ending = await db.query.subscriptions.findMany({
    where: (t, { and: a, eq: e, gt: g, lte: l }) => a(
      e(t.status, 'trialing'),
      g(t.trialEndsAt, now),
      l(t.trialEndsAt, threshold),
      e(t.trialEndingNotified, false)
    ),
    with: { program: true, user: true },
  });
  for (const sub of ending) {
    const daysLeft = Math.max(1, Math.ceil((sub.trialEndsAt - now) / (1000 * 60 * 60 * 24)));
    const tpl = templates.trialEnding(sub.program.name, daysLeft);
    if (sub.user?.email) await sendMail({ to: sub.user.email, ...tpl });
    await db.insert(notifications).values({
      userId: sub.userId,
      type: 'trial_ending',
      title: tpl.subject,
      body: `Your ${sub.program.name} trial ends in ${daysLeft} day(s).`,
      link: '/dashboard/programs',
    });
    await db.update(subscriptions).set({ trialEndingNotified: true }).where(eq(subscriptions.id, sub.id));
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
