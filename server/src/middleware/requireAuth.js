const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.token || (header && header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) throw new AppError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, 'Your session has expired. Log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'Authentication required');

  req.user = user;
  next();
});
