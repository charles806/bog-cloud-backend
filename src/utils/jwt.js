const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateAccessToken = (userId, email, expiresIn) => {
  return jwt.sign(
    { userId, email },
    config.jwtSecret,
    { expiresIn: expiresIn || config.jwtExpiresIn }
  );
};



const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiresIn }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.refreshTokenSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};