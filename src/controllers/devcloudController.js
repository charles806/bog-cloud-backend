const devcloudService = require('../services/devcloudService');
const { logAction } = require('../services/auditService');

// Project CRUD
const createProject = async (req, res) => {
  try {
    const { name, description, environment } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    const project = await devcloudService.createProject(
      req.user._id,
      name,
      description,
      environment
    );

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'project_created',
      resourceType: 'project',
      resourceName: name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await devcloudService.getProjects(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Projects retrieved',
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await devcloudService.getProject(req.user._id, projectId);
    res.status(200).json({
      success: true,
      message: 'Project retrieved',
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    const project = await devcloudService.updateProject(req.user._id, projectId, updates);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'project_updated',
      resourceType: 'project',
      resourceName: project.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await devcloudService.deleteProject(req.user._id, projectId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'project_deleted',
      resourceType: 'project',
      resourceName: project.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// API Key CRUD
const createApiKey = async (req, res) => {
  try {
    const { projectId, name, value, environment, type, expiresAt } = req.body;
    if (!projectId || !name || !value) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, name, and value are required'
      });
    }

    const apiKey = await devcloudService.createApiKey({
      userId: req.user._id,
      projectId,
      name,
      value,
      environment,
      type,
      expiresAt
    });

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'api_key_created',
      resourceType: 'api_key',
      resourceName: name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'API Key created successfully',
      data: apiKey
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getApiKeys = async (req, res) => {
  try {
    const { projectId } = req.query;
    const keys = await devcloudService.getApiKeys(req.user._id, projectId);
    res.status(200).json({
      success: true,
      message: 'API Keys retrieved',
      data: keys
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const apiKey = await devcloudService.getApiKey(req.user._id, keyId);
    res.status(200).json({
      success: true,
      message: 'API Key retrieved',
      data: apiKey
    });
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const updateApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const updates = req.body;
    const apiKey = await devcloudService.updateApiKey(req.user._id, keyId, updates);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'api_key_updated',
      resourceType: 'api_key',
      resourceName: apiKey.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'API Key updated successfully',
      data: apiKey
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const apiKey = await devcloudService.deleteApiKey(req.user._id, keyId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'api_key_deleted',
      resourceType: 'api_key',
      resourceName: apiKey.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'API Key deleted successfully'
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const rotateApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const result = await devcloudService.rotateApiKey(req.user._id, keyId);

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'api_key_rotated',
      resourceType: 'api_key',
      resourceName: 'API Key',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { oldKey: result.oldKey, newKey: result.newKey }
    });

    res.status(200).json({
      success: true,
      message: 'API Key rotated successfully',
      data: result
    });
  } catch (error) {
    console.error('Rotate API key error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
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
};