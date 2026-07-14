const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const logAction = async (data) => {
  try {
    const validResourceTypes = ['auth', 'user', 'vault_entry', 'folder', 'mfa', 'admin_action', 'audit', 'storage', 'sync', 'other'];
    
    let resourceType = data.resourceType || 'other';
    if (!validResourceTypes.includes(resourceType)) {
      resourceType = 'other';
    }

    const logEntry = await AuditLog.create({
      userId: data.userId || null,
      userEmail: data.userEmail || 'anonymous',
      userRole: data.userRole || 'user',
      action: data.action,
      resourceType: resourceType,
      resourceId: data.resourceId || null,
      resourceName: data.resourceName || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      deviceName: data.deviceName || null,
      details: data.details || {},
      status: data.status || 'success'
    });

    // Terminal logging with colors
    const logMessage = [
      `[${new Date().toISOString()}]`,
      `${data.userEmail || 'anonymous'}`,
      `→ ${data.action}`,
      data.resourceName ? `(${data.resourceName})` : '',
      data.status === 'success' 
    ].filter(Boolean).join(' ');

    if (data.action.includes('admin') || data.userRole === 'admin' || data.userRole === 'super_admin') {
      console.log('\x1b[31m%s\x1b[0m', ` ${logMessage}`);
    } else if (data.action.includes('login') || data.action.includes('logout') || data.action.includes('register')) {
      console.log('\x1b[36m%s\x1b[0m', ` ${logMessage}`);
    } else if (data.action.includes('password') || data.action.includes('folder')) {
      console.log('\x1b[33m%s\x1b[0m', ` ${logMessage}`);
    } else {
      console.log('\x1b[32m%s\x1b[0m', ` ${logMessage}`);
    }

    return logEntry;
  } catch (error) {
    console.error('Audit log error:', error.message);
    return null;
  }
};

const getActivities = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      fromDate,
      toDate,
      limit = 100,
      offset = 0,
      sort = '-createdAt'
    } = filters;

    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort(sort)
        .skip(parseInt(offset))
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    return { logs, total, offset, limit };
  } catch (error) {
    console.error('Get activities error:', error.message);
    return { logs: [], total: 0, offset: 0, limit: 0 };
  }
};

const getActivityStats = async (fromDate, toDate) => {
  try {
    const query = {};
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const [totalLogins, totalActions, uniqueUsers, actionsByType] = await Promise.all([
      AuditLog.countDocuments({ ...query, action: 'login', status: 'success' }),
      AuditLog.countDocuments(query),
      AuditLog.distinct('userId', query),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      totalLogins,
      totalActions,
      uniqueUsers: uniqueUsers.length,
      actionsByType
    };
  } catch (error) {
    console.error('Get activity stats error:', error.message);
    return { totalLogins: 0, totalActions: 0, uniqueUsers: 0, actionsByType: [] };
  }
};

const deleteOldLogs = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });
    console.log(`Deleted ${result.deletedCount} old audit logs`);
    return result;
  } catch (error) {
    console.error('Delete old logs error:', error.message);
    return null;
  }
};

module.exports = {
  logAction,
  getActivities,
  getActivityStats,
  deleteOldLogs
};