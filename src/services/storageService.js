const StorageFile = require('../models/StorageFile');
const StorageFolder = require('../models/StorageFolder');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uploadFile = async (userId, file, folderId = null) => {
  const user = await User.findById(userId);
  
  // Check storage quota
  const used = user.storageUsed || 0;
  const quota = user.storageQuota || 2 * 1024 * 1024 * 1024;
  if (used + file.size > quota) {
    throw new Error('Storage quota exceeded. Please upgrade your plan.');
  }
  
  // Check for duplicate file
  const fileHash = crypto.createHash('sha256').update(file.buffer || file.path).digest('hex');
  const existing = await StorageFile.findOne({ userId, fileHash });
  if (existing) {
    // Delete the uploaded file
    fs.unlinkSync(file.path);
    return existing;
  }
  
  // Create file record
  const storageFile = await StorageFile.create({
    userId,
    folderId: folderId || null,
    fileName: file.filename,
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    fileHash: fileHash,
    storagePath: file.path
  });
  
  // Update user storage usage
  user.storageUsed = used + file.size;
  await user.save();
  
  return storageFile;
};

const downloadFile = async (fileId, userId) => {
  const file = await StorageFile.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  
  if (!fs.existsSync(file.storagePath)) {
    throw new Error('File not found on disk');
  }
  
  return file;
};

const getFiles = async (userId, folderId = null, options = {}) => {
  const { limit = 50, offset = 0, sort = '-createdAt' } = options;
  const filter = { userId };
  if (folderId !== undefined && folderId !== null) {
    filter.folderId = folderId === 'null' ? null : folderId;
  }
  
  const [files, total] = await Promise.all([
    StorageFile.find(filter)
      .sort(sort)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('folderId'),
    StorageFile.countDocuments(filter)
  ]);
  
  return { files, total, offset, limit };
};

const deleteFile = async (fileId, userId) => {
  const file = await StorageFile.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  
  // Delete file from disk
  if (fs.existsSync(file.storagePath)) {
    fs.unlinkSync(file.storagePath);
  }
  
  // Remove from database
  await file.deleteOne();
  
  // Update user storage usage
  const user = await User.findById(userId);
  user.storageUsed = Math.max(0, user.storageUsed - file.fileSize);
  await user.save();
  
  return file;
};

const createFolder = async (userId, name, parentFolderId = null) => {
  const folder = await StorageFolder.create({
    userId,
    name,
    parentFolderId: parentFolderId || null
  });
  return folder;
};

const getFolders = async (userId) => {
  const folders = await StorageFolder.find({ userId }).sort({ name: 1 });
  return folders;
};

const deleteFolder = async (folderId, userId) => {
  const folder = await StorageFolder.findOneAndDelete({ _id: folderId, userId });
  if (!folder) {
    throw new Error('Folder not found');
  }
  await StorageFile.updateMany({ folderId: folderId }, { folderId: null });
  return folder;
};

const getStorageStats = async (userId) => {
  const user = await User.findById(userId);
  const used = user.storageUsed || 0;
  const quota = user.storageQuota || 2 * 1024 * 1024 * 1024;
  return {
    used,
    quota,
    percentage: (used / quota) * 100,
    remaining: quota - used
  };
};

const generateShareLink = async (fileId, userId, options = {}) => {
  const { expiryMinutes = 60, password = null } = options;
  const file = await StorageFile.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  
  const token = crypto.randomBytes(16).toString('hex');
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  
  file.shareToken = token;
  file.shareExpiry = expiry;
  file.sharePassword = password;
  await file.save();
  
  return {
    token,
    expiry,
    url: `/api/v1/storage/share/${token}`,
    password: password
  };
};

const getSharedFile = async (token, password = null) => {
  const file = await StorageFile.findOne({ shareToken: token });
  if (!file) {
    throw new Error('File not found');
  }
  
  if (file.shareExpiry && file.shareExpiry < new Date()) {
    throw new Error('Share link has expired');
  }
  
  if (file.sharePassword && file.sharePassword !== password) {
    throw new Error('Invalid password');
  }
  
  return file;
};

const searchFiles = async (userId, query, options = {}) => {
  const { limit = 50, offset = 0, sort = '-createdAt' } = options;
  const filter = { userId };
  
  if (query && query.trim()) {
    const searchTerm = query.trim();
    filter.$or = [
      { fileName: { $regex: searchTerm, $options: 'i' } },
      { originalName: { $regex: searchTerm, $options: 'i' } },
      { mimeType: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }
  
  const [files, total] = await Promise.all([
    StorageFile.find(filter)
      .sort(sort)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('folderId'),
    StorageFile.countDocuments(filter)
  ]);
  
  return { files, total, offset, limit };
};

const bulkDelete = async (userId, fileIds) => {
  const files = await StorageFile.find({ _id: { $in: fileIds }, userId });
  let totalSize = 0;
  
  for (const file of files) {
    if (fs.existsSync(file.storagePath)) {
      fs.unlinkSync(file.storagePath);
    }
    totalSize += file.fileSize;
  }
  
  const result = await StorageFile.deleteMany({ _id: { $in: fileIds }, userId });
  
  const user = await User.findById(userId);
  user.storageUsed = Math.max(0, user.storageUsed - totalSize);
  await user.save();
  
  return result;
};

const bulkMove = async (userId, fileIds, folderId) => {
  const result = await StorageFile.updateMany(
    { _id: { $in: fileIds }, userId },
    { folderId: folderId || null }
  );
  return result;
};

const updateFileTags = async (fileId, userId, tags) => {
  const file = await StorageFile.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  file.tags = tags || [];
  await file.save();
  return file;
};

const getFileVersions = async (fileId, userId) => {
  const file = await StorageFile.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  const versions = file.versions || [];
  return versions;
};

const restoreFileVersion = async (fileId, userId, versionId) => {
  const file = await StorageFile.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  
  const versions = file.versions || [];
  const version = versions.find(v => v._id.toString() === versionId);
  if (!version) {
    throw new Error('Version not found');
  }
  
  // Restore the file from version
  const restoredFile = await StorageFile.create({
    userId: file.userId,
    fileName: version.fileName || file.fileName,
    originalName: version.originalName || file.originalName,
    fileSize: version.fileSize || file.fileSize,
    mimeType: version.mimeType || file.mimeType,
    storagePath: version.storagePath || file.storagePath,
    tags: file.tags,
    isStarred: file.isStarred
  });
  
  return restoredFile;
};

const getStorageAnalytics = async (userId) => {
  const user = await User.findById(userId);
  const files = await StorageFile.find({ userId });
  
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);
  const quota = user.storageQuota || 2 * 1024 * 1024 * 1024;
  
  // Group by file type
  const byType = {};
  files.forEach(file => {
    const type = file.mimeType.split('/')[0];
    byType[type] = (byType[type] || 0) + 1;
  });
  
  // Most recent files
  const recent = files
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  return {
    totalFiles,
    totalSize,
    quota,
    usedPercentage: (totalSize / quota) * 100,
    byType,
    recent: recent.map(f => ({
      id: f._id,
      name: f.originalName,
      size: f.fileSize,
      type: f.mimeType,
      createdAt: f.createdAt
    }))
  };
};
const canPreviewFile = (mimeType) => {
  const previewTypes = [
    'image/',
    'application/pdf',
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/mp3'
  ];
  return previewTypes.some(type => mimeType.includes(type));
};

const getPreviewUrl = async (fileId, userId) => {
  const file = await StorageFile.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  
  if (!canPreviewFile(file.mimeType)) {
    throw new Error('File type cannot be previewed');
  }
  
  return file.storagePath;
};

module.exports = {
  uploadFile,
  downloadFile,
  getFiles,
  deleteFile,
  createFolder,
  getFolders,
  deleteFolder,
  getStorageStats,
  generateShareLink,
  getSharedFile,
  searchFiles,
  bulkDelete,
  bulkMove,
  updateFileTags,
  getFileVersions,
  restoreFileVersion,
  getStorageAnalytics
};