const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { listMine, markRead, markAllRead } = require('../controllers/notificationController');

const router = Router();
router.use(verifyToken);
router.get('/', listMine);
router.post('/read-all', markAllRead);
router.post('/:id/read', markRead);

module.exports = router;
