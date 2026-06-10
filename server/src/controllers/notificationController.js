const { prisma } = require('../lib/prisma');

async function listMine(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = notifications.filter((n) => !n.readAt).length;
    res.json({ notifications, unread });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    const id = Number(req.params.id);
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    res.json({ message: 'Marked read' });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ message: 'All marked read' });
  } catch (err) { next(err); }
}

module.exports = { listMine, markRead, markAllRead };
