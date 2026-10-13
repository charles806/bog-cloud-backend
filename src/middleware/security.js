// src/middleware/security.js
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Security middleware setup:
 *  - Helmet security headers
 *  - CORS with strict allowlist from config.corsOrigin
 *  - gzip compression
 *  - Trust proxy (Vercel/Render/Heroku)
 *  - Request/response timeouts
 */
const setupSecurity = (app) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  const rawOrigin = config.corsOrigin || process.env.CORS_ORIGIN || '';
  const allowedOrigins = rawOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const staticOrigins = [
    'https://bog-cloud.vercel.app',
    'https://bog-cloud-backend.vercel.app',
    'https://bogcloud.cv',
    'https://www.bogcloud.cv',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4000',
  ];
  staticOrigins.forEach((o) => {
    if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
  });

  logger.info(`[CORS] Allowed origins: ${allowedOrigins.join(', ') || '(none configured)'}`);

  if (allowedOrigins.length === 0 && config.isProduction) {
    logger.error('[CORS] FATAL: No CORS origins configured in production!');
  }

  const corsOptionsDelegate = (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0 && !config.isProduction) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (/^https:\/\/bog-cloud[a-z0-9-]*\.vercel\.app$/i.test(origin)) {
      return callback(null, true);
    }

    if (/^https:\/\/([a-z0-9-]+\.)?bogcloud\.cv$/i.test(origin)) {
      return callback(null, true);
    }

    logger.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  };

  const corsOptions = {
    origin: corsOptionsDelegate,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Request-Id', 'Set-Cookie'],
    optionsSuccessStatus: 200,
    maxAge: 86400,
  };

  // cors() already answers OPTIONS preflight.
  // Do NOT add app.options('*', ...) — Express 5 / path-to-regexp v8 crashes on it.
  app.use(cors(corsOptions));

  app.use(compression());

  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use((req, res, next) => {
    req.setTimeout(30000);
    res.setTimeout(30000);
    next();
  });

  app.disable('x-powered-by');
};

module.exports = setupSecurity;
