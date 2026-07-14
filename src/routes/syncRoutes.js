const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const syncService = require('../services/syncService');

// Get sync status
router.get('/status', protect, async (req, res) => {
  try {
    const status = await syncService.getSyncStatus(req.user._id);
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Push changes
router.post('/push', protect, async (req, res) => {
  try {
    const { action, resourceType, resourceId, resourceData } = req.body;
    const deviceId = req.body.deviceId || 'web';
    
    const result = await syncService.pushChange(
      req.user._id,
      deviceId,
      action,
      resourceType,
      resourceId,
      resourceData
    );
    
    res.status(200).json({
      success: true,
      message: 'Changes pushed successfully',
      data: result
    });
  } catch (error) {
    console.error('Push changes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Pull changes
router.get('/pull', protect, async (req, res) => {
  try {
    const { lastSyncTime, deviceId = 'web' } = req.query;
    const changes = await syncService.pullChanges(
      req.user._id,
      deviceId,
      lastSyncTime
    );
    
    res.status(200).json({
      success: true,
      data: changes
    });
  } catch (error) {
    console.error('Pull changes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Clear synced changes
router.delete('/cleanup', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    await syncService.clearSyncedChanges(req.user._id, parseInt(days));
    res.status(200).json({
      success: true,
      message: `Cleared synced changes older than ${days} days`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;