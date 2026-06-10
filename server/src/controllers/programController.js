const { eq } = require('drizzle-orm');
const { db } = require('../lib/db');

async function listPrograms(_req, res, next) {
  try {
    const rows = await db.query.programs.findMany({
      where: (t, { eq }) => eq(t.active, true),
      orderBy: (t, { asc }) => asc(t.id),
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function getProgram(req, res, next) {
  try {
    const program = await db.query.programs.findFirst({ where: (t, { eq }) => eq(t.slug, req.params.slug) });
    if (!program) return res.status(404).json({ message: 'Not found' });
    res.json(program);
  } catch (err) { next(err); }
}

module.exports = { listPrograms, getProgram };
