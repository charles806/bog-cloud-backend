// const User = require('../models/User');
// const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
// const { successResponse } = require('../utils/response');
// const { AuthError } = require('../utils/errors');
// const { verifyToken } = require('../utils/mfa');
// const crypto = require('crypto');
// const { logAction } = require('../services/auditService');
// const emailService = require('../services/emailService')
// const VerificationToken = require('../models/VerificationToken')
// const { sendVerificationEmail } = require('../services/emailService');
// const { ConflictError } = require('../utils/errors');
//  // adjust path
// const login = async (req, res, next) => {
//   try {
//     const { email, password, deviceName = 'Unknown Device', totpCode } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     if (!user.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Your account has been deactivated'
//       });
//     }

//     if (user.suspendedAt) {
//       return res.status(403).json({
//         success: false,
//         message: `Account suspended. Reason: ${user.suspendedReason || 'No reason provided'}`
//       });
//     }

//     const isValid = await user.comparePassword(password);
//     if (!isValid) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Admin MFA Check
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       if (!user.mfaEnabled || !user.mfaSecret) {
//         return res.status(403).json({
//           success: false,
//           message: 'Admin must set up MFA before logging in',
//           requiresMfaSetup: true
//         });
//       }

//       if (!totpCode) {
//         return res.status(403).json({
//           success: false,
//           message: 'MFA code required for admin access',
//           requiresMfa: true
//         });
//       }

//       const isValidMfa = verifyToken(user.mfaSecret, totpCode);
//       if (!isValidMfa) {
//         return res.status(403).json({
//           success: false,
//           message: 'Invalid MFA code'
//         });
//       }
//     }

//     // Generate tokens
//     const expiresIn = (user.role === 'admin' || user.role === 'super_admin') ? '1h' : '7d';
//     const accessToken = generateAccessToken(user._id, user.email, expiresIn);
//     const refreshToken = generateRefreshToken(user._id);
//     const refreshTokenExpiry = new Date();
//     refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

//     const deviceId = crypto.randomBytes(16).toString('hex');

//     await user.addDevice(deviceId, deviceName, refreshToken);
//     await user.addRefreshToken(refreshToken, refreshTokenExpiry, deviceId);

//     user.lastLogin = new Date();
//     await user.save();

//     const maxAge = (user.role === 'admin' || user.role === 'super_admin')
//       ? 60 * 60 * 1000
//       : 7 * 24 * 60 * 60 * 1000;

//     res.cookie('accessToken', accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge
//     });

//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 30 * 24 * 60 * 60 * 1000
//     });

//     res.json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         user: user.toPublicJSON(),
//         accessToken,
//         refreshToken,
//         deviceId,
//         expiresIn: (user.role === 'admin' || user.role === 'super_admin') ? '1h' : '7d'
//       },
//       timestamp: new Date().toISOString()
//     });

// await logAction({
//   userId: user._id,
//   userEmail: user.email,
//   userRole: user.role,
//   action: 'login',
//   resourceType: 'user',
//   resourceName: `${user.firstName} ${user.lastName}`,
//   ipAddress: req.ip,
//   userAgent: req.headers['user-agent'],
//   deviceName: deviceName,
//   status: 'success'
// })

//   } catch (error) {
//     next(error);
//   }
// };
// const register = async (req, res, next) => {
//   try {
//     const { email, password, firstName, lastName, accountType = 'trial' } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       throw new ConflictError('User with this email already exists');
//     }

//     const user = await User.create({
//       email,
//       passwordHash: password,
//       firstName,
//       lastName,
//       accountType,
//       role: 'user',
//       isEmailVerified: false
//     });

//     // Generate verification token
//     const token = crypto.randomBytes(32).toString('hex');
//     const expiresAt = new Date();
//     expiresAt.setHours(expiresAt.getHours() + 24);

//     await VerificationToken.create({
//       userId: user._id,
//       token,
//       type: 'email_verification',
//       expiresAt
//     });

//     try {
//       await emailService.sendVerificationEmail(user.email, user.firstName, token);
//       console.log(`Verification email sent to ${user.email}`);
//     } catch (emailError) {
//       console.error('Failed to send verification email:', emailError.message);
//     }

//     const accessToken = generateAccessToken(user._id, user.email);
//     const refreshToken = generateRefreshToken(user._id);
//     const refreshTokenExpiry = new Date();
//     refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

//     await user.addRefreshToken(refreshToken, refreshTokenExpiry, 'initial-setup');

//     await logAction({
//       userId: user._id,
//       userEmail: user.email,
//       userRole: user.role,
//       action: 'register',
//       resourceType: 'user',
//       resourceName: `${user.firstName} ${user.lastName}`,
//       ipAddress: req.ip,
//       userAgent: req.headers['user-agent'],
//       status: 'success'
//     });

//     res.cookie('accessToken', accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 30 * 24 * 60 * 60 * 1000
//     });

//     res.status(201).json({
//       success: true,
//       statusCode: 201,
//       message: 'Registration successful. Please check your email to verify your account.',
//       data: {
//         user: user.toPublicJSON(),
//         accessToken,
//         refreshToken,
//         requiresVerification: true
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     next(error);
//   }
// };
// const logout = async (req, res, next) => {
//   try {
//     const { deviceId } = req.body;

//     if (deviceId && req.user) {
//       await req.user.removeDevice(deviceId);
//     } else if (req.user) {
//       req.user.devices = [];
//       req.user.refreshTokens = [];
//       await req.user.save();
//     }

//     // Audit log for logout
//     if (req.user) {
//       await logAction({
//         userId: req.user._id,
//         userEmail: req.user.email,
//         userRole: req.user.role,
//         action: 'logout',
//         resourceType: 'user',
//         resourceName: `${req.user.firstName} ${req.user.lastName}`,
//         ipAddress: req.ip,
//         userAgent: req.headers['user-agent'],
//         status: 'success'
//       });
//     }

//     res.clearCookie('accessToken');
//     res.clearCookie('refreshToken');

//     res.json({
//       success: true,
//       message: 'Logged out successfully',
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     next(error);
//   }
// };


// const refreshToken = async (req, res, next) => {
//   try {
//     let refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

//     if (!refreshToken) {
//       return res.status(401).json({
//         success: false,
//         message: 'Refresh token required'
//       });
//     }

//     const decoded = verifyRefreshToken(refreshToken);
//     if (!decoded) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid or expired refresh token'
//       });
//     }

//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     const isValidToken = user.refreshTokens.some(t => t.token === refreshToken);
//     if (!isValidToken) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid refresh token'
//       });
//     }

//     const newAccessToken = generateAccessToken(user._id, user.email);

//     res.cookie('accessToken', newAccessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     res.json({
//       success: true,
//       message: 'Token refreshed successfully',
//       data: { accessToken: newAccessToken },
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getMe = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'User profile retrieved successfully',
//       data: { user: req.user.toPublicJSON() },
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   register,
//   login,
//   logout,
//   refreshToken,
//   getMe
// };

const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { successResponse } = require('../utils/response');
const { AuthError } = require('../utils/errors');
const crypto = require('crypto');
const { logAction } = require('../services/auditService');
const emailService = require('../services/emailService');
const VerificationToken = require('../models/VerificationToken');
const { ConflictError } = require('../utils/errors');

const login = async (req, res, next) => {
  try {
    const { email, password, deviceName = 'Unknown Device' } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    if (user.suspendedAt) {
      return res.status(403).json({
        success: false,
        message: `Account suspended. Reason: ${user.suspendedReason || 'No reason provided'}`
      });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const expiresIn = '7d';
    const accessToken = generateAccessToken(user._id, user.email, expiresIn);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

    const deviceId = crypto.randomBytes(16).toString('hex');

    await user.addDevice(deviceId, deviceName, refreshToken);
    await user.addRefreshToken(refreshToken, refreshTokenExpiry, deviceId);

    user.lastLogin = new Date();
    await user.save();

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    await logAction({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'login',
      resourceType: 'user',
      resourceName: `${user.firstName} ${user.lastName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceName: deviceName,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toPublicJSON(),
        accessToken,
        refreshToken,
        deviceId,
        isAdmin: user.role === 'admin' || user.role === 'super_admin'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, accountType = 'trial' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const user = await User.create({
      email,
      passwordHash: password,
      firstName,
      lastName,
      accountType,
      role: 'user',
      isEmailVerified: false
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await VerificationToken.create({
      userId: user._id,
      token,
      type: 'email_verification',
      expiresAt
    });

    try {
      await emailService.sendVerificationEmail(user.email, user.firstName, token);
      console.log(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
    }

    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

    await user.addRefreshToken(refreshToken, refreshTokenExpiry, 'initial-setup');

    await logAction({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'register',
      resourceType: 'user',
      resourceName: `${user.firstName} ${user.lastName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: user.toPublicJSON(),
        accessToken,
        refreshToken,
        requiresVerification: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { deviceId } = req.body;

    if (deviceId && req.user) {
      await req.user.removeDevice(deviceId);
    } else if (req.user) {
      req.user.devices = [];
      req.user.refreshTokens = [];
      await req.user.save();
    }

    if (req.user) {
      await logAction({
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'logout',
        resourceType: 'user',
        resourceName: `${req.user.firstName} ${req.user.lastName}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    let refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidToken = user.refreshTokens.some(t => t.token === refreshToken);
    if (!isValidToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const newAccessToken = generateAccessToken(user._id, user.email);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: newAccessToken },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user: req.user.toPublicJSON() },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe
};

