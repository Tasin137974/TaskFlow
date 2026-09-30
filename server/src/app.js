const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind Render/Heroku-style proxies, so rate limiting sees real IPs
  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, skip: () => env.isTest })
  );

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', require('./routes/auth.routes'));
  app.use('/api/tasks', require('./routes/task.routes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
