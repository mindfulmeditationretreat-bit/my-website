const { prisma } = require('./prisma');
const { sendMail, templates } = require('./mailer');

async function notify(userId, { type, title, body, link, email }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });
  if (email) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      const tpl = templates.notification(title, body || '');
      await sendMail({ to: user.email, ...tpl });
    }
  }
  return notification;
}

module.exports = { notify };
