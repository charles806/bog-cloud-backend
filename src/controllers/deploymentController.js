const deploymentService = require('../services/deploymentService');
const { logAction } = require('../services/auditService');

const createDeployment = async (req, res) => {
  try {
    const { projectId, appName, gitRepo, gitBranch, environment, runtime, port, customDomain } = req.body;

    if (!projectId || !appName || !gitRepo) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, app name, and git repo are required'
      });
    }

    const deployment = await deploymentService.createDeployment({
      projectId,
      userId: req.user._id,
      appName,
      gitRepo,
      gitBranch,
      environment,
      runtime,
      port,
      customDomain
    });

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'deployment_created',
      resourceType: 'deployment',
      resourceName: appName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Deployment created successfully',
      data: deployment
    });
  } catch (error) {
    console.error('Create deployment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const deployApp = async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = await deploymentService.deployApp(deploymentId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'deployment_started',
      resourceType: 'deployment',
      resourceName: deployment.appName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Deployment started successfully',
      data: deployment
    });
  } catch (error) {
    console.error('Deploy app error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getDeployments = async (req, res) => {
  try {
    const { projectId } = req.query;
    const deployments = await deploymentService.getDeployments(req.user._id, projectId);
    res.status(200).json({
      success: true,
      message: 'Deployments retrieved',
      data: deployments
    });
  } catch (error) {
    console.error('Get deployments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await deploymentService.getDeployment(req.user._id, deploymentId);
    res.status(200).json({
      success: true,
      message: 'Deployment retrieved',
      data: deployment
    });
  } catch (error) {
    console.error('Get deployment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const rollbackDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await deploymentService.rollbackDeployment(req.user._id, deploymentId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'deployment_rolled_back',
      resourceType: 'deployment',
      resourceName: deployment.appName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Rollback successful',
      data: deployment
    });
  } catch (error) {
    console.error('Rollback deployment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getDeploymentLogs = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const logs = await deploymentService.getDeploymentLogs(req.user._id, deploymentId);
    res.status(200).json({
      success: true,
      message: 'Logs retrieved',
      data: logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const restartDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await deploymentService.restartDeployment(req.user._id, deploymentId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'deployment_restarted',
      resourceType: 'deployment',
      resourceName: deployment.appName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Application restarted',
      data: deployment
    });
  } catch (error) {
    console.error('Restart deployment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const stopDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await deploymentService.stopDeployment(req.user._id, deploymentId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'deployment_stopped',
      resourceType: 'deployment',
      resourceName: deployment.appName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Application stopped',
      data: deployment
    });
  } catch (error) {
    console.error('Stop deployment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  createDeployment,
  deployApp,
  getDeployments,
  getDeployment,
  rollbackDeployment,
  getDeploymentLogs,
  restartDeployment,
  stopDeployment
};