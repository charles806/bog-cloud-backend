const { getActivities, getActivityStats } = require('./auditService');
const AuditLog = require('../models/AuditLog');

const generateReport = async (options = {}) => {
  try {
    const {
      format = 'json',
      fromDate,
      toDate,
      userId,
      action,
      limit = 1000
    } = options;

    const logs = await AuditLog.find({
      ...(userId && { userId }),
      ...(action && { action }),
      ...(fromDate && { createdAt: { $gte: new Date(fromDate) } }),
      ...(toDate && { createdAt: { $lte: new Date(toDate) } })
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName email');

    const stats = await getActivityStats(fromDate, toDate);

    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: {
        from: fromDate || 'All time',
        to: toDate || 'Now'
      },
      statistics: stats,
      logs: logs.map(log => ({
        timestamp: log.createdAt,
        user: log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : log.userEmail,
        email: log.userEmail,
        action: log.action,
        resource: log.resourceName,
        ip: log.ipAddress,
        device: log.deviceName,
        status: log.status,
        details: log.details
      }))
    };

    return report;
  } catch (error) {
    console.error('Generate report error:', error.message);
    return null;
  }
};

const generateDailyReport = async (date) => {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await generateReport({
    fromDate: startOfDay,
    toDate: endOfDay
  });
};

const generateWeeklyReport = async (date) => {
  const targetDate = date || new Date();
  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return await generateReport({
    fromDate: startOfWeek,
    toDate: endOfWeek
  });
};

module.exports = {
  generateReport,
  generateDailyReport,
  generateWeeklyReport
};