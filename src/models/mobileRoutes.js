const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  mobileLogin,
  mobileDashboard,
  mobileGetVault,
  mobileGetFiles,
  biometricLogin,
  registerPushToken,
  mobileSync
} = require('../controllers/mobileController');

// Public
router.post('/login', mobileLogin);
router.post('/biometric', biometricLogin);

// Protected
router.use(protect);
router.get('/dashboard', mobileDashboard);
router.get('/vault', mobileGetVault);
router.get('/files', mobileGetFiles);
router.post('/push-token', registerPushToken);
router.post('/sync', mobileSync);

module.exports = router;