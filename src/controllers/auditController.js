const { getActivities, getActivityStats, deleteOldLogs } = require('../services/auditService');
const { generateReport, generateDailyReport, generateWeeklyReport } = require('../services/reportService');
const { logAction } = require('../services/auditService');

const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, fromDate, toDate, limit, offset } = req.query;
    
    const result = await getActivities({
      userId,
      action,
      fromDate,
      toDate,
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved',
      data: result
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAuditStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const stats = await getActivityStats(fromDate, toDate);
    
    res.status(200).json({
      success: true,
      message: 'Audit statistics retrieved',
      data: stats
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { format = 'json', fromDate, toDate, reportType = 'custom' } = req.query;

    let report;
    if (reportType === 'daily') {
      report = await generateDailyReport(fromDate ? new Date(fromDate) : new Date());
    } else if (reportType === 'weekly') {
      report = await generateWeeklyReport(fromDate ? new Date(fromDate) : new Date());
    } else {
      report = await generateReport({ fromDate, toDate });
    }

    if (!report) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report'
      });
    }

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'password_exported',
      resourceType: 'user',
      resourceName: 'audit_report',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { format, reportType, fromDate, toDate }
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-report-${Date.now()}.json`);
      return res.status(200).json(report);
    }

    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=audit-report-${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      doc.fontSize(20).text('BOG Cloud - Audit Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Generated: ${report.generatedAt}`);
      doc.text(`Date Range: ${report.dateRange.from} to ${report.dateRange.to}`);
      doc.moveDown();
      
      doc.fontSize(16).text('Statistics', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Logins: ${report.statistics.totalLogins}`);
      doc.text(`Total Actions: ${report.statistics.totalActions}`);
      doc.text(`Unique Users: ${report.statistics.uniqueUsers}`);
      doc.moveDown();
      
      doc.fontSize(16).text('Recent Activity', { underline: true });
      doc.moveDown();
      
      const logsToShow = report.logs.slice(0, 20);
      logsToShow.forEach(log => {
        doc.fontSize(10).text(
          `${log.timestamp} | ${log.user} | ${log.action} | ${log.resource || 'N/A'} | ${log.status}`
        );
      });
      
      doc.end();
      return;
    }

    res.status(400).json({
      success: false,
      message: 'Format must be json or pdf'
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const cleanupOldLogs = async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const result = await deleteOldLogs(parseInt(days));
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old logs`,
      data: result
    });
  } catch (error) {
    console.error('Cleanup logs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getAuditLogs,
  getAuditStats,
  downloadReport,
  cleanupOldLogs
};