const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validate } = require('../middleware/validator');

router.post('/register', authLimiter, validateRegister, validate, register);
router.post('/login', authLimiter, validateLogin, validate, login);
router.post('/refresh', refreshToken);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router; 