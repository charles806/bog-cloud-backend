const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user: req.user.toPublicJSON() }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const user = req.user;

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toPublicJSON() }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const user = req.user;

//     const isValid = await user.comparePassword(currentPassword);
//     if (!isValid) {
//       return res.status(401).json({
//         success: false,
//         message: 'Current password is incorrect'
//       });
//     }
//     const users = await User.findById(req.user._id);
//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password must be at least 8 characters'
//       });
//     }

//     user.passwordHash = newPassword;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Password changed successfully'
//     });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('devices');
    const devices = user.devices || [];
    res.status(200).json({
      success: true,
      message: 'Devices retrieved successfully',
      data: { devices, count: devices.length }
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const revokeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = req.user;

    const deviceExists = (user.devices || []).some(d => d.deviceId === deviceId);
    if (!deviceExists) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    await user.removeDevice(deviceId);
    res.status(200).json({
      success: true,
      message: 'Device revoked successfully'
    });
  } catch (error) {
    console.error('Revoke device error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const revokeAllDevices = async (req, res) => {
  try {
    const user = req.user;
    user.devices = [];
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'All devices revoked successfully'
    });
  } catch (error) {
    console.error('Revoke all devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    const user = await User.findById(req.user._id);

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    user.isActive = false;
    user.deletedAt = new Date();
    user.email = `deleted_${user._id}_${user.email}`;
    await user.save();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const user = req.user;
    const stats = {
      storageUsed: user.storageUsed,
      storageQuota: user.storageQuota,
      storagePercentage: (user.storageUsed / user.storageQuota) * 100,
      deviceCount: (user.devices || []).length,
      accountType: user.accountType,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt
    };
    res.status(200).json({
      success: true,
      message: 'User statistics retrieved',
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getDevices,
  revokeDevice,
  revokeAllDevices,
  deleteAccount,
  getUserStats
};