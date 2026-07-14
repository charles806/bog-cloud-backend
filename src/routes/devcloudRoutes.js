const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  createApiKey,
  getApiKeys,
  getApiKey,
  updateApiKey,
  deleteApiKey,
  rotateApiKey
} = require('../controllers/devcloudController');

router.use(protect);
router.use(isAdmin);

// Projects
router.post('/projects', createProject);
router.get('/projects', getProjects);
router.get('/projects/:projectId', getProject);
router.put('/projects/:projectId', updateProject);
router.delete('/projects/:projectId', deleteProject);

// API Keys
router.post('/keys', createApiKey);
router.get('/keys', getApiKeys);
router.get('/keys/:keyId', getApiKey);
router.put('/keys/:keyId', updateApiKey);
router.delete('/keys/:keyId', deleteApiKey);
router.post('/keys/:keyId/rotate', rotateApiKey);

module.exports = router;