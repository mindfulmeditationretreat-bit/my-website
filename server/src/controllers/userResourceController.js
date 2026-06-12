const { eq, and, inArray, desc } = require('drizzle-orm');
const { db } = require('../lib/db');
const { userResources, resources, users } = require('../db/schema');
const { notify } = require('../lib/notify');

async function assignResource(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { resourceId, note } = req.body;
    if (!resourceId) return res.status(400).json({ message: 'resourceId required' });

    const [user, resource] = await Promise.all([
      db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, userId) }),
      db.query.resources.findFirst({ where: (t, { eq }) => eq(t.id, Number(resourceId)) }),
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const existing = await db.query.userResources.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.resourceId, Number(resourceId))),
    });
    if (existing) return res.status(409).json({ message: 'Already assigned' });

    const [{ id }] = await db.insert(userResources).values({
      userId,
      resourceId: Number(resourceId),
      assignedById: req.user.id,
      note: note || null,
    }).$returningId();
    const assignment = await db.query.userResources.findFirst({ where: (t, { eq }) => eq(t.id, id) });

    await notify(userId, {
      type: 'resource_assigned',
      title: `New resource assigned: ${resource.title}`,
      body: note || `Your instructor has assigned you a new ${resource.type} resource.`,
      link: `/dashboard/resources/${resource.id}`,
    });

    res.status(201).json(assignment);
  } catch (err) { next(err); }
}

async function unassignResource(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const resourceId = Number(req.params.resourceId);
    await db.delete(userResources).where(and(eq(userResources.userId, userId), eq(userResources.resourceId, resourceId)));
    res.status(204).send();
  } catch (err) { next(err); }
}

async function listUserResources(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const assignments = await db.query.userResources.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
    const resourceIds = [...new Set(assignments.map(a => a.resourceId))];
    const assignedByIds = [...new Set(assignments.map(a => a.assignedById).filter(Boolean))];
    const [resourcesData, assignedByData] = await Promise.all([
      resourceIds.length ? db.query.resources.findMany({ where: (t, { inArray }) => inArray(t.id, resourceIds), columns: { id: true, title: true, description: true, type: true, category: true, isPremium: true } }) : [],
      assignedByIds.length ? db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, assignedByIds), columns: { id: true, fullName: true } }) : [],
    ]);
    const resourceMap = Object.fromEntries(resourcesData.map(r => [r.id, r]));
    const assignedByMap = Object.fromEntries(assignedByData.map(u => [u.id, u]));
    res.json(assignments.map(a => ({
      ...a,
      resource: resourceMap[a.resourceId] || null,
      assignedBy: a.assignedById ? assignedByMap[a.assignedById] || null : null,
    })));
  } catch (err) { next(err); }
}

async function myAssignedResources(req, res, next) {
  try {
    const assignments = await db.query.userResources.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
    const resourceIds = [...new Set(assignments.map(a => a.resourceId))];
    const assignedByIds = [...new Set(assignments.map(a => a.assignedById).filter(Boolean))];
    const [resourcesData, assignedByData] = await Promise.all([
      resourceIds.length ? db.query.resources.findMany({ where: (t, { inArray }) => inArray(t.id, resourceIds), columns: { id: true, title: true, description: true, type: true, category: true, isPremium: true, url: true } }) : [],
      assignedByIds.length ? db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, assignedByIds), columns: { id: true, fullName: true } }) : [],
    ]);
    const resourceMap = Object.fromEntries(resourcesData.map(r => [r.id, r]));
    const assignedByMap = Object.fromEntries(assignedByData.map(u => [u.id, u]));
    res.json(assignments.map(a => ({
      ...a,
      resource: resourceMap[a.resourceId] || null,
      assignedBy: a.assignedById ? assignedByMap[a.assignedById] || null : null,
    })));
  } catch (err) { next(err); }
}

module.exports = { assignResource, unassignResource, listUserResources, myAssignedResources };
