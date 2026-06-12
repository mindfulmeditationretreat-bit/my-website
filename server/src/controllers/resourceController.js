const { eq, and, inArray } = require('drizzle-orm');
const { db } = require('../lib/db');
const { resources, subscriptions, programs } = require('../db/schema');
const { deleteFile } = require('../middleware/upload');
const { userHasActiveAccess } = require('./subscriptionController');
const { notify } = require('../lib/notify');

const TYPES = new Set(['pdf', 'video', 'audio', 'image', 'article']);
const CATEGORIES = new Set(['diet', 'meditation', 'counseling', 'general']);

async function listResources(req, res, next) {
  try {
    const { category, type, premium, programId } = req.query;
    const rows = await db.query.resources.findMany({
      where: (t, { eq, and }) => {
        const conds = [];
        if (category && CATEGORIES.has(category)) conds.push(eq(t.category, category));
        if (type && TYPES.has(type)) conds.push(eq(t.type, type));
        if (premium === 'true') conds.push(eq(t.isPremium, true));
        if (premium === 'false') conds.push(eq(t.isPremium, false));
        if (programId) conds.push(eq(t.programId, Number(programId)));
        return conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
      columns: { id: true, title: true, description: true, type: true, category: true, isPremium: true, programId: true, createdAt: true },
    });
    const progIds = [...new Set(rows.map(r => r.programId).filter(Boolean))];
    const progsData = progIds.length
      ? await db.query.programs.findMany({ where: (t, { inArray }) => inArray(t.id, progIds), columns: { id: true, name: true } })
      : [];
    const progMap = Object.fromEntries(progsData.map(p => [p.id, p]));
    res.json(rows.map(r => ({ ...r, program: r.programId ? progMap[r.programId] || null : null })));
  } catch (err) { next(err); }
}

async function getResource(req, res, next) {
  try {
    const id = Number(req.params.id);
    const resource = await db.query.resources.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    if (!resource) return res.status(404).json({ message: 'Not found' });
    const prog = resource.programId
      ? await db.query.programs.findFirst({ where: (t, { eq }) => eq(t.id, resource.programId), columns: { id: true, name: true } })
      : null;
    Object.assign(resource, { program: prog });

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

    let url = externalUrl || null;
    if (req.file) url = req.file.path || `/uploads/${req.file.filename}`;

    const [{ id }] = await db.insert(resources).values({
      title,
      description: description || null,
      type,
      category,
      body: body || null,
      url,
      isPremium: isPremium === 'true' || isPremium === true,
      uploadedBy: req.user.id,
      programId: programId ? Number(programId) : null,
    }).$returningId();
    const resource = await db.query.resources.findFirst({ where: (t, { eq }) => eq(t.id, id) });

    // Notify subscribers (fire-and-forget)
    const programCategory = category === 'general' ? null : category;
    (async () => {
      try {
        const activeSubs = await db.query.subscriptions.findMany({
          where: (t, { inArray }) => inArray(t.status, ['trialing', 'active']),
          columns: { userId: true, programId: true },
        });
        let notifyIds;
        if (programCategory) {
          const subProgIds = [...new Set(activeSubs.map(s => s.programId))];
          const subProgs = subProgIds.length
            ? await db.query.programs.findMany({ where: (t, { inArray }) => inArray(t.id, subProgIds), columns: { id: true, category: true } })
            : [];
          const matchingProgIds = new Set(subProgs.filter(p => p.category === programCategory).map(p => p.id));
          notifyIds = [...new Set(activeSubs.filter(s => matchingProgIds.has(s.programId)).map(s => s.userId))];
        } else {
          notifyIds = [...new Set(activeSubs.map(s => s.userId))];
        }
        notifyIds.forEach(userId => notify(userId, {
          type: 'new_resource',
          title: `New resource: ${title}`,
          body: description || `A new ${type} has been added to the ${category} library.`,
          link: `/dashboard/resources/${resource.id}`,
        }).catch(() => {}));
      } catch { /* ignore notification errors */ }
    })();

    res.status(201).json(resource);
  } catch (err) { next(err); }
}

async function deleteResource(req, res, next) {
  try {
    const id = Number(req.params.id);
    const resource = await db.query.resources.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    if (!resource) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && resource.uploadedBy !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await deleteFile(resource.url);
    await db.delete(resources).where(eq(resources.id, id));
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listResources, getResource, createResource, deleteResource };
