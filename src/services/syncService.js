const SyncQueue = require('../models/SyncQueue');
const VaultEntry = require('../models/VaultEntry');
const StorageFile = require('../models/StorageFile');
const StorageFolder = require('../models/StorageFolder');

const pushChange = async (userId, deviceId, action, resourceType, resourceId, resourceData = {}) => {
  const syncItem = await SyncQueue.create({
    userId,
    deviceId,
    action,
    resourceType,
    resourceId,
    resourceData,
    status: 'pending'
  });
  return syncItem;
};

const pullChanges = async (userId, deviceId, lastSyncTime = null) => {
  const query = {
    userId,
    deviceId: { $ne: deviceId },
    status: 'synced'
  };
  
  if (lastSyncTime) {
    query.syncedAt = { $gt: new Date(lastSyncTime) };
  }
  
  const changes = await SyncQueue.find(query)
    .sort({ createdAt: 1 })
    .limit(100);
  
  return changes;
};

const markAsSynced = async (syncId) => {
  await SyncQueue.findByIdAndUpdate(syncId, {
    status: 'synced',
    syncedAt: new Date()
  });
};

const getPendingChanges = async (userId, deviceId) => {
  return await SyncQueue.find({
    userId,
    deviceId,
    status: 'pending'
  }).sort({ createdAt: 1 });
};

const clearSyncedChanges = async (userId, olderThan = 7) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThan);
  await SyncQueue.deleteMany({
    userId,
    status: 'synced',
    syncedAt: { $lt: cutoff }
  });
};

const getSyncStatus = async (userId) => {
  const pending = await SyncQueue.countDocuments({
    userId,
    status: 'pending'
  });
  
  const lastSynced = await SyncQueue.findOne({
    userId,
    status: 'synced'
  }).sort({ syncedAt: -1 });
  
  return {
    pending,
    lastSynced: lastSynced ? lastSynced.syncedAt : null,
    total: await SyncQueue.countDocuments({ userId })
  };
};

const resolveConflict = (localVersion, remoteVersion) => {
  // Last write wins (based on version number)
  return localVersion >= remoteVersion ? localVersion : remoteVersion;
};

module.exports = {
  pushChange,
  pullChanges,
  markAsSynced,
  getPendingChanges,
  clearSyncedChanges,
  getSyncStatus,
  resolveConflict
};