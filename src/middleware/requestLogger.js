const AuditLog = require('../models/AuditLog');

const logRequest = async (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  const startTime = Date.now();

  // Override end function to log after response is sent
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;
    
    // Log to console with colors
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userEmail = req.user ? req.user.email : 'anonymous';
    const ip = req.ip || req.connection.remoteAddress;
    
    // Status color
    let statusColor = '\x1b[32m'; // Green (2xx)
    if (statusCode >= 400) statusColor = '\x1b[31m'; // Red (4xx/5xx)
    if (statusCode >= 300 && statusCode < 400) statusColor = '\x1b[33m'; // Yellow (3xx)
    
    // Method color
    let methodColor = '\x1b[36m'; // Cyan
    if (method === 'POST') methodColor = '\x1b[33m'; // Yellow
    if (method === 'PUT') methodColor = '\x1b[34m'; // Blue
    if (method === 'DELETE') methodColor = '\x1b[31m'; // Red
    if (method === 'PATCH') methodColor = '\x1b[35m'; // Magenta
    
    console.log(
      `[${new Date().toISOString()}]`,
      `${methodColor}${method}\x1b[0m`,
      `${url}`,
      `- ${userEmail}`,
      `${statusColor}${statusCode}\x1b[0m`,
      `${responseTime}ms`
    );
    
    // Save to database (async - don't block response)
    try {
      // Only log if user is authenticated or it's a login/register attempt
      if (req.user || url.includes('/auth/login') || url.includes('/auth/register')) {
        const action = getActionFromUrl(url, method);
        const resourceType = getResourceTypeFromUrl(url);
        
        const logData = {
          userId: req.user?._id || null,
          userEmail: userEmail,
          userRole: req.user?.role || 'user',
          action: action,
          resourceType: resourceType,
          resourceName: req.body?.siteName || req.body?.name || null,
          ipAddress: ip,
          userAgent: req.headers['user-agent'] || null,
          deviceName: req.body?.deviceName || 'unknown',
          details: {
            method: method,
            url: url,
            statusCode: statusCode,
            responseTime: responseTime,
            query: req.query,
            body: method !== 'GET' ? req.body : undefined
          },
          status: statusCode >= 400 ? 'failed' : 'success'
        };
        
        // Save asynchronously
        AuditLog.create(logData).catch(err => console.error('Audit log error:', err.message));
      }
    } catch (error) {
      // Silent fail for audit logging
    }
    
    originalEnd.apply(this, args);
  };

  next();
};

// Helper: Determine action from URL
const getActionFromUrl = (url, method) => {
  if (url.includes('/auth/register')) return 'register';
  if (url.includes('/auth/login')) return 'login';
  if (url.includes('/auth/logout')) return 'logout';
  if (url.includes('/auth/refresh')) return 'refresh_token';
  if (url.includes('/auth/me')) return 'view_profile';
  
  if (url.includes('/users/me')) {
    if (method === 'GET') return 'view_profile';
    if (method === 'PUT') return 'update_profile';
    if (method === 'DELETE') return 'delete_account';
  }
  if (url.includes('/users/me/password')) return 'change_password';
  if (url.includes('/users/devices')) {
    if (method === 'GET') return 'view_devices';
    if (method === 'DELETE') return 'revoke_device';
  }
  if (url.includes('/users/stats')) return 'view_stats';
  
  if (url.includes('/vault/entries')) {
    if (method === 'POST') return 'password_saved';
    if (method === 'GET') return 'password_viewed';
    if (method === 'PUT') return 'password_updated';
    if (method === 'DELETE') return 'password_deleted';
  }
  if (url.includes('/vault/folders')) {
    if (method === 'POST') return 'folder_created';
    if (method === 'GET') return 'folder_viewed';
    if (method === 'DELETE') return 'folder_deleted';
  }
  if (url.includes('/vault/favorites')) return 'view_favorites';
  if (url.includes('/vault/search')) return 'search_passwords';
  if (url.includes('/vault/generate')) return 'generate_password';
  if (url.includes('/vault/export')) return 'export_passwords';
  if (url.includes('/vault/import')) return 'import_passwords';
  if (url.includes('/vault/bulk/delete')) return 'bulk_delete';
  if (url.includes('/vault/bulk/move')) return 'bulk_move';
  if (url.includes('/vault/check-strength')) return 'check_password_strength';
  
  if (url.includes('/mfa/setup')) return 'mfa_setup';
  if (url.includes('/mfa/verify')) return 'mfa_verify';
  if (url.includes('/mfa/disable')) return 'mfa_disable';
  
  if (url.includes('/admin/users')) {
    if (method === 'GET' && url.includes('/admin/users/')) return 'view_user_details';
    if (method === 'GET') return 'view_all_users';
    if (method === 'DELETE') return 'delete_user';
  }
  if (url.includes('/admin/users/') && url.includes('/assign-admin')) return 'assign_admin';
  if (url.includes('/admin/users/') && url.includes('/remove-admin')) return 'remove_admin';
  if (url.includes('/admin/users/') && url.includes('/suspend')) return 'suspend_user';
  if (url.includes('/admin/users/') && url.includes('/unsuspend')) return 'unsuspend_user';
  if (url.includes('/admin/users/') && url.includes('/role')) return 'update_user_role';
  if (url.includes('/admin/stats')) return 'view_admin_stats';
  
  if (url.includes('/audit/logs')) return 'view_audit_logs';
  if (url.includes('/audit/stats')) return 'view_audit_stats';
  if (url.includes('/audit/download')) return 'download_report';
  if (url.includes('/audit/cleanup')) return 'cleanup_logs';
  
  if (url.includes('/health') || url.includes('/ping')) return 'health_check';
  
  return 'unknown';
};

const getResourceTypeFromUrl = (url) => {
  if (url.includes('/auth')) return 'auth';
  if (url.includes('/users')) return 'user';
  if (url.includes('/vault')) return 'vault_entry';
  if (url.includes('/mfa')) return 'mfa';
  if (url.includes('/admin')) return 'admin_action';
  if (url.includes('/audit')) return 'audit';
  return 'other';
};

module.exports = logRequest;