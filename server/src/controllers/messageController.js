const { eq, and, or, isNull, count } = require('drizzle-orm');
const { db } = require('../lib/prisma');
const { messages, subscriptions } = require('../db/schema');
const { notify } = require('../lib/notify');
const { getIO } = require('../lib/socket');

async function listConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const allMessages = await db.query.messages.findMany({
      where: (t, { eq, or }) => or(eq(t.senderId, userId), eq(t.recipientId, userId)),
      orderBy: (t, { desc }) => desc(t.createdAt),
      with: {
        sender:    { columns: { id: true, fullName: true, photoUrl: true } },
        recipient: { columns: { id: true, fullName: true, photoUrl: true } },
      },
    });

    const map = new Map();
    for (const m of allMessages) {
      const other = m.senderId === userId ? m.recipient : m.sender;
      if (!map.has(other.id)) {
        const [{ value: unread }] = await db.select({ value: count() }).from(messages)
          .where(and(eq(messages.senderId, other.id), eq(messages.recipientId, userId), isNull(messages.readAt)));
        map.set(other.id, { peer: other, lastMessage: m, unread: Number(unread) });
      }
    }
    res.json(Array.from(map.values()));
  } catch (err) { next(err); }
}

async function listMessages(req, res, next) {
  try {
    const peerId = Number(req.params.peerId);
    const userId = req.user.id;
    const msgs = await db.query.messages.findMany({
      where: (t, { eq, or, and }) => or(
        and(eq(t.senderId, userId), eq(t.recipientId, peerId)),
        and(eq(t.senderId, peerId), eq(t.recipientId, userId)),
      ),
      orderBy: (t, { asc }) => asc(t.createdAt),
    });
    await db.update(messages)
      .set({ readAt: new Date() })
      .where(and(eq(messages.senderId, peerId), eq(messages.recipientId, userId), isNull(messages.readAt)));
    res.json(msgs);
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { recipientId, body, subscriptionId } = req.body;
    const fileUrl  = req.file ? (req.file.path || `/uploads/${req.file.filename}`) : (req.body.fileUrl || null);
    const fileName = req.file ? req.file.originalname : (req.body.fileName || null);

    if (!recipientId) return res.status(400).json({ message: 'recipientId required' });
    if (!body && !fileUrl) return res.status(400).json({ message: 'body or file required' });

    const recipient = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, Number(recipientId)) });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const linked = await db.query.subscriptions.findFirst({
        where: (t, { eq, or, and }) => or(
          and(eq(t.userId, req.user.id), eq(t.instructorId, recipient.id)),
          and(eq(t.userId, recipient.id), eq(t.instructorId, req.user.id)),
        ),
      });
      if (!linked) return res.status(403).json({ message: 'No conversation context with this user' });
    }

    const [{ id }] = await db.insert(messages).values({
      senderId: req.user.id,
      recipientId: recipient.id,
      subscriptionId: subscriptionId ? Number(subscriptionId) : null,
      body: body || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    }).$returningId();
    const message = await db.query.messages.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: { sender: { columns: { id: true, fullName: true, photoUrl: true } } },
    });

    const io = getIO();
    if (io) io.to(`user:${recipient.id}`).emit('new_message', message);

    await notify(recipient.id, {
      type: 'new_message',
      title: 'New message',
      body: body ? body.slice(0, 120) : `📎 ${fileName || 'File attachment'}`,
      link: `/dashboard/messages/${req.user.id}`,
    });

    res.status(201).json(message);
  } catch (err) { next(err); }
}

module.exports = { listConversations, listMessages, sendMessage };
