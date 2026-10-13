const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const http = require('http');
const connectDB = require('./src/config/db');
const config = require('./src/config/env');
const setupSecurity = require('./src/middleware/security');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const logger = require('./src/config/logger');
const logRequest = require('./src/middleware/requestLogger');
const { initSocket } = require('./src/websocket/syncSocket');

const app = express();

connectDB();

// Security (helmet + CORS). Must be set up BEFORE routes.
setupSecurity(app);

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// App-level middleware
app.use(logRequest);
app.use(generalLimiter);

// Health check (before API routes so it's always reachable)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// 404 handler (must come AFTER all routes).
// NOTE: Express 5 syntax. Do not use app.use('*', ...) or app.all('*', ...).
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler (must be LAST)
app.use(errorHandler);

const PORT = config.port || 4000;

const server = http.createServer(app);

const io = initSocket(server);

server.listen(PORT, () => {
  console.log(`BOG Cloud Backend running on http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/v1`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`WebSocket: ws://localhost:${PORT}/sync`);
  console.log('\nAll requests will be logged in this terminal!\n');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (io) io.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // Force-exit if it hangs
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;