const User = require('../models/User');
const VaultEntry = require('../models/VaultEntry');
const StorageFile = require('../models/StorageFile');
const { decrypt } = require('../utils/encryption');
const { logAction } = require('../services/auditService');

// Mobile Login (optimized)
const mobileLogin = async (req, res) => {
  try {
    const { email, password, deviceId, deviceName = 'Mobile Device' } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    // Save device for mobile
    await user.addDevice(deviceId || 'mobile', deviceName, refreshToken);
    user.lastLogin = new Date();
    await user.save();

    // Mobile-optimized response
    res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mobile Dashboard
const mobileDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [vaultCount, fileCount, storageUsed, storageQuota] = await Promise.all([
      VaultEntry.countDocuments({ userId }),
      StorageFile.countDocuments({ userId }),
      req.user.storageUsed || 0,
      req.user.storageQuota || 2 * 1024 * 1024 * 1024
    ]);

    res.status(200).json({
      success: true,
      data: {
        vaultCount,
        fileCount,
        storage: {
          used: storageUsed,
          quota: storageQuota,
          percentage: (storageUsed / storageQuota) * 100
        },
        accountType: req.user.accountType,
        isActive: req.user.isActive
      }
    });
  } catch (error) {
    console.error('Mobile dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mobile get vault (optimized for mobile)
const mobileGetVault = async (req, res) => {
  try {
    const { limit = 20, offset = 0, search = '' } = req.query;

    const filter = { userId: req.user._id };
    if (search) {
      filter.$or = [
        { siteName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const [entries, total] = await Promise.all([
      VaultEntry.find(filter)
        .sort({ isFavorite: -1, updatedAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .select('siteName username url isFavorite updatedAt'),
      VaultEntry.countDocuments(filter)
    ]);

    // Decrypt passwords for mobile
    const decryptedEntries = entries.map(entry => ({
      id: entry._id,
      siteName: entry.siteName,
      username: entry.username,
      password: decrypt(entry.password),
      url: entry.url,
      isFavorite: entry.isFavorite,
      updatedAt: entry.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        entries: decryptedEntries,
        total,
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Mobile get vault error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mobile get files
const mobileGetFiles = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const files = await StorageFile.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('fileName originalName fileSize mimeType createdAt');

    res.status(200).json({
      success: true,
      data: {
        files,
        total: await StorageFile.countDocuments({ userId: req.user._id })
      }
    });
  } catch (error) {
    console.error('Mobile get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Biometric login (Fingerprint/Face ID)
const biometricLogin = async (req, res) => {
  try {
    const { userId, biometricKey } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store biometric key for user
    user.biometricKey = biometricKey;
    await user.save();

    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    });
  } catch (error) {
    console.error('Biometric login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Push notification subscription
const registerPushToken = async (req, res) => {
  try {
    const { pushToken, deviceType } = req.body;

    const user = req.user;
    if (!user.pushTokens) user.pushTokens = [];
    user.pushTokens.push({
      token: pushToken,
      deviceType: deviceType || 'mobile',
      createdAt: new Date()
    });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Push token registered'
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Sync data for mobile
const mobileSync = async (req, res) => {
  try {
    const { lastSync, vaultVersion, filesVersion } = req.body;

    const userId = req.user._id;

    // Get updated vault entries
    const vaultQuery = { userId };
    if (lastSync) {
      vaultQuery.updatedAt = { $gt: new Date(lastSync) };
    }

    const [vaultEntries, files] = await Promise.all([
      VaultEntry.find(vaultQuery)
        .select('siteName username password url notes tags isFavorite updatedAt'),
      StorageFile.find({ userId }).select('fileName originalName fileSize mimeType updatedAt')
    ]);

    const decryptedVault = vaultEntries.map(entry => ({
      ...entry.toObject(),
      password: decrypt(entry.password)
    }));

    res.status(200).json({
      success: true,
      data: {
        vault: decryptedVault,
        files,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Mobile sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  mobileLogin,
  mobileDashboard,
  mobileGetVault,
  mobileGetFiles,
  biometricLogin,
  registerPushToken,
  mobileSync
};