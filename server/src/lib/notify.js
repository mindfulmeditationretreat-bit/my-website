const { db } = require('./db');
const { users, notifications } = require('../db/schema');
const { eq } = require('drizzle-orm');
const { sendMail, templates } = require('./mailer');

async function notify(userId, { type, title, body, link, email }) {
  const [{ id }] = await db.insert(notifications).values({
    userId, type, title, body: body || null, link: link || null,
  }).$returningId();
  const notification = await db.query.notifications.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (email) {
    const user = await db.query.users.findFirst({ where: (t, { eq: e }) => e(t.id, userId) });
    if (user?.email) {
      const tpl = templates.notification(title, body || '');
      await sendMail({ to: user.email, ...tpl });
    }
  }
  return notification;
}

module.exports = { notify };
