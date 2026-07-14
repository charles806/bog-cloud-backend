const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const mfaRoutes = require('./mfaRoutes');
const adminRoutes = require('./adminRoutes');
const auditRoutes = require('./auditRoutes');
const vaultRoutes = require('./vaultRoutes');
const storageRoutes = require('./storageRoutes');
const syncRoutes = require('./syncRoutes');
const emailRoutes = require('./emailRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const passwordRoutes = require('./passwordRoutes');
const devcloudRoutes = require('./devcloudRoutes');
const deploymentRoutes = require('./deploymentRoutes');
const extensionRoutes = require('./extensionRoutes');
const mobileRoutes = require('./mobileRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/mfa', mfaRoutes);
router.use('/admin', adminRoutes);
router.use('/audit', auditRoutes);
router.use('/vault', vaultRoutes);
router.use('/storage', storageRoutes);
router.use('/sync', syncRoutes);
router.use('/deploy', deploymentRoutes);
router.use('/devcloud', devcloudRoutes);
router.use('/email', emailRoutes);
 router.use('/analytics', analyticsRoutes);
 router.use('/password', passwordRoutes);
 router.use('/extension', extensionRoutes);
 router.use('/mobile', mobileRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;