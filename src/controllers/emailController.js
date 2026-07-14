// const User = require('../models/User');
// const VerificationToken = require('../models/VerificationToken');
// const emailService = require('../services/emailService');
// const crypto = require('crypto');

// const sendVerificationEmail = async (req, res) => {
//   try {
//     const user = req.user;

//     if (user.isEmailVerified) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email already verified'
//       });
//     }

//     const token = crypto.randomBytes(32).toString('hex');
//     const expiresAt = new Date();
//     expiresAt.setHours(expiresAt.getHours() + 24);

//     await VerificationToken.create({
//       userId: user._id,
//       token,
//       type: 'email_verification',
//       expiresAt
//     });

//     await emailService.sendVerificationEmail(user.email, user.firstName, token);

//     res.status(200).json({
//       success: true,
//       message: 'Verification email sent successfully'
//     });
//   } catch (error) {
//     console.error('Send verification error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send verification email'
//     });
//   }
// };

// const verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.query;

//     if (!token) {
//       return res.status(400).json({
//         success: false,
//         message: 'Verification token required'
//       });
//     }

//     // ✅ FIX: now checks expiresAt too — previously an expired token still verified the user
//     const verificationToken = await VerificationToken.findOne({
//       token,
//       type: 'email_verification',
//       used: false,
//       expiresAt: { $gt: new Date() }
//     });

//     if (!verificationToken) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or expired verification token'
//       });
//     }

//     const user = await User.findById(verificationToken.userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     user.isEmailVerified = true;
//     await user.save();

//     verificationToken.used = true;
//     await verificationToken.save();

//     res.status(200).json({
//       success: true,
//       message: 'Email verified successfully'
//     });
//   } catch (error) {
//     console.error('Verify email error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to verify email'
//     });
//   }
// };

// const resendVerificationEmail = async (req, res) => {
//   try {
//     const user = req.user;

//     if (user.isEmailVerified) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email already verified'
//       });
//     }

//     // ✅ basic cooldown so this endpoint can't be spammed to flood someone's inbox
//     const recentToken = await VerificationToken.findOne({
//       userId: user._id,
//       type: 'email_verification',
//       createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
//     });

//     if (recentToken) {
//       return res.status(429).json({
//         success: false,
//         message: 'Please wait a minute before requesting another verification email'
//       });
//     }

//     const token = crypto.randomBytes(32).toString('hex');
//     const expiresAt = new Date();
//     expiresAt.setHours(expiresAt.getHours() + 24);

//     await VerificationToken.create({
//       userId: user._id,
//       token,
//       type: 'email_verification',
//       expiresAt
//     });

//     await emailService.sendVerificationEmail(user.email, user.firstName, token);

//     res.status(200).json({
//       success: true,
//       message: 'Verification email resent successfully'
//     });
//   } catch (error) {
//     console.error('Resend verification error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to resend verification email'
//     });
//   }
// };

// module.exports = {
//   sendVerificationEmail,
//   verifyEmail,
//   resendVerificationEmail
// };


const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const emailService = require('../services/emailService');
const crypto = require('crypto');

const sendVerificationEmail = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await VerificationToken.create({
      userId: user._id,
      token,
      type: 'email_verification',
      expiresAt
    });
    
    await emailService.sendVerificationEmail(user.email, user.firstName, token);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token required'
      });
    }
    
    const verificationToken = await VerificationToken.findOne({
      token,
      type: 'email_verification',
      used: false
    });
    
    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    if (verificationToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }
    
    const user = await User.findById(verificationToken.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isEmailVerified = true;
    await user.save();
    
    verificationToken.used = true;
    await verificationToken.save();
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await VerificationToken.create({
      userId: user._id,
      token,
      type: 'email_verification',
      expiresAt
    });
    
    await emailService.sendVerificationEmail(user.email, user.firstName, token);
    
    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};

module.exports = {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail
};