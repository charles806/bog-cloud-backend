const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getDevices,
  revokeDevice,
  revokeAllDevices,
  deleteAccount,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/password', changePassword);
router.get('/devices', getDevices);
router.delete('/devices/all', revokeAllDevices);
router.delete('/devices/:deviceId', revokeDevice);
router.delete('/me', deleteAccount);
router.get('/stats', getUserStats);

module.exports = router;