const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { uploadPhoto } = require('../middleware/upload');
const {
  me, completeOnboarding,
  updateProfile, changePassword, updateNotificationPrefs,
} = require('../controllers/userController');
const { myAssignedResources } = require('../controllers/userResourceController');

const router = Router();
router.get('/me', verifyToken, me);
router.post('/onboarding', verifyToken, completeOnboarding);
router.patch('/me', verifyToken, uploadPhoto.single('photo'), updateProfile);
router.post('/me/password', verifyToken, changePassword);
router.post('/me/notification-prefs', verifyToken, updateNotificationPrefs);
router.get('/me/assigned-resources', verifyToken, myAssignedResources);

module.exports = router;
