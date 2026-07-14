const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { setupMfa, verifyMfa, disableMfa } = require('../controllers/mfaController');

router.use(protect);

router.post('/setup', setupMfa);
router.post('/verify', verifyMfa);
router.post('/disable', disableMfa);

module.exports = router;