const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const cookieBase = () => ({ httpOnly: true, secure: env.isProd, sameSite: 'lax', path: '/' });

function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: Math.floor(env.tokenMaxAgeMs / 1000) });
  res.cookie('token', token, { ...cookieBase(), maxAge: env.tokenMaxAgeMs });
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash;
const getDummyHash = () => (dummyHash ||= bcrypt.hashSync('not-a-real-password', env.bcryptRounds));

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, 'Email is already registered', { email: 'Already registered' });
    throw err;
  }
  issueSession(res, user);
  res.status(201).json({ user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = await bcrypt.compare(password, user ? user.passwordHash : getDummyHash());
  if (!user || !matches) throw new AppError(401, 'Invalid email or password');
  issueSession(res, user);
  res.json({ user });
});

exports.logout = (_req, res) => {
  res.clearCookie('token', cookieBase());
  res.status(204).end();
};

exports.me = (req, res) => res.json({ user: req.user });
