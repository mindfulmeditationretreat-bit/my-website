const bcrypt = require('bcryptjs');
const { eq, and, or, like, count, inArray, desc } = require('drizzle-orm');
const { db } = require('../lib/db');
const { users, subscriptions, programs, notifications } = require('../db/schema');
const { sendMail, templates } = require('../lib/mailer');
const { notify } = require('../lib/notify');

async function stats(_req, res, next) {
  try {
    const [[{ totalUsers }], [{ activeSubs }], [{ trialSubs }], [{ instructorCount }]] = await Promise.all([
      db.select({ totalUsers: count() }).from(users).where(eq(users.role, 'user')),
      db.select({ activeSubs: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
      db.select({ trialSubs: count() }).from(subscriptions).where(eq(subscriptions.status, 'trialing')),
      db.select({ instructorCount: count() }).from(users).where(eq(users.role, 'instructor')),
    ]);
    const activeSubsList = await db.query.subscriptions.findMany({
      where: (t, { eq }) => eq(t.status, 'active'),
      columns: { programId: true },
    });
    const revProgIds = [...new Set(activeSubsList.map(s => s.programId))];
    const revProgs = revProgIds.length
      ? await db.query.programs.findMany({ where: (t, { inArray }) => inArray(t.id, revProgIds), columns: { id: true, priceCents: true } })
      : [];
    const priceMap = Object.fromEntries(revProgs.map(p => [p.id, p.priceCents]));
    const revenueCents = activeSubsList.reduce((acc, s) => acc + (priceMap[s.programId] || 0), 0);
    const total = Number(activeSubs) + Number(trialSubs);
    const conversion = total > 0 ? Math.round((Number(activeSubs) / total) * 100) : 0;
    res.json({
      totalUsers: Number(totalUsers),
      activeSubs: Number(activeSubs),
      trialSubs: Number(trialSubs),
      revenue: revenueCents / 100,
      instructorCount: Number(instructorCount),
      conversionRate: conversion,
    });
  } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const { role, q } = req.query;
    const rows = await db.query.users.findMany({
      where: (t, { eq, or, like, and }) => {
        const conditions = [];
        if (role) conditions.push(eq(t.role, role));
        if (q) conditions.push(or(like(t.email, `%${q}%`), like(t.fullName, `%${q}%`)));
        return conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
      columns: {
        id: true, email: true, role: true, fullName: true,
        active: true, emailVerified: true, onboarded: true, createdAt: true,
      },
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [user, subs] = await Promise.all([
      db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, id) }),
      db.query.subscriptions.findMany({ where: (t, { eq }) => eq(t.userId, id) }),
    ]);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const progIds = [...new Set(subs.map(s => s.programId))];
    const instrIds = [...new Set(subs.map(s => s.instructorId).filter(Boolean))];
    const [progsData, instrsData] = await Promise.all([
      progIds.length ? db.query.programs.findMany({ where: (t, { inArray }) => inArray(t.id, progIds) }) : [],
      instrIds.length ? db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, instrIds), columns: { id: true, fullName: true } }) : [],
    ]);
    const progMap = Object.fromEntries(progsData.map(p => [p.id, p]));
    const instrMap = Object.fromEntries(instrsData.map(i => [i.id, i]));
    const subsWithDetails = subs.map(s => ({
      ...s,
      program: progMap[s.programId] || null,
      instructor: s.instructorId ? instrMap[s.instructorId] || null : null,
    }));
    const { passwordHash, ...safeUser } = user;
    res.json({ ...safeUser, subscriptions: subsWithDetails });
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { email, fullName, role, age, gender, wellnessGoals, travelCountry, expertise, bio, availability } = req.body;
    if (!email || !role) return res.status(400).json({ message: 'email and role required' });
    const existing = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.email, email) });
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
    const [{ id }] = await db.insert(users).values({
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
      updatedAt: new Date(),
    }).$returningId();
    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, id) });

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

    const existing = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const data = { updatedAt: new Date() };
    if (fullName !== undefined) data.fullName = fullName;
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = !!active;
    if (travelCountry !== undefined) data.travelCountry = travelCountry || null;
    if (expertise !== undefined) data.expertise = expertise;
    if (bio !== undefined) data.bio = bio;
    if (availability !== undefined) data.availability = availability;
    await db.update(users).set(data).where(eq(users.id, id));

    const beingApproved = active === true && !existing.active && existing.role === 'instructor';
    if (beingApproved) {
      try {
        await sendMail({ to: existing.email, ...templates.welcomeInstructor(existing.fullName) });
      } catch (e) { console.error('[updateUser] welcome provider email failed', e.message); }
    }

    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    await db.delete(users).where(eq(users.id, id));
    res.status(204).send();
  } catch (err) { next(err); }
}

async function assignInstructor(req, res, next) {
  try {
    const subId = Number(req.params.id);
    const { instructorId } = req.body;
    const sub = await db.query.subscriptions.findFirst({ where: (t, { eq }) => eq(t.id, subId) });
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    if (instructorId) {
      const instr = await db.query.users.findFirst({
        where: (t, { eq, and }) => and(eq(t.id, Number(instructorId)), eq(t.role, 'instructor'), eq(t.active, true)),
      });
      if (!instr) return res.status(400).json({ message: 'Instructor not found or not yet approved' });
    }
    await db.update(subscriptions)
      .set({ instructorId: instructorId ? Number(instructorId) : null, updatedAt: new Date() })
      .where(eq(subscriptions.id, subId));
    if (instructorId) {
      await notify(sub.userId, {
        type: 'provider_assigned',
        title: 'A provider has been assigned',
        body: 'You can now message your provider from the messages page.',
        link: '/dashboard/messages',
      });
    }
    res.json({ message: 'Assigned' });
  } catch (err) { next(err); }
}

async function listSubscriptions(_req, res, next) {
  try {
    const subs = await db.query.subscriptions.findMany({ orderBy: (t, { desc }) => desc(t.createdAt) });
    const userIds = [...new Set(subs.map(s => s.userId))];
    const progIds = [...new Set(subs.map(s => s.programId))];
    const instrIds = [...new Set(subs.map(s => s.instructorId).filter(Boolean))];
    const [usersData, progsData, instrsData] = await Promise.all([
      userIds.length ? db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, userIds), columns: { id: true, email: true, fullName: true } }) : [],
      progIds.length ? db.query.programs.findMany({ where: (t, { inArray }) => inArray(t.id, progIds), columns: { id: true, name: true, slug: true, priceCents: true } }) : [],
      instrIds.length ? db.query.users.findMany({ where: (t, { inArray }) => inArray(t.id, instrIds), columns: { id: true, fullName: true } }) : [],
    ]);
    const userMap = Object.fromEntries(usersData.map(u => [u.id, u]));
    const progMap = Object.fromEntries(progsData.map(p => [p.id, p]));
    const instrMap = Object.fromEntries(instrsData.map(i => [i.id, i]));
    res.json(subs.map(s => ({
      ...s,
      user: userMap[s.userId] || null,
      program: progMap[s.programId] || null,
      instructor: s.instructorId ? instrMap[s.instructorId] || null : null,
    })));
  } catch (err) { next(err); }
}

async function listPrograms(_req, res, next) {
  try {
    const rows = await db.query.programs.findMany({ orderBy: (t, { asc }) => asc(t.id) });
    res.json(rows);
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
    await db.update(programs).set(data).where(eq(programs.id, id));
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
}

async function assignProgram(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { programId, instructorId } = req.body;
    if (!programId) return res.status(400).json({ message: 'programId required' });

    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (instructorId) {
      const instr = await db.query.users.findFirst({
        where: (t, { eq, and }) => and(eq(t.id, Number(instructorId)), eq(t.role, 'instructor'), eq(t.active, true)),
      });
      if (!instr) return res.status(400).json({ message: 'Instructor not found or not yet approved' });
    }

    const program = await db.query.programs.findFirst({ where: (t, { eq }) => eq(t.id, Number(programId)) });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const existing = await db.query.subscriptions.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.programId, Number(programId))),
    });
    if (existing) return res.status(409).json({ message: 'User already enrolled in this program' });

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + program.trialDays * 24 * 60 * 60 * 1000);
    const [{ id }] = await db.insert(subscriptions).values({
      userId,
      programId: Number(programId),
      instructorId: instructorId ? Number(instructorId) : null,
      status: 'trialing',
      trialStartedAt: now,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
      updatedAt: now,
    }).$returningId();
    const sub = await db.query.subscriptions.findFirst({ where: (t, { eq }) => eq(t.id, id) });

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

    let recipients;
    if (audience === 'trial') {
      const trialingRows = await db.query.subscriptions.findMany({
        where: (t, { eq }) => eq(t.status, 'trialing'),
        columns: { userId: true },
      });
      const ids = [...new Set(trialingRows.map((r) => r.userId))];
      recipients = ids.length
        ? await db.query.users.findMany({
            where: (t, { inArray }) => inArray(t.id, ids),
            columns: { id: true, email: true },
          })
        : [];
    } else {
      recipients = await db.query.users.findMany({
        where: (t, { eq }) => audience === 'users' ? eq(t.role, 'user') : audience === 'providers' ? eq(t.role, 'instructor') : undefined,
        columns: { id: true, email: true },
      });
    }

    for (const r of recipients) {
      await db.insert(notifications).values({ userId: r.id, type: 'broadcast', title, body });
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
