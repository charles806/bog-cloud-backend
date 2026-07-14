const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  userEmail: {
    type: String,
    index: true
  },
  userRole: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    enum: ['auth', 'user', 'vault_entry', 'folder', 'mfa', 'admin_action', 'audit', 'storage', 'sync', 'other'],
    default: 'other'
  },
  resourceId: {
    type: String,
    default: null
  },
  resourceName: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  deviceName: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);