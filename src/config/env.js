const dotenv = require('dotenv');

// Empty strings block dotenv (it will not override). Treat "" as unset so .env can fill them.
if (process.env.ENCRYPTION_KEY === '') {
  delete process.env.ENCRYPTION_KEY;
}
dotenv.config();

const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXPIRES_IN',
  'SALT_ROUNDS',
  'CORS_ORIGIN',
  'ENCRYPTION_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

if (
  !process.env.ENCRYPTION_KEY ||
  process.env.ENCRYPTION_KEY.length !== 64 ||
  !/^[0-9a-fA-F]+$/.test(process.env.ENCRYPTION_KEY)
) {
  console.error('ENCRYPTION_KEY must be a 32-byte hex string (64 chars)');
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  NODE_ENV: process.env.NODE_ENV || 'development', // alias so emailService.js's config.NODE_ENV check works
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 12,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  APP_URL: process.env.APP_URL,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY
};
