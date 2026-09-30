const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/requireAuth');
const schemas = require('../validators/schemas');
const auth = require('../controllers/auth.controller');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { error: { message: 'Too many attempts. Try again in a few minutes.' } },
});

router.post('/register', authLimiter, validate({ body: schemas.register }), auth.register);
router.post('/login', authLimiter, validate({ body: schemas.login }), auth.login);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);

module.exports = router;
