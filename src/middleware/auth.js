const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { AuthError } = require('../utils/errors');

/**
 * Protect routes - requires valid JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Get token from cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthError('No token provided. Please log in.');
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      throw new AuthError('Invalid or expired token. Please log in again.');
    }

    // Find user
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
    if (!user) {
      throw new AuthError('User no longer exists.');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthError('Your account has been deactivated.');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userEmail = user.email;
    req.token = token;
    req.tokenData = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication - doesn't throw error if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      }
    }

    // ✅ FIXED: Call next() without any arguments (no error)
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthError('Authentication required'));
    }

    // Check if user's account type is allowed
    if (!roles.includes(req.user.accountType)) {
      return next(new AuthError('Insufficient permissions'));
    }

    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo
};