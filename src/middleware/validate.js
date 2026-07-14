const { validationResult } = require('express-validator');

/**
 * Validation middleware that returns response directly
 * This avoids the "next is not a function" error
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => err.msg);
  
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors
  });
};

module.exports = validate;