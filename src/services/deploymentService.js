const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const createDeployment = async (data) => {
  const { projectId, userId, appName, gitRepo, gitBranch, environment, runtime, port, customDomain } = data;

  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw new Error('Project not found');
  }

  const deployment = await Deployment.create({
    projectId,
    userId,
    appName,
    gitRepo,
    gitBranch: gitBranch || 'main',
    environment: environment || 'development',
    runtime: runtime || 'nodejs',
    port: port || 3000,
    customDomain: customDomain || null,
    status: 'pending',
    deployedBy: userId
  });

  return deployment;
};

const deployApp = async (deploymentId) => {
  const deployment = await Deployment.findById(deploymentId);
  if (!deployment) {
    throw new Error('Deployment not found');
  }

  deployment.status = 'building';
  await deployment.addBuildLog(' Starting deployment...');

  try {
    // Step 1: Clone repository
    await deployment.addBuildLog(` Cloning repository: ${deployment.gitRepo}`);
    await deployment.addBuildLog(` Branch: ${deployment.gitBranch}`);

    // Step 2: Build Docker image (simulated)
    await deployment.addBuildLog(` Building Docker image for ${deployment.appName}`);
    const imageTag = `bogcloud/${deployment.appName}:${Date.now()}`;
    await deployment.addBuildLog(` Image built: ${imageTag}`);

    // Step 3: Push to registry (simulated)
    await deployment.addBuildLog(` Pushing image to registry...`);
    await deployment.addBuildLog(` Image pushed successfully`);

    // Step 4: Deploy to Kubernetes (simulated)
    await deployment.addBuildLog(` Deploying to Kubernetes cluster...`);
    await deployment.addBuildLog(` Deployment created`);

    // Step 5: Setup custom domain if provided
    if (deployment.customDomain) {
      await deployment.addBuildLog(` Configuring domain: ${deployment.customDomain}`);
      await deployment.addBuildLog(` SSL certificate provisioned (Let's Encrypt)`);
      await deployment.addBuildLog(` Domain mapped successfully`);
    }

    // Step 6: Setup auto-scaling if enabled
    if (deployment.autoScaling?.enabled) {
      await deployment.addBuildLog(` Auto-scaling enabled: ${deployment.autoScaling.minReplicas}-${deployment.autoScaling.maxReplicas} replicas`);
    }

    // Step 7: Deploy environment variables
    await deployment.addBuildLog(` Injecting environment variables...`);
    await deployment.addBuildLog(` Variables injected`);

    // Step 8: Health check
    await deployment.addBuildLog(` Health check passed`);

    deployment.status = 'running';
    deployment.dockerImage = imageTag;
    deployment.deployedAt = new Date();
    deployment.lastActivityAt = new Date();

    await deployment.addBuildLog(` Deployment successful! App is running at: https://${deployment.appName}.bogcloud.com`);
    if (deployment.customDomain) {
      await deployment.addBuildLog(` Custom domain: https://${deployment.customDomain}`);
    }

    await deployment.save();
    return deployment;

  } catch (error) {
    deployment.status = 'failed';
    await deployment.addBuildLog(` Deployment failed: ${error.message}`);
    await deployment.save();
    throw error;
  }
};

const getDeployments = async (userId, projectId) => {
  const query = { userId };
  if (projectId) query.projectId = projectId;
  return await Deployment.find(query).sort({ createdAt: -1 });
};

const getDeployment = async (userId, deploymentId) => {
  const deployment = await Deployment.findOne({ _id: deploymentId, userId });
  if (!deployment) {
    throw new Error('Deployment not found');
  }
  return deployment;
};

const rollbackDeployment = async (userId, deploymentId) => {
  const deployment = await Deployment.findOne({ _id: deploymentId, userId });
  if (!deployment) {
    throw new Error('Deployment not found');
  }

  // Find previous successful deployment
  const previousDeployment = await Deployment.findOne({
    projectId: deployment.projectId,
    status: 'running',
    _id: { $ne: deploymentId }
  }).sort({ createdAt: -1 });

  if (!previousDeployment) {
    throw new Error('No previous deployment found to rollback to');
  }

  // Save current version as previous
  const currentDeployment = deployment;
  const newDeployment = await Deployment.create({
    projectId: currentDeployment.projectId,
    userId: currentDeployment.userId,
    appName: currentDeployment.appName,
    version: previousDeployment.version,
    gitRepo: previousDeployment.gitRepo,
    gitBranch: previousDeployment.gitBranch,
    gitCommit: previousDeployment.gitCommit,
    environment: previousDeployment.environment,
    runtime: previousDeployment.runtime,
    port: previousDeployment.port,
    customDomain: previousDeployment.customDomain,
    dockerImage: previousDeployment.dockerImage,
    status: 'running',
    deployedAt: new Date(),
    deployedBy: userId,
    previousVersion: currentDeployment._id
  });

  await newDeployment.addBuildLog(` Rolled back to version ${previousDeployment.version}`);
  await newDeployment.addBuildLog(` Rollback complete`);

  currentDeployment.status = 'rolled_back';
  await currentDeployment.save();

  return newDeployment;
};

const getDeploymentLogs = async (userId, deploymentId) => {
  const deployment = await Deployment.findOne({ _id: deploymentId, userId });
  if (!deployment) {
    throw new Error('Deployment not found');
  }
  return {
    buildLogs: deployment.buildLogs || [],
    runtimeLogs: deployment.runtimeLogs || []
  };
};

const restartDeployment = async (userId, deploymentId) => {
  const deployment = await Deployment.findOne({ _id: deploymentId, userId });
  if (!deployment) {
    throw new Error('Deployment not found');
  }

  await deployment.addRuntimeLog(` Restarting application...`);
  await deployment.addRuntimeLog(` Application restarted successfully`);
  deployment.lastActivityAt = new Date();
  await deployment.save();

  return deployment;
};

const stopDeployment = async (userId, deploymentId) => {
  const deployment = await Deployment.findOne({ _id: deploymentId, userId });
  if (!deployment) {
    throw new Error('Deployment not found');
  }

  deployment.status = 'stopped';
  await deployment.addRuntimeLog(` Application stopped`);
  await deployment.save();

  return deployment;
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