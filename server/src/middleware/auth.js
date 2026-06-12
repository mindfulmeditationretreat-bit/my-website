const jwt = require('jsonwebtoken');
const { db } = require('../lib/db');
const { eq } = require('drizzle-orm');

async function verifyToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Always read role + active from DB so stale JWTs never cause wrong role
    const user = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, payload.id),
      columns: { id: true, role: true, active: true },
    });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!user.active && user.role !== 'instructor') {
      return res.status(403).json({ message: 'Account deactivated' });
    }
    req.user = { ...payload, role: user.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
