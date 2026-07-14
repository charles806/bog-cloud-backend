const express = require('express');
const router = express.Router();
const {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  resendOTP
} = require('../controllers/passwordController');

router.post('/forgot-password', requestPasswordReset);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOTP);

module.exports = router;