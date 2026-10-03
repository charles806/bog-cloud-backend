// src/config/env.js
require('dotenv').config();

/**
 * Centralized environment configuration.
 * Validates required variables on startup so misconfiguration
 * fails loudly instead of silently breaking at runtime.
 */

const required = (key, fallback) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`[ENV] Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, fallback = '') => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

const nodeEnv = optional('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';

// In production, CORS_ORIGIN is required. In dev, fall back to localhost.
const corsOrigin = isProduction
  ? required('CORS_ORIGIN')
  : optional('CORS_ORIGIN', 'http://localhost:3000,http://localhost:5173');

const config = {
  nodeEnv,
  isProduction,
  port: parseInt(optional('PORT', '5000'), 10),

  // Database
  mongoUri: required('MONGODB_URI'),

  // CORS — comma-separated list of allowed origins
  corsOrigin,

  // Auth (adjust to your actual keys)
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  // Email
  sendgridApiKey: optional('SENDGRID_API_KEY'),
  emailFrom: optional('EMAIL_FROM', 'no-reply@bogcloud.com'),

  // Logging
  logLevel: optional('LOG_LEVEL', isProduction ? 'info' : 'debug'),

  // Rate limiting
  rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMax: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
};

// Freeze to prevent accidental mutation
module.exports = Object.freeze(config);
