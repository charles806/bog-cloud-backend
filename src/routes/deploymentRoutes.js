const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const {
  createDeployment,
  deployApp,
  getDeployments,
  getDeployment,
  rollbackDeployment,
  getDeploymentLogs,
  restartDeployment,
  stopDeployment
} = require('../controllers/deploymentController');

router.use(protect);
router.use(isAdmin);

router.post('/', createDeployment);
router.post('/:deploymentId/deploy', deployApp);
router.get('/', getDeployments);
router.get('/:deploymentId', getDeployment);
router.post('/:deploymentId/rollback', rollbackDeployment);
router.get('/:deploymentId/logs', getDeploymentLogs);
router.post('/:deploymentId/restart', restartDeployment);
router.post('/:deploymentId/stop', stopDeployment);

module.exports = router;