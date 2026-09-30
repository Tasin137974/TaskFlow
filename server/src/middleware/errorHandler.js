const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  let details = err.details;

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    status = 409;
    message = field === 'email' ? 'Email is already registered' : `Duplicate value for ${field}`;
    details = { [field]: 'Already in use' };
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  if (status >= 500) {
    if (!env.isTest) console.error(err);
    if (env.isProd) message = 'Something went wrong on our side';
  }

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
};

module.exports = { notFound, errorHandler };
