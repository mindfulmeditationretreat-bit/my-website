const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { sendMail, templates } = require('../lib/mailer');
const { notify } = require('../lib/notify');

async function stats(_req, res, next) {
  try {
    const [totalUsers, activeSubs, trialSubs, revenueAgg, instructorCount] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'trialing' } }),
      prisma.subscription.findMany({
        where: { status: 'active' },
        include: { program: { select: { priceCents: true } } },
      }),
      prisma.user.count({ where: { role: 'instructor' } }),
    ]);
    const revenueCents = revenueAgg.reduce((acc, s) => acc + (s.program?.priceCents || 0), 0);
    const conversion = (activeSubs + trialSubs) > 0
      ? Math.round((activeSubs / (activeSubs + trialSubs)) * 100)
      : 0;
    res.json({
      totalUsers, activeSubs, trialSubs,
      revenue: revenueCents / 100,
      instructorCount,
      conversionRate: conversion,
    });
  } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const { role, q } = req.query;
    const where = {};
    if (role) where.role = role;
    if (q) where.OR = [
      { email: { contains: q } },
      { fullName: { contains: q } },
    ];
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, role: true, fullName: true,
        active: true, emailVerified: true, onboarded: true, createdAt: true,
      },
    });
    res.json(users);
  } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: { include: { program: true, instructor: { select: { id: true, fullName: true } } } },
      },
    });
    if (!user) return res.status(404).json({ message: 'Not found' });
    delete user.passwordHash;
    res.json(user);
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { email, fullName, role, age, gender, wellnessGoals, travelCountry, expertise, bio, availability } = req.body;
    if (!email || !role) return res.status(400).json({ message: 'email and role required' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const ageNum = age ? Number(age) : null;
    const goals = Array.isArray(wellnessGoals)
      ? wellnessGoals
      : (typeof wellnessGoals === 'string' && wellnessGoals.trim()
          ? (() => { try { return JSON.parse(wellnessGoals); } catch { return null; } })()
          : null);

    const userOnboarded = role !== 'user'
      || !!(fullName && ageNum && gender && Array.isArray(goals) && goals.length > 0);

    const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const user = await prisma.user.create({
      data: {
        email, fullName: fullName || null, role,
        passwordHash,
        age: ageNum,
        gender: gender || null,
        wellnessGoals: goals,
        travelCountry: travelCountry || null,
        expertise: expertise || null,
        bio: bio || null,
        availability: availability || null,
        onboarded: userOnboarded,
        emailVerified: true,
      },
    });
    let emailSent = false;
    let emailError = null;
    try {
      const result = await sendMail({ to: email, ...templates.accountCreated(email, tempPassword) });
      emailSent = !result?.dev;
    } catch (e) {
      console.error('[admin createUser] email failed', e.message);
      emailError = e.message;
    }
    res.status(201).json({ id: user.id, email: user.email, role: user.role, tempPassword, emailSent, emailError });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { fullName, role, active, travelCountry, expertise, bio, availability } = req.body;
    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = !!active;
    if (travelCountry !== undefined) data.travelCountry = travelCountry || null;
    if (expertise !== undefined) data.expertise = expertise;
    if (bio !== undefined) data.bio = bio;
    if (availability !== undefined) data.availability = availability;
    await prisma.user.update({ where: { id }, data });
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function assignInstructor(req, res, next) {
  try {
    const subId = Number(req.params.id);
    const { instructorId } = req.body;
    const sub = await prisma.subscription.findUnique({ where: { id: subId } });
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    if (instructorId) {
      const instr = await prisma.user.findFirst({ where: { id: Number(instructorId), role: 'instructor' } });
      if (!instr) return res.status(400).json({ message: 'Instructor not found' });
    }
    await prisma.subscription.update({
      where: { id: subId },
      data: { instructorId: instructorId ? Number(instructorId) : null },
    });
    if (instructorId) {
      await notify(sub.userId, {
        type: 'instructor_assigned',
        title: 'An instructor has been assigned',
        body: 'You can now message your instructor from the messages page.',
        link: '/dashboard/messages',
      });
    }
    res.json({ message: 'Assigned' });
  } catch (err) { next(err); }
}

async function listSubscriptions(_req, res, next) {
  try {
    const subs = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        program: { select: { id: true, name: true, slug: true, priceCents: true } },
        instructor: { select: { id: true, fullName: true } },
      },
    });
    res.json(subs);
  } catch (err) { next(err); }
}

async function listPrograms(_req, res, next) {
  try {
    const programs = await prisma.program.findMany({ orderBy: { id: 'asc' } });
    res.json(programs);
  } catch (err) { next(err); }
}

async function updateProgram(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, description, features, priceCents, currency, trialDays, active, category } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (features !== undefined) data.features = features;
    if (priceCents !== undefined) data.priceCents = Number(priceCents);
    if (currency !== undefined) data.currency = currency;
    if (trialDays !== undefined) data.trialDays = Number(trialDays);
    if (active !== undefined) data.active = !!active;
    if (category !== undefined) data.category = category;
    await prisma.program.update({ where: { id }, data });
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
}

async function assignProgram(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { programId, instructorId } = req.body;
    if (!programId) return res.status(400).json({ message: 'programId required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const program = await prisma.program.findUnique({ where: { id: Number(programId) } });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const existing = await prisma.subscription.findFirst({
      where: { userId, programId: Number(programId) },
    });
    if (existing) return res.status(409).json({ message: 'User already enrolled in this program' });

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + program.trialDays * 24 * 60 * 60 * 1000);
    const sub = await prisma.subscription.create({
      data: {
        userId,
        programId: Number(programId),
        instructorId: instructorId ? Number(instructorId) : null,
        status: 'trialing',
        trialStartedAt: now,
        trialEndsAt,
        currentPeriodEnd: trialEndsAt,
      },
    });
    await notify(userId, {
      type: 'subscription_started',
      title: `Enrolled in ${program.name}`,
      body: `An admin has enrolled you in ${program.name}. Your trial runs until ${trialEndsAt.toLocaleDateString()}.`,
      link: '/dashboard/programs',
    });
    res.status(201).json(sub);
  } catch (err) { next(err); }
}

async function broadcast(req, res, next) {
  try {
    const { audience, title, body, email } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'title and body required' });
    const where = {};
    if (audience === 'users') where.role = 'user';
    if (audience === 'instructors') where.role = 'instructor';
    if (audience === 'trial') {
      where.subscriptions = { some: { status: 'trialing' } };
    }
    const recipients = await prisma.user.findMany({ where, select: { id: true, email: true } });
    for (const r of recipients) {
      await prisma.notification.create({
        data: { userId: r.id, type: 'broadcast', title, body },
      });
      if (email) {
        try { await sendMail({ to: r.email, subject: title, title, html: `<p>${body}</p>` }); }
        catch (e) { console.error('[broadcast] email failed', e.message); }
      }
    }
    res.json({ message: `Broadcast sent to ${recipients.length} user(s)` });
  } catch (err) { next(err); }
}

module.exports = {
  stats,
  listUsers, getUser, createUser, updateUser, deleteUser,
  assignInstructor, assignProgram,
  listSubscriptions,
  listPrograms, updateProgram,
  broadcast,
};
