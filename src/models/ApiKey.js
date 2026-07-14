const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Key name is required'],
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'development'
  },
  type: {
    type: String,
    enum: ['api_key', 'oauth_token', 'database_url', 'secret', 'webhook_url', 'other'],
    default: 'api_key'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// apiKeySchema.index({ key: 1 });
apiKeySchema.index({ userId: 1, projectId: 1 });
apiKeySchema.index({ expiresAt: 1 });

apiKeySchema.methods.recordUsage = async function() {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  return this.save();
};

apiKeySchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
};

apiKeySchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.value;
  return obj;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);