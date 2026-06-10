const { Router } = require('express');
const passport = require('passport');
const {
  signup, login, logout,
  googleCallback, googleUnavailable,
  forgotPassword, resetPassword,
  verifyEmail, resendVerification,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, verifyToken, resendVerification);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
  );
  router.get('/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${process.env.CLIENT_ORIGIN}/login?error=google`,
      session: false,
    }),
    googleCallback
  );
} else {
  router.get('/google', googleUnavailable);
  router.get('/google/callback', googleUnavailable);
}

module.exports = router;
