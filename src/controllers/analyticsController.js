const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const VaultEntry = require('../models/VaultEntry');
const StorageFile = require('../models/StorageFile');
const Payment = require('../models/Payment');

// Dashboard Overview
const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      totalStorageUsed,
      totalVaultEntries,
      totalPayments,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ suspendedAt: { $ne: null } }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$storageUsed' } } }]),
      VaultEntry.countDocuments(),
      Payment.countDocuments({ status: 'completed' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Daily signups for chart
    const dailySignups = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Dashboard overview retrieved',
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          active: activeUsers,
          suspended: suspendedUsers,
          recentSignups
        },
        storage: {
          totalUsed: totalStorageUsed[0]?.total || 0,
          totalQuota: totalUsers * 2 * 1024 * 1024 * 1024 // approximate
        },
        vault: {
          totalEntries: totalVaultEntries
        },
        revenue: {
          totalPayments: totalPayments,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        chart: {
          dailySignups
        }
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// User Analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const days = parseInt(timeframe) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User growth
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User roles breakdown
    const roles = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Account types breakdown
    const accountTypes = await User.aggregate([
      {
        $group: {
          _id: '$accountType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Active vs inactive
    const status = await User.aggregate([
      {
        $group: {
          _id: {
            isActive: '$isActive',
            isSuspended: { $cond: [{ $ne: ['$suspendedAt', null] }, true, false] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'User analytics retrieved',
      data: {
        growth: userGrowth,
        roles,
        accountTypes,
        status,
        totalUsers: await User.countDocuments()
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Activity Analytics
const getActivityAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const days = parseInt(timeframe) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total actions by type
    const actionsByType = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Daily activity
    const dailyActivity = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top active users
    const topUsers = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userEmail',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Login vs other actions
    const loginStats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            action: '$action',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Activity analytics retrieved',
      data: {
        actionsByType,
        dailyActivity,
        topUsers,
        loginStats,
        totalActivities: await AuditLog.countDocuments({ createdAt: { $gte: startDate } })
      }
    });
  } catch (error) {
    console.error('Activity analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Storage Analytics
const getStorageAnalytics = async (req, res) => {
  try {
    // Total storage used
    const totalStorage = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsed: { $sum: '$storageUsed' },
          totalQuota: { $sum: '$storageQuota' }
        }
      }
    ]);

    // Storage by user (top 10)
    const topUsers = await User.find()
      .select('email firstName lastName storageUsed storageQuota')
      .sort({ storageUsed: -1 })
      .limit(10);

    // File types breakdown
    const fileTypes = await StorageFile.aggregate([
      {
        $group: {
          _id: '$mimeType',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Storage usage over time
    const storageGrowth = await StorageFile.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Storage analytics retrieved',
      data: {
        total: {
          used: totalStorage[0]?.totalUsed || 0,
          quota: totalStorage[0]?.totalQuota || 0,
          percentage: totalStorage[0]?.totalQuota > 0 
            ? (totalStorage[0].totalUsed / totalStorage[0].totalQuota) * 100 
            : 0
        },
        topUsers,
        fileTypes,
        growth: storageGrowth
      }
    });
  } catch (error) {
    console.error('Storage analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Payment Analytics (when payment is integrated)
const getPaymentAnalytics = async (req, res) => {
  try {
    // Check if Payment model exists
    let totalRevenue = 0;
    let totalPayments = 0;
    let paymentStats = [];

    try {
      const Payment = require('../models/Payment');
      const revenue = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      totalRevenue = revenue[0]?.total || 0;

      totalPayments = await Payment.countDocuments({ status: 'completed' });

      paymentStats = await Payment.aggregate([
        {
          $match: { status: 'completed' }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (error) {
      console.log('Payment model not found yet');
    }

    // Get users with paid plans
    const paidUsers = await User.countDocuments({
      accountType: { $in: ['individual', 'enterprise'] }
    });

    res.status(200).json({
      success: true,
      message: 'Payment analytics retrieved',
      data: {
        totalRevenue,
        totalPayments,
        paidUsers,
        monthlyStats: paymentStats
      }
    });
  } catch (error) {
    console.error('Payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export Report
const exportReport = async (req, res) => {
  try {
    const { format = 'json', reportType = 'overview' } = req.query;

    let reportData = {};

    switch (reportType) {
      case 'overview':
        const overview = await getDashboardOverviewData();
        reportData = overview;
        break;
      case 'users':
        const users = await User.find().select('-passwordHash -refreshTokens');
        reportData = { users };
        break;
      case 'activity':
        const activities = await AuditLog.find()
          .sort({ createdAt: -1 })
          .limit(1000);
        reportData = { activities };
        break;
      case 'storage':
        const storage = await StorageFile.find().populate('userId', 'email');
        reportData = { storage };
        break;
      default:
        reportData = { message: 'Invalid report type' };
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${Date.now()}.json`);
      return res.status(200).json(reportData);
    }

    if (format === 'csv') {
      // Simple CSV conversion
      let csv = '';
      if (reportType === 'users' && reportData.users) {
        csv = 'Email,Name,Role,AccountType,Status,CreatedAt\n';
        reportData.users.forEach(user => {
          csv += `${user.email},${user.firstName} ${user.lastName},${user.role},${user.accountType},${user.isActive ? 'Active' : 'Inactive'},${user.createdAt}\n`;
        });
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    res.status(400).json({
      success: false,
      message: 'Format must be json or csv'
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function for overview data
const getDashboardOverviewData = async () => {
  const [
    totalUsers,
    totalAdmins,
    activeUsers,
    suspendedUsers,
    totalStorageUsed,
    totalVaultEntries
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ suspendedAt: { $ne: null } }),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$storageUsed' } } }]),
    VaultEntry.countDocuments()
  ]);

  return {
    users: {
      total: totalUsers,
      admins: totalAdmins,
      active: activeUsers,
      suspended: suspendedUsers
    },
    storage: {
      totalUsed: totalStorageUsed[0]?.total || 0
    },
    vault: {
      totalEntries: totalVaultEntries
    }
  };
};

module.exports = {
  getDashboardOverview,
  getUserAnalytics,
  getActivityAnalytics,
  getStorageAnalytics,
  getPaymentAnalytics,
  exportReport
};