const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.post('/esewa/initiate', verifyToken, (req, res) => {
  if (!process.env.ESEWA_MERCHANT_ID) {
    return res.status(503).json({
      message: 'Payment not configured. Set ESEWA_MERCHANT_ID and ESEWA_SECRET_KEY in env.',
    });
  }
  res.json({
    message: 'eSewa integration placeholder — wire up signed form post per https://developer.esewa.com.np/',
    successUrl: process.env.ESEWA_SUCCESS_URL,
    failureUrl: process.env.ESEWA_FAILURE_URL,
  });
});

router.post('/esewa/verify', (_req, res) => {
  res.json({ message: 'eSewa verification placeholder' });
});

module.exports = router;
