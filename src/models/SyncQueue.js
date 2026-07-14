const mongoose = require('mongoose');

const syncQueueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'password_created',
      'password_updated',
      'password_deleted',
      'file_uploaded',
      'file_deleted',
      'file_moved',
      'folder_created',
      'folder_deleted'
    ]
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['password', 'file', 'folder']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  syncedAt: {
    type: Date,
    default: null
  }
});


syncQueueSchema.statics.cleanupOldSynced = async function(daysToKeep = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    status: 'synced',
    syncedAt: { $lt: cutoff }
  });
  
  console.log(` Cleaned up ${result.deletedCount} old synced records`);
  return result;
};

syncQueueSchema.statics.getPendingCount = async function(userId) {
  return await this.countDocuments({
    userId,
    status: 'pending'
  });
};

syncQueueSchema.statics.getSyncStats = async function(userId) {
  const [pending, synced, failed, total] = await Promise.all([
    this.countDocuments({ userId, status: 'pending' }),
    this.countDocuments({ userId, status: 'synced' }),
    this.countDocuments({ userId, status: 'failed' }),
    this.countDocuments({ userId })
  ]);
  
  return { pending, synced, failed, total };
};

module.exports = mongoose.model('SyncQueue', syncQueueSchema);