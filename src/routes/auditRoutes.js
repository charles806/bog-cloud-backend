const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const {
  getAuditLogs,
  getAuditStats,
  downloadReport,
  cleanupOldLogs
} = require('../controllers/auditController');

router.use(protect);

router.get('/logs', isAdmin, getAuditLogs);
router.get('/stats', isAdmin, getAuditStats);
router.get('/download', downloadReport);
router.post('/cleanup', isAdmin, cleanupOldLogs);

module.exports = router;