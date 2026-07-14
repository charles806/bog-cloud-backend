const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCredentialsForSite,
  saveCredentialsFromExtension,
  checkSiteHasCredentials
} = require('../controllers/extensionController');

router.use(protect);

router.get('/credentials', getCredentialsForSite);
router.post('/credentials', saveCredentialsFromExtension);
router.get('/check', checkSiteHasCredentials);

module.exports = router;