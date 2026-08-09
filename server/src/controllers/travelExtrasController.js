const { eq, and, desc, asc, gte, lte, sql } = require('drizzle-orm');
const { db } = require('../lib/db');
const {
  destinations, retreats, retreatSaves, retreatWaitlist,
  journalEntries, events, courses, courseEnrollments,
} = require('../db/schema');

async function listDestinations(_req, res, next) {
  try {
    const rows = await db.query.destinations.findMany({
      where: (t, { eq }) => eq(t.active, true),
      orderBy: (t, { asc }) => asc(t.country),
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function listRetreats(req, res, next) {
  try {
    const {
      country, category, maxBudget, minDuration, maxDuration,
      intensity, english, women, privateRoom, monastery, q,
    } = req.query;

    let rows = await db.query.retreats.findMany({
      where: (t, { eq }) => eq(t.active, true),
      orderBy: (t, { asc }) => asc(t.title),
    });

    if (country) rows = rows.filter((r) => r.country.toLowerCase() === String(country).toLowerCase());
    if (category) rows = rows.filter((r) => r.category === category);
    if (monastery === '1' || monastery === 'true') rows = rows.filter((r) => r.isMonastery);
    if (intensity) rows = rows.filter((r) => r.meditationIntensity === intensity);
    if (english === '1' || english === 'true') rows = rows.filter((r) => r.englishSpoken);
    if (women === '1' || women === 'true') rows = rows.filter((r) => r.womenAllowed);
    if (privateRoom === '1' || privateRoom === 'true') rows = rows.filter((r) => r.privateRoom);
    if (maxBudget) rows = rows.filter((r) => r.priceCents <= Number(maxBudget) * 100);
    if (minDuration) rows = rows.filter((r) => r.durationDays >= Number(minDuration));
    if (maxDuration) rows = rows.filter((r) => r.durationDays <= Number(maxDuration));
    if (q) {
      const qq = String(q).toLowerCase();
      rows = rows.filter((r) => `${r.title} ${r.description || ''} ${r.country}`.toLowerCase().includes(qq));
    }

    let saved = new Set();
    let waitlisted = new Set();
    if (req.user?.id) {
      const [saves, waits] = await Promise.all([
        db.query.retreatSaves.findMany({ where: (t, { eq }) => eq(t.userId, req.user.id) }),
        db.query.retreatWaitlist.findMany({ where: (t, { eq }) => eq(t.userId, req.user.id) }),
      ]);
      saved = new Set(saves.map((s) => s.retreatId));
      waitlisted = new Set(waits.map((w) => w.retreatId));
    }

    res.json(rows.map((r) => ({
      ...r,
      saved: saved.has(r.id),
      waitlisted: waitlisted.has(r.id),
      priceDisplay: `${r.currency} ${(r.priceCents / 100).toFixed(0)}`,
    })));
  } catch (err) { next(err); }
}

async function getRetreat(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = await db.query.retreats.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    if (!row || !row.active) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function toggleSaveRetreat(req, res, next) {
  try {
    const retreatId = Number(req.params.id);
    const existing = await db.query.retreatSaves.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, req.user.id), eq(t.retreatId, retreatId)),
    });
    if (existing) {
      await db.delete(retreatSaves).where(eq(retreatSaves.id, existing.id));
      return res.json({ saved: false });
    }
    await db.insert(retreatSaves).values({ userId: req.user.id, retreatId });
    res.json({ saved: true });
  } catch (err) { next(err); }
}

async function joinWaitlist(req, res, next) {
  try {
    const retreatId = Number(req.params.id);
    const existing = await db.query.retreatWaitlist.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, req.user.id), eq(t.retreatId, retreatId)),
    });
    if (existing) return res.json({ waitlisted: true });
    await db.insert(retreatWaitlist).values({
      userId: req.user.id,
      retreatId,
      note: req.body?.note || null,
    });
    res.status(201).json({ waitlisted: true });
  } catch (err) { next(err); }
}

async function listJournal(req, res, next) {
  try {
    const rows = await db.query.journalEntries.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.recordedAt),
      limit: 90,
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function createJournal(req, res, next) {
  try {
    const { mood, gratitude, meditationNote, energy, body } = req.body;
    const [{ id }] = await db.insert(journalEntries).values({
      userId: req.user.id,
      mood: mood != null ? Number(mood) : null,
      gratitude: gratitude || null,
      meditationNote: meditationNote || null,
      energy: energy != null ? Number(energy) : null,
      body: body || null,
    }).$returningId();
    res.status(201).json(await db.query.journalEntries.findFirst({ where: (t, { eq }) => eq(t.id, id) }));
  } catch (err) { next(err); }
}

async function journalReport(req, res, next) {
  try {
    const rows = await db.query.journalEntries.findMany({
      where: (t, { eq }) => eq(t.userId, req.user.id),
      orderBy: (t, { desc }) => desc(t.recordedAt),
      limit: 60,
    });
    const moods = rows.map((r) => r.mood).filter((m) => m != null);
    const energies = rows.map((r) => r.energy).filter((m) => m != null);
    const avg = (arr) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
    res.json({
      entries: rows.length,
      avgMood: avg(moods),
      avgEnergy: avg(energies),
      gratitudeCount: rows.filter((r) => r.gratitude).length,
      recent: rows.slice(0, 7),
    });
  } catch (err) { next(err); }
}

async function listEvents(_req, res, next) {
  try {
    const now = new Date(Date.now() - 86400000);
    const rows = await db.query.events.findMany({
      where: (t, { eq }) => eq(t.active, true),
      orderBy: (t, { asc }) => asc(t.startsAt),
      limit: 80,
    });
    res.json(rows.filter((e) => new Date(e.startsAt) >= now));
  } catch (err) { next(err); }
}

async function listCourses(req, res, next) {
  try {
    const rows = await db.query.courses.findMany({
      where: (t, { eq }) => eq(t.active, true),
      orderBy: (t, { asc }) => asc(t.title),
    });
    let enrolled = new Set();
    if (req.user?.id) {
      const ens = await db.query.courseEnrollments.findMany({
        where: (t, { eq }) => eq(t.userId, req.user.id),
      });
      enrolled = new Set(ens.map((e) => e.courseId));
    }
    res.json(rows.map((c) => ({
      ...c,
      enrolled: enrolled.has(c.id),
      priceDisplay: c.priceCents === 0 ? 'Free' : `${c.currency} ${(c.priceCents / 100).toFixed(0)}`,
    })));
  } catch (err) { next(err); }
}

async function enrollCourse(req, res, next) {
  try {
    const courseId = Number(req.params.id);
    const course = await db.query.courses.findFirst({ where: (t, { eq }) => eq(t.id, courseId) });
    if (!course || !course.active) return res.status(404).json({ message: 'Not found' });
    const existing = await db.query.courseEnrollments.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, req.user.id), eq(t.courseId, courseId)),
    });
    if (existing) return res.json({ enrolled: true, enrollment: existing });
    // Free or trial-enroll without payment gateway (payment stub still separate)
    const [{ id }] = await db.insert(courseEnrollments).values({
      userId: req.user.id,
      courseId,
    }).$returningId();
    const enrollment = await db.query.courseEnrollments.findFirst({ where: (t, { eq }) => eq(t.id, id) });
    res.status(201).json({ enrolled: true, enrollment });
  } catch (err) { next(err); }
}

async function adminUpsertDestination(req, res, next) {
  try {
    const { id, country, name, slug, summary, imageUrl, active } = req.body;
    if (!country || !name || !slug) return res.status(400).json({ message: 'country, name, slug required' });
    if (id) {
      await db.update(destinations).set({
        country, name, slug, summary: summary || null, imageUrl: imageUrl || null, active: active !== false,
      }).where(eq(destinations.id, Number(id)));
      return res.json(await db.query.destinations.findFirst({ where: (t, { eq }) => eq(t.id, Number(id)) }));
    }
    const [{ id: newId }] = await db.insert(destinations).values({
      country, name, slug, summary: summary || null, imageUrl: imageUrl || null,
    }).$returningId();
    res.status(201).json(await db.query.destinations.findFirst({ where: (t, { eq }) => eq(t.id, newId) }));
  } catch (err) { next(err); }
}

async function adminUpsertRetreat(req, res, next) {
  try {
    const b = req.body;
    if (!b.title || !b.slug || !b.category || !b.country) {
      return res.status(400).json({ message: 'title, slug, category, country required' });
    }
    const data = {
      title: b.title,
      slug: b.slug,
      category: b.category,
      country: b.country,
      destinationId: b.destinationId ? Number(b.destinationId) : null,
      description: b.description || null,
      durationDays: Number(b.durationDays) || 7,
      priceCents: Number(b.priceCents) || 0,
      currency: b.currency || 'USD',
      meditationIntensity: ['gentle', 'moderate', 'intense'].includes(b.meditationIntensity) ? b.meditationIntensity : 'moderate',
      englishSpoken: b.englishSpoken !== false,
      womenAllowed: b.womenAllowed !== false,
      privateRoom: !!b.privateRoom,
      imageUrl: b.imageUrl || null,
      isMonastery: !!b.isMonastery,
      active: b.active !== false,
    };
    if (b.id) {
      await db.update(retreats).set(data).where(eq(retreats.id, Number(b.id)));
      return res.json(await db.query.retreats.findFirst({ where: (t, { eq }) => eq(t.id, Number(b.id)) }));
    }
    const [{ id }] = await db.insert(retreats).values(data).$returningId();
    res.status(201).json(await db.query.retreats.findFirst({ where: (t, { eq }) => eq(t.id, id) }));
  } catch (err) { next(err); }
}

async function adminUpsertEvent(req, res, next) {
  try {
    const { id, title, type, description, startsAt, endsAt, mode, location, linkUrl, active } = req.body;
    if (!title || !type || !startsAt) return res.status(400).json({ message: 'title, type, startsAt required' });
    const data = {
      title, type,
      description: description || null,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      mode: ['online', 'in_person', 'hybrid'].includes(mode) ? mode : 'online',
      location: location || null,
      linkUrl: linkUrl || null,
      active: active !== false,
    };
    if (id) {
      await db.update(events).set(data).where(eq(events.id, Number(id)));
      return res.json(await db.query.events.findFirst({ where: (t, { eq }) => eq(t.id, Number(id)) }));
    }
    const [{ id: newId }] = await db.insert(events).values(data).$returningId();
    res.status(201).json(await db.query.events.findFirst({ where: (t, { eq }) => eq(t.id, newId) }));
  } catch (err) { next(err); }
}

async function adminUpsertCourse(req, res, next) {
  try {
    const { id, title, slug, description, priceCents, currency, lessons, isPremium, active } = req.body;
    if (!title || !slug) return res.status(400).json({ message: 'title and slug required' });
    const data = {
      title, slug,
      description: description || null,
      priceCents: Number(priceCents) || 0,
      currency: currency || 'NPR',
      lessons: Array.isArray(lessons) ? lessons : (lessons || null),
      isPremium: isPremium !== false,
      active: active !== false,
    };
    if (id) {
      await db.update(courses).set(data).where(eq(courses.id, Number(id)));
      return res.json(await db.query.courses.findFirst({ where: (t, { eq }) => eq(t.id, Number(id)) }));
    }
    const [{ id: newId }] = await db.insert(courses).values(data).$returningId();
    res.status(201).json(await db.query.courses.findFirst({ where: (t, { eq }) => eq(t.id, newId) }));
  } catch (err) { next(err); }
}

module.exports = {
  listDestinations, listRetreats, getRetreat, toggleSaveRetreat, joinWaitlist,
  listJournal, createJournal, journalReport,
  listEvents, listCourses, enrollCourse,
  adminUpsertDestination, adminUpsertRetreat, adminUpsertEvent, adminUpsertCourse,
};
