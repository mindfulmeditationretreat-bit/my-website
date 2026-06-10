const { Router } = require('express');
const { listPrograms, getProgram } = require('../controllers/programController');

const router = Router();
router.get('/', listPrograms);
router.get('/:slug', getProgram);

module.exports = router;
