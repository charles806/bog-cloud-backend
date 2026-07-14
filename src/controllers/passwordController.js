const User = require('../models/User');
const OTP = require('../models/OTP');
const emailService = require('../services/emailService');  // ✅ IMPORT THE WHOLE SERVICE
const crypto = require('crypto');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found'
      });
    }

    const recentOTP = await OTP.findOne({
      email,
      purpose: 'password_reset',
      used: false,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 5 minutes before requesting another OTP'
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await OTP.create({
      email,
      otp,
      purpose: 'password_reset',
      expiresAt
    });

    const emailResult = await emailService.sendOTPEmail(email, otp, 'password_reset');
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Valid for 10 minutes.',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const otpRecord = await OTP.findOne({
      email,
      otp,
      purpose: 'password_reset',
      used: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    otpRecord.used = true;
    await otpRecord.save();

    const resetToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOne({ email });
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken,
        expiresIn: '15 minutes'
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const user = await User.findOne({
      resetToken,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.passwordHash = newPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found'
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await OTP.create({
      email,
      otp,
      purpose: 'password_reset',
      expiresAt
    });

    const emailResult = await emailService.sendOTPEmail(email, otp, 'password_reset');
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  resendOTP
};