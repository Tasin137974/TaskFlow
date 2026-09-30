require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  bcryptRounds: nodeEnv === 'test' ? 4 : 12,
  tokenMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
};
