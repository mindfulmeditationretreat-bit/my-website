const { prisma } = require('../lib/prisma');
const { notify } = require('../lib/notify');

// Admin: assign a resource to a user
async function assignResource(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { resourceId, note } = req.body;
    if (!resourceId) return res.status(400).json({ message: 'resourceId required' });

    const [user, resource] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.resource.findUnique({ where: { id: Number(resourceId) } }),
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const existing = await prisma.userResource.findUnique({
      where: { userId_resourceId: { userId, resourceId: Number(resourceId) } },
    });
    if (existing) return res.status(409).json({ message: 'Already assigned' });

    const assignment = await prisma.userResource.create({
      data: {
        userId,
        resourceId: Number(resourceId),
        assignedById: req.user.id,
        note: note || null,
      },
      include: { resource: true },
    });

    await notify(userId, {
      type: 'resource_assigned',
      title: `New resource assigned: ${resource.title}`,
      body: note || `Your instructor has assigned you a new ${resource.type} resource.`,
      link: `/dashboard/resources/${resource.id}`,
    });

    res.status(201).json(assignment);
  } catch (err) { next(err); }
}

// Admin: remove a resource assignment from a user
async function unassignResource(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const resourceId = Number(req.params.resourceId);
    await prisma.userResource.deleteMany({ where: { userId, resourceId } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// Admin: list resources assigned to a specific user
async function listUserResources(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const assignments = await prisma.userResource.findMany({
      where: { userId },
      include: {
        resource: {
          select: { id: true, title: true, description: true, type: true, category: true, isPremium: true },
        },
        assignedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) { next(err); }
}

// User: get their own assigned resources
async function myAssignedResources(req, res, next) {
  try {
    const assignments = await prisma.userResource.findMany({
      where: { userId: req.user.id },
      include: {
        resource: {
          select: { id: true, title: true, description: true, type: true, category: true, isPremium: true, url: true },
        },
        assignedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) { next(err); }
}

module.exports = { assignResource, unassignResource, listUserResources, myAssignedResources };
