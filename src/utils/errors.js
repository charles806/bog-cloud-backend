/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Error (401)
 */
class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthError';
  }
}

/**
 * Authorization Error (403)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Conflict Error (409)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

module.exports = {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError
};