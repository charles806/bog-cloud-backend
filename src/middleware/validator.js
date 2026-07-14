const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('accountType')
    .optional()
    .isIn(['individual', 'enterprise', 'trial'])
    .withMessage('Invalid account type')
];

/**
 * Validation rules for login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for updating profile
 */
const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
];

/**
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => err.msg);
  next(new ValidationError('Validation failed', extractedErrors));
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validate
};