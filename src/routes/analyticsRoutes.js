const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const {
  getDashboardOverview,
  getUserAnalytics,
  getActivityAnalytics,
  getStorageAnalytics,
  getPaymentAnalytics,
  exportReport
} = require('../controllers/analyticsController');

router.use(protect);
router.use(isAdmin);

router.get('/dashboard', getDashboardOverview);
router.get('/users', getUserAnalytics);
router.get('/activity', getActivityAnalytics);
router.get('/storage', getStorageAnalytics);
router.get('/payments', getPaymentAnalytics);
router.get('/export', exportReport);

module.exports = router;