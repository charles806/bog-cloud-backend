const User = require('../models/User');
const VaultEntry = require('../models/VaultEntry');
const { decrypt } = require('../utils/encryption');
const { logAction } = require('../services/auditService');

const getCredentialsForSite = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Extract domain from URL
    const domain = new URL(url).hostname.replace('www.', '');
    console.log(` Extension checking site: ${domain}`);

    // Find credentials for this site
    const entries = await VaultEntry.find({
      userId: req.user._id,
      $or: [
        { url: { $regex: domain, $options: 'i' } },
        { siteName: { $regex: domain, $options: 'i' } }
      ]
    });

    // Decrypt passwords for extension
    const credentials = entries.map(entry => ({
      id: entry._id,
      siteName: entry.siteName,
      username: entry.username,
      password: decrypt(entry.password),
      url: entry.url
    }));

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'extension_auto_fill',
      resourceType: 'vault_entry',
      resourceName: domain,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { domain, count: credentials.length }
    });

    res.status(200).json({
      success: true,
      data: {
        domain,
        credentials,
        count: credentials.length
      }
    });
  } catch (error) {
    console.error('Extension get credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const saveCredentialsFromExtension = async (req, res) => {
  try {
    const { siteName, username, password, url } = req.body;
    const { encrypt } = require('../utils/encryption');

    if (!siteName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Site name and password are required'
      });
    }

    const encryptedPassword = encrypt(password);

    const entry = await VaultEntry.create({
      userId: req.user._id,
      siteName,
      username: username || '',
      password: encryptedPassword,
      url: url || '',
      tags: ['extension']
    });

    await logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'extension_save_credentials',
      resourceType: 'vault_entry',
      resourceName: siteName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Credentials saved from extension',
      data: entry
    });
  } catch (error) {
    console.error('Extension save credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const checkSiteHasCredentials = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const domain = new URL(url).hostname.replace('www.', '');
    const count = await VaultEntry.countDocuments({
      userId: req.user._id,
      $or: [
        { url: { $regex: domain, $options: 'i' } },
        { siteName: { $regex: domain, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        domain,
        hasCredentials: count > 0,
        count
      }
    });
  } catch (error) {
    console.error('Extension check site error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCredentialsForSite,
  saveCredentialsFromExtension,
  checkSiteHasCredentials
};