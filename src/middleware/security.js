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
  // ---------------------------------------------------------------
  // 1. Helmet — configure to not break CORS or the frontend
  // ---------------------------------------------------------------
  app.use(
    helmet({
      // Allow the frontend to read these headers on cross-origin responses
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // Disable CSP here; handle it at the frontend/CDN layer if needed
      contentSecurityPolicy: false,
    })
  );

  // ---------------------------------------------------------------
  // 2. CORS — parse origins from env, log them, allow preflight
  // ---------------------------------------------------------------
  const rawOrigin = config.corsOrigin || process.env.CORS_ORIGIN || '';
  const allowedOrigins = rawOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  logger.info(`[CORS] Allowed origins: ${allowedOrigins.join(', ') || '(none configured)'}`);

  if (allowedOrigins.length === 0 && config.isProduction) {
    logger.error('[CORS] FATAL: No CORS origins configured in production!');
  }

  const corsOptionsDelegate = (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // If nothing is configured (dev only), allow everything
    if (allowedOrigins.length === 0 && !config.isProduction) {
      return callback(null, true);
    }

    // Exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments for this project (optional)
    // Remove this block if you don't want preview URLs allowed.
    if (/^https:\/\/bog-cloud[a-z0-9-]*\.vercel\.app$/i.test(origin)) {
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
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    optionsSuccessStatus: 200, // Some browsers choke on 204
    maxAge: 86400, // Cache preflight for 24h
  };

  // Apply to all routes
  app.use(cors(corsOptions));

  // Explicitly answer preflight OPTIONS requests.
  // This MUST come before body parsers and route handlers.
  app.options('*', cors(corsOptions));

  // ---------------------------------------------------------------
  // 3. Compression
  // ---------------------------------------------------------------
  app.use(compression());

  // ---------------------------------------------------------------
  // 4. Trust proxy (required on Vercel/Render/Heroku for req.ip)
  // ---------------------------------------------------------------
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  // ---------------------------------------------------------------
  // 5. Request/response timeouts
  // ---------------------------------------------------------------
  app.use((req, res, next) => {
    req.setTimeout(30000);
    res.setTimeout(30000);
    next();
  });
};

module.exports = setupSecurity;
