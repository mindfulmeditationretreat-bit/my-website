const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');
const { db } = require('../lib/db');
const { users } = require('../db/schema');
const { deleteFile } = require('../middleware/upload');

const WELLNESS_GOALS = new Set([
  'weight_loss', 'better_sleep', 'stress_reduction', 'meditation_practice',
  'anxiety_management', 'healthy_lifestyle', 'emotional_wellness', 'fitness_nutrition',
]);

async function me(req, res, next) {
  try {
    const user = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, req.user.id),
      columns: {
        id: true, email: true, role: true, fullName: true,
        age: true, gender: true, wellnessGoals: true, travelCountry: true,
        address: true, phone: true,
        onboarded: true, emailVerified: true, photoUrl: true,
        bio: true, expertise: true, availability: true,
        notificationPrefs: true,
      },
    });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ ...user, wellnessGoals: user.wellnessGoals || [] });
  } catch (err) { next(err); }
}

async function completeOnboarding(req, res, next) {
  try {
    const { fullName, age, gender, travelCountry, wellnessGoals } = req.body;
    if (!fullName || !age || !gender || !Array.isArray(wellnessGoals) || !wellnessGoals.length) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const invalid = wellnessGoals.find((g) => !WELLNESS_GOALS.has(g));
    if (invalid) return res.status(400).json({ message: `Unknown wellness goal: ${invalid}` });

    const current = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, req.user.id),
      columns: { emailVerified: true },
    });
    if (!current?.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email before continuing' });
    }

    await db.update(users)
      .set({ fullName, age: Number(age), gender, travelCountry: travelCountry || null, wellnessGoals, onboarded: true, updatedAt: new Date() })
      .where(eq(users.id, req.user.id));
    res.json({ message: 'Onboarding complete' });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const { fullName, age, gender, wellnessGoals, travelCountry, address, phone, bio, expertise, availability, photoUrl } = req.body;
    const data = { updatedAt: new Date() };
    if (fullName !== undefined) data.fullName = fullName;
    if (age !== undefined) data.age = age ? Number(age) : null;
    if (gender !== undefined) data.gender = gender;
    if (travelCountry !== undefined) data.travelCountry = travelCountry || null;
    if (address !== undefined) data.address = address || null;
    if (phone !== undefined) data.phone = phone || null;
    if (wellnessGoals !== undefined) {
      const goals = typeof wellnessGoals === 'string' ? JSON.parse(wellnessGoals) : wellnessGoals;
      if (!Array.isArray(goals)) return res.status(400).json({ message: 'wellnessGoals must be array' });
      const invalid = goals.find((g) => !WELLNESS_GOALS.has(g));
      if (invalid) return res.status(400).json({ message: `Unknown wellness goal: ${invalid}` });
      data.wellnessGoals = goals;
    }
    if (bio !== undefined) data.bio = bio;
    if (expertise !== undefined) data.expertise = expertise;
    if (availability !== undefined) data.availability = availability;
    if (photoUrl !== undefined) data.photoUrl = photoUrl;
    if (req.file) {
      const existing = await db.query.users.findFirst({
        where: (t, { eq }) => eq(t.id, req.user.id),
        columns: { photoUrl: true },
      });
      if (existing?.photoUrl) deleteFile(existing.photoUrl).catch(() => {});
      data.photoUrl = req.file.path || `/uploads/${req.file.filename}`;
    }
    await db.update(users).set(data).where(eq(users.id, req.user.id));
    const updated = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, req.user.id),
      columns: { photoUrl: true },
    });
    res.json({ message: 'Profile updated', photoUrl: updated.photoUrl });
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, req.user.id) });
    if (user.passwordHash) {
      const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
      if (!ok) return res.status(401).json({ message: 'Current password incorrect' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, req.user.id));
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
}

async function updateNotificationPrefs(req, res, next) {
  try {
    const { prefs } = req.body;
    await db.update(users)
      .set({ notificationPrefs: prefs || {}, updatedAt: new Date() })
      .where(eq(users.id, req.user.id));
    res.json({ message: 'Preferences updated' });
  } catch (err) { next(err); }
}

module.exports = { me, completeOnboarding, updateProfile, changePassword, updateNotificationPrefs };
