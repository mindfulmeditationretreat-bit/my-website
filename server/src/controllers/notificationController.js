const { eq, and, isNull } = require('drizzle-orm');
const { db } = require('../lib/db');
const { notifications } = require('../db/schema');

async function listMine(req, res, next) {
  try {
    const rows = await db.query.notifications.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit: 50,
    });
    const unread = rows.filter((n) => !n.readAt).length;
    res.json({ notifications: rows, unread });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    const id = Number(req.params.id);
    const n = await db.query.notifications.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    if (!n || n.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
    res.json({ message: 'Marked read' });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, req.user.id), isNull(notifications.readAt)));
    res.json({ message: 'All marked read' });
  } catch (err) { next(err); }
}

module.exports = { listMine, markRead, markAllRead };
