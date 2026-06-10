const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { addEntry, listEntries } = require('../controllers/progressController');

const router = Router();
router.use(verifyToken);
router.get('/', listEntries);
router.post('/', addEntry);

module.exports = router;
