const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail
} = require('../controllers/emailController');

router.get('/verify-email', verifyEmail);
router.post('/send-verification', protect, sendVerificationEmail);
router.post('/resend-verification', protect, resendVerificationEmail);

module.exports = router;