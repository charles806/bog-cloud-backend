const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('../config/env');

/**
 * Security middleware setup
 */
const setupSecurity = (app) => {
  app.use(helmet());
  
  app.use(cors({
    origin: config.corsOrigin.split(','),
    credentials: true,
    optionsSuccessStatus: 200
  }));

  app.use(compression());

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use((req, res, next) => {
    req.setTimeout(30000); // 30 seconds
    res.setTimeout(30000);
    next();
  });
};

module.exports = setupSecurity;