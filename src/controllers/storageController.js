const storageService = require('../services/storageService');
const fs = require('fs');
const path = require('path');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { folderId } = req.body;
    const file = await storageService.uploadFile(req.user._id, req.file, folderId);
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const { folderId, limit, offset, sort } = req.query;
    const result = await storageService.getFiles(req.user._id, folderId, {
      limit,
      offset,
      sort
    });
    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await storageService.downloadFile(id, req.user._id);
    
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.sendFile(file.storagePath, { root: '.' });
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'File not found'
    });
  }
};

const previewFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await storageService.downloadFile(id, req.user._id);
    
    // Only preview images and documents
    const previewTypes = ['image/', 'application/pdf', 'text/'];
    const canPreview = previewTypes.some(type => file.mimeType.includes(type));
    
    if (!canPreview) {
      return res.status(400).json({
        success: false,
        message: 'File type cannot be previewed'
      });
    }
    
    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(file.storagePath, { root: '.' });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'File not found'
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await storageService.deleteFile(id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: file
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Delete failed'
    });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }
    const folder = await storageService.createFolder(req.user._id, name, parentFolderId);
    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getFolders = async (req, res) => {
  try {
    const folders = await storageService.getFolders(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Folders retrieved successfully',
      data: folders
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await storageService.deleteFolder(id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Folder deleted successfully',
      data: folder
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Delete failed'
    });
  }
};

const getStorageStats = async (req, res) => {
  try {
    const stats = await storageService.getStorageStats(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Storage stats retrieved',
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const generateShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiryMinutes, password } = req.body;
    const share = await storageService.generateShareLink(id, req.user._id, {
      expiryMinutes,
      password
    });
    res.status(200).json({
      success: true,
      message: 'Share link generated',
      data: share
    });
  } catch (error) {
    console.error('Generate share error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate share link'
    });
  }
};

const getSharedFile = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;
    const file = await storageService.getSharedFile(token, password);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.sendFile(file.storagePath, { root: '.' });
  } catch (error) {
    console.error('Get shared file error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'File not found or link expired'
    });
  }
};
const searchFilesController = async (req, res) => {
  try {
    const { q, limit, offset, sort } = req.query;
    const result = await storageService.searchFiles(req.user._id, q, {
      limit,
      offset,
      sort
    });
    res.status(200).json({
      success: true,
      message: 'Search results',
      data: result
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const bulkDeleteController = async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File IDs required'
      });
    }
    const result = await storageService.bulkDelete(req.user._id, fileIds);
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} files deleted`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const bulkMoveController = async (req, res) => {
  try {
    const { fileIds, folderId } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File IDs required'
      });
    }
    const result = await storageService.bulkMove(req.user._id, fileIds, folderId);
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} files moved`
    });
  } catch (error) {
    console.error('Bulk move error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateFileTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    const file = await storageService.updateFileTags(id, req.user._id, tags);
    res.status(200).json({
      success: true,
      message: 'Tags updated',
      data: file
    });
  } catch (error) {
    console.error('Update tags error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getFileVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await storageService.getFileVersions(id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'File versions retrieved',
      data: versions
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const restoreFileVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { versionId } = req.body;
    if (!versionId) {
      return res.status(400).json({
        success: false,
        message: 'Version ID required'
      });
    }
    const restored = await storageService.restoreFileVersion(id, req.user._id, versionId);
    res.status(200).json({
      success: true,
      message: 'File version restored',
      data: restored
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getStorageAnalytics = async (req, res) => {
  try {
    const analytics = await storageService.getStorageAnalytics(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Storage analytics retrieved',
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
module.exports = {
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
  getStorageAnalytics,
  restoreFileVersion,
  getFileVersions,
  updateFileTags,
  bulkMoveController,
 searchFilesController

};