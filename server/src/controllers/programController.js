const { prisma } = require('../lib/prisma');

async function listPrograms(_req, res, next) {
  try {
    const programs = await prisma.program.findMany({
      where: { active: true },
      orderBy: { id: 'asc' },
    });
    res.json(programs);
  } catch (err) { next(err); }
}

async function getProgram(req, res, next) {
  try {
    const program = await prisma.program.findUnique({ where: { slug: req.params.slug } });
    if (!program) return res.status(404).json({ message: 'Not found' });
    res.json(program);
  } catch (err) { next(err); }
}

module.exports = { listPrograms, getProgram };
