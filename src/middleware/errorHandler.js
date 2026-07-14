const { AppError } = require('../utils/errors');
// const logger = require('../config/logger');/

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

console.error(' ERROR:', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.userId || 'unauthenticated'
  });


  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new AppError(message, 409);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = 'Validation failed';
    error = new AppError(message, 400);
    error.errors = errors;
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
  }

  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || null,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;