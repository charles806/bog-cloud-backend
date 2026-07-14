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

// ===================== PUBLIC ROUTES =====================
router.post('/login', mobileLogin);
router.post('/biometric', biometricLogin);

// ===================== PROTECTED ROUTES =====================
router.use(protect);

// Dashboard
router.get('/dashboard', mobileDashboard);

// Vault
router.get('/vault', mobileGetVault);

// Files
router.get('/files', mobileGetFiles);

// Push Notifications
router.post('/push-token', registerPushToken);

// Sync
router.post('/sync', mobileSync);

module.exports = router;