const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  startTrial, listMySubscriptions, cancelSubscription,
} = require('../controllers/subscriptionController');

const router = Router();
router.use(verifyToken);
router.get('/mine', listMySubscriptions);
router.post('/start-trial', startTrial);
router.post('/:id/cancel', cancelSubscription);

module.exports = router;
