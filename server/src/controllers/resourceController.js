const { prisma } = require('../lib/prisma');
const { deleteFile } = require('../middleware/upload');
const { userHasActiveAccess } = require('./subscriptionController');
const { notify } = require('../lib/notify');

const TYPES = new Set(['pdf', 'video', 'audio', 'image', 'article']);
const CATEGORIES = new Set(['diet', 'meditation', 'counseling', 'general']);

async function listResources(req, res, next) {
  try {
    const { category, type, premium, programId } = req.query;
    const where = {};
    if (category && CATEGORIES.has(category)) where.category = category;
    if (type && TYPES.has(type)) where.type = type;
    if (premium === 'true') where.isPremium = true;
    if (premium === 'false') where.isPremium = false;
    if (programId) where.programId = Number(programId);

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, description: true, type: true, category: true,
        isPremium: true, programId: true, createdAt: true,
        program: { select: { id: true, name: true } },
      },
    });
    res.json(resources);
  } catch (err) { next(err); }
}

async function getResource(req, res, next) {
  try {
    const id = Number(req.params.id);
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { program: { select: { id: true, name: true } } },
    });
    if (!resource) return res.status(404).json({ message: 'Not found' });

    if (resource.isPremium) {
      if (!req.user) return res.status(401).json({ message: 'Sign in to access premium content' });
      if (req.user.role === 'user') {
        const ok = await userHasActiveAccess(req.user.id);
        if (!ok) return res.status(402).json({ message: 'Premium content — active subscription required' });
      }
    }
    res.json(resource);
  } catch (err) { next(err); }
}

async function createResource(req, res, next) {
  try {
    const { title, description, type, category, body, isPremium, externalUrl, programId } = req.body;
    if (!title || !type || !category) return res.status(400).json({ message: 'title, type, category required' });
    if (!TYPES.has(type)) return res.status(400).json({ message: 'invalid type' });
    if (!CATEGORIES.has(category)) return res.status(400).json({ message: 'invalid category' });

    // Cloudinary gives back req.file.path (full https URL); local disk gives filename
    let url = externalUrl || null;
    if (req.file) {
      url = req.file.path || `/uploads/${req.file.filename}`;
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description: description || null,
        type,
        category,
        body: body || null,
        url,
        isPremium: isPremium === 'true' || isPremium === true,
        uploadedBy: req.user.id,
        programId: programId ? Number(programId) : null,
      },
    });

    // Notify subscribers in this category (fire-and-forget)
    const programCategory = category === 'general' ? null : category;
    const whereProgram = programCategory ? { category: programCategory } : {};
    prisma.subscription.findMany({
      where: { status: { in: ['trialing', 'active'] }, program: whereProgram },
      select: { userId: true },
    }).then((subs) => {
      const ids = [...new Set(subs.map((s) => s.userId))];
      ids.forEach((userId) => {
        notify(userId, {
          type: 'new_resource',
          title: `New resource: ${title}`,
          body: description || `A new ${type} has been added to the ${category} library.`,
          link: `/dashboard/resources/${resource.id}`,
        }).catch(() => {});
      });
    }).catch(() => {});

    res.status(201).json(resource);
  } catch (err) { next(err); }
}

async function deleteResource(req, res, next) {
  try {
    const id = Number(req.params.id);
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && resource.uploadedBy !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await deleteFile(resource.url);
    await prisma.resource.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listResources, getResource, createResource, deleteResource };
