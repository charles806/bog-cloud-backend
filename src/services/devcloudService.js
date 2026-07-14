const ApiKey = require('../models/ApiKey');
const Project = require('../models/Project');
const crypto = require('crypto');
const { encrypt, decrypt } = require('../utils/encryption');

const generateApiKey = () => {
  return 'bog_' + crypto.randomBytes(24).toString('hex');
};

const createApiKey = async (data) => {
  const { userId, projectId, name, value, environment, type, expiresAt } = data;

  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw new Error('Project not found or you do not have access');
  }

  const key = generateApiKey();
  const encryptedValue = encrypt(value);

  const apiKey = await ApiKey.create({
    userId,
    projectId,
    name,
    key,
    value: encryptedValue,
    environment: environment || 'development',
    type: type || 'api_key',
    expiresAt: expiresAt || null,
    createdBy: userId
  });

  return apiKey;
};

const getApiKeys = async (userId, projectId) => {
  const query = { userId };
  if (projectId) query.projectId = projectId;
  const keys = await ApiKey.find(query).populate('projectId', 'name');
  return keys;
};

const getApiKey = async (userId, keyId) => {
  const apiKey = await ApiKey.findOne({ _id: keyId, userId }).populate('projectId', 'name');
  if (!apiKey) {
    throw new Error('API Key not found');
  }
  return apiKey;
};

const updateApiKey = async (userId, keyId, updates) => {
  const apiKey = await ApiKey.findOne({ _id: keyId, userId });
  if (!apiKey) {
    throw new Error('API Key not found');
  }

  const allowedUpdates = ['name', 'environment', 'type', 'expiresAt', 'isActive'];
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      apiKey[field] = updates[field];
    }
  });

  if (updates.value) {
    apiKey.value = encrypt(updates.value);
  }

  await apiKey.save();
  return apiKey;
};

const deleteApiKey = async (userId, keyId) => {
  const apiKey = await ApiKey.findOneAndDelete({ _id: keyId, userId });
  if (!apiKey) {
    throw new Error('API Key not found');
  }
  return apiKey;
};

const rotateApiKey = async (userId, keyId) => {
  const apiKey = await ApiKey.findOne({ _id: keyId, userId });
  if (!apiKey) {
    throw new Error('API Key not found');
  }

  const newKey = generateApiKey();
  const oldKey = apiKey.key;
  apiKey.key = newKey;
  apiKey.usageCount = 0;
  apiKey.lastUsedAt = null;
  await apiKey.save();

  return { newKey, oldKey };
};

const createProject = async (userId, name, description, environment) => {
  const project = await Project.create({
    userId,
    name,
    description,
    environment: environment || 'development'
  });
  return project;
};

const getProjects = async (userId) => {
  return await Project.find({ userId });
};

const getProject = async (userId, projectId) => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw new Error('Project not found');
  }
  return project;
};

const updateProject = async (userId, projectId, updates) => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw new Error('Project not found');
  }

  const allowedUpdates = ['name', 'description', 'environment', 'isActive'];
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      project[field] = updates[field];
    }
  });

  await project.save();
  return project;
};

const deleteProject = async (userId, projectId) => {
  await ApiKey.deleteMany({ projectId, userId });
  const project = await Project.findOneAndDelete({ _id: projectId, userId });
  if (!project) {
    throw new Error('Project not found');
  }
  return project;
};

module.exports = {
  createApiKey,
  getApiKeys,
  getApiKey,
  updateApiKey,
  deleteApiKey,
  rotateApiKey,
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
};