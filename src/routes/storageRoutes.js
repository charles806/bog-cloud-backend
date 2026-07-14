const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const {
  uploadFile,
  getFiles,
  downloadFile,
  previewFile,
  deleteFile,
  createFolder,
  getFolders,
  deleteFolder,
  getStorageStats,
  generateShareLink,
  getSharedFile,
  searchFilesController,
  bulkDeleteController,
  bulkMoveController,
  updateFileTags,
  getFileVersions,
  restoreFileVersion,
  getStorageAnalytics
} = require('../controllers/storageController');

router.use(protect);

// Files
router.post('/upload', handleUpload, uploadFile);
router.get('/files', getFiles);
router.get('/files/:id/download', downloadFile);
router.get('/files/:id/preview', previewFile);
router.delete('/files/:id', deleteFile);

// Search
router.get('/search', searchFilesController);

// Bulk operations
router.post('/bulk/delete', bulkDeleteController);
router.post('/bulk/move', bulkMoveController);

// Tags
router.put('/files/:id/tags', updateFileTags);

// Versions
router.get('/files/:id/versions', getFileVersions);
router.post('/files/:id/restore', restoreFileVersion);

// Analytics
router.get('/analytics', getStorageAnalytics);

// Folders
router.post('/folders', createFolder);
router.get('/folders', getFolders);
router.delete('/folders/:id', deleteFolder);

// Storage stats
router.get('/stats', getStorageStats);

// Share links
router.post('/share/:id', generateShareLink);

// Public share endpoint (no auth)
router.get('/share/:token', getSharedFile);

module.exports = router;