const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  createFolder,
  getFolders,
  deleteFolder,
  moveEntry,
  toggleFavorite,
  getFavorites,
  searchEntries,
  bulkDelete,
  bulkMove,
  importEntries,
  exportEntries,
  getPasswordHistory,
  generate,
  checkStrengthController
} = require('../controllers/vaultController');

router.use(protect);

// ===================== VAULT ENTRIES =====================
router.post('/entries', createEntry);
router.get('/entries', getEntries);
router.get('/entries/:id', getEntry);
router.put('/entries/:id', updateEntry);
router.delete('/entries/:id', deleteEntry);

// ===================== FOLDERS =====================
router.post('/folders', createFolder);
router.get('/folders', getFolders);
router.delete('/folders/:id', deleteFolder);

// ===================== MOVE & FAVORITES =====================
router.put('/entries/:id/move', moveEntry);
router.put('/entries/:id/favorite', toggleFavorite);
router.get('/favorites', getFavorites);

// ===================== SEARCH =====================
router.get('/search', searchEntries);

// ===================== BULK OPERATIONS =====================
router.post('/bulk/delete', bulkDelete);
router.post('/bulk/move', bulkMove);

// ===================== IMPORT / EXPORT =====================
router.post('/import', importEntries);
router.get('/export', exportEntries);

// ===================== PASSWORD HISTORY =====================
router.get('/entries/:id/history', getPasswordHistory);

// ===================== UTILITIES =====================
router.get('/generate', generate);
router.post('/check-strength', checkStrengthController);

module.exports = router;