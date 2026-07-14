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

setupSecurity(app);

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use(logRequest);

app.use(generalLimiter);

app.use('/api/v1', routes);

app.use('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = config.port;

const server = http.createServer(app);

const io = initSocket(server);

server.listen(PORT, () => {
  console.log(` BOG Cloud Backend running on http://localhost:${PORT}`);
  console.log(` API Documentation: http://localhost:${PORT}/api/v1`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Health Check: http://localhost:${PORT}/health`);
  console.log(` WebSocket: ws://localhost:${PORT}/sync`);
  console.log('\n All requests will be logged in this terminal!\n');
});

process.on('SIGTERM', () => {
  console.log(' SIGTERM received. Shutting down gracefully...');
  if (io) io.close();
  server.close(() => {
    console.log(' Server closed');
    process.exit(0);
  });
});

module.exports = app;