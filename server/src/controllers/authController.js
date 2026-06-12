const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../lib/db');
const { users, verificationTokens, passwordResetTokens } = require('../db/schema');
const { randomToken, hoursFromNow, minutesFromNow } = require('../lib/tokens');
const { sendMail, templates } = require('../lib/mailer');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  domain: process.env.COOKIE_DOMAIN || undefined,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    onboarded: !!user.onboarded,
    emailVerified: !!user.emailVerified,
    fullName: user.fullName || null,
  };
}

const LINK_TTL_MINUTES = 10;

async function sendVerificationEmail(user) {
  await db.delete(verificationTokens).where(eq(verificationTokens.userId, user.id));
  const token = randomToken();
  await db.insert(verificationTokens).values({ userId: user.id, token, expiresAt: minutesFromNow(LINK_TTL_MINUTES) });
  const link = `${process.env.CLIENT_ORIGIN}/verify-email/${token}`;
  const tpl = templates.verifyEmail(link);
  await sendMail({ to: user.email, ...tpl });
}

async function signup(req, res, next) {
  try {
    const { email, password, role: reqRole, fullName, expertise, bio, availability } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Email and password (min 8 chars) required' });
    }
    const role = reqRole === 'instructor' ? 'instructor' : 'user';
    const existing = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.email, email) });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const insertData = { email, passwordHash, role, updatedAt: new Date() };
    if (fullName) insertData.fullName = fullName;
    if (role === 'instructor') {
      if (expertise) insertData.expertise = expertise;
      if (bio) insertData.bio = bio;
      if (availability) insertData.availability = availability;
    }
    const [{ id }] = await db.insert(users).values(insertData).$returningId();
    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, id) });

    let emailSent = false;
    try {
      await sendVerificationEmail(user);
      emailSent = true;
    } catch (e) { console.error('[signup] verification email failed', e.message); }

    res.cookie('token', signToken(user), COOKIE_OPTIONS);
    res.status(201).json({ ...publicUser(user), emailSent });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.email, email) });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.active) return res.status(403).json({ message: 'Account deactivated' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    res.cookie('token', signToken(user), COOKIE_OPTIONS);
    res.json(publicUser(user));
  } catch (err) { next(err); }
}

function logout(req, res) {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: undefined });
  res.status(204).send();
}

async function googleCallback(req, res, next) {
  try {
    if (!req.user) return res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=google`);
    res.cookie('token', signToken(req.user), COOKIE_OPTIONS);
    const dest = req.user.onboarded ? '/dashboard' : '/onboarding';
    res.redirect(`${process.env.CLIENT_ORIGIN}${dest}`);
  } catch (err) { next(err); }
}

function googleUnavailable(_req, res) {
  res.status(503).json({ message: 'Google OAuth not configured on this server' });
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.email, email) });
    if (user) {
      const token = randomToken();
      await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt: hoursFromNow(1) });
      const link = `${process.env.CLIENT_ORIGIN}/reset-password/${token}`;
      const tpl = templates.passwordReset(link);
      try { await sendMail({ to: user.email, ...tpl }); }
      catch (e) { console.error('[forgotPassword] email send failed', e.message); }
    }
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ message: 'Token and password (min 8 chars) required' });
    }
    const record = await db.query.passwordResetTokens.findFirst({ where: (t, { eq }) => eq(t.token, token) });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    const record = await db.query.verificationTokens.findFirst({ where: (t, { eq }) => eq(t.token, token) });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, record.userId));
    await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, record.id));
    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, record.userId) });

    try {
      const welcome = templates.welcome(user.fullName);
      await sendMail({ to: user.email, ...welcome });
    } catch (e) { console.error('[verifyEmail] welcome email failed', e.message); }

    res.json({ message: 'Email verified' });
  } catch (err) { next(err); }
}

async function resendVerification(req, res, next) {
  try {
    const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, req.user.id) });
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (user.emailVerified) return res.json({ message: 'Already verified' });
    await sendVerificationEmail(user);
    res.json({ message: 'Verification email sent' });
  } catch (err) { next(err); }
}

module.exports = {
  signup, login, logout,
  googleCallback, googleUnavailable,
  forgotPassword, resetPassword,
  verifyEmail, resendVerification,
};
