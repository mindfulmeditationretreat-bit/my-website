const { prisma } = require('../lib/prisma');
const { notify } = require('../lib/notify');
const { getIO } = require('../lib/socket');
const { upload, deleteFile } = require('../middleware/upload');

async function listConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender:    { select: { id: true, fullName: true, photoUrl: true } },
        recipient: { select: { id: true, fullName: true, photoUrl: true } },
      },
    });
    const map = new Map();
    for (const m of messages) {
      const other = m.senderId === userId ? m.recipient : m.sender;
      if (!map.has(other.id)) {
        const unread = await prisma.message.count({
          where: { senderId: other.id, recipientId: userId, readAt: null },
        });
        map.set(other.id, { peer: other, lastMessage: m, unread });
      }
    }
    res.json(Array.from(map.values()));
  } catch (err) { next(err); }
}

async function listMessages(req, res, next) {
  try {
    const peerId = Number(req.params.peerId);
    const userId = req.user.id;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: peerId },
          { senderId: peerId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    await prisma.message.updateMany({
      where: { senderId: peerId, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    res.json(messages);
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { recipientId, body, subscriptionId } = req.body;
    const fileUrl  = req.file ? (req.file.path || `/uploads/${req.file.filename}`) : (req.body.fileUrl || null);
    const fileName = req.file ? req.file.originalname : (req.body.fileName || null);

    if (!recipientId) return res.status(400).json({ message: 'recipientId required' });
    if (!body && !fileUrl) return res.status(400).json({ message: 'body or file required' });

    const recipient = await prisma.user.findUnique({ where: { id: Number(recipientId) } });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const linked = await prisma.subscription.findFirst({
        where: {
          OR: [
            { userId: req.user.id, instructorId: recipient.id },
            { userId: recipient.id, instructorId: req.user.id },
          ],
        },
      });
      if (!linked) return res.status(403).json({ message: 'No conversation context with this user' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        recipientId: recipient.id,
        subscriptionId: subscriptionId ? Number(subscriptionId) : null,
        body: body || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
      include: {
        sender: { select: { id: true, fullName: true, photoUrl: true } },
      },
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
