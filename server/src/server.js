const mongoose = require('mongoose');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const createApp = require('./app');

async function main() {
  if (!env.mongoUri) throw new Error('MONGO_URI is not set');
  if (!env.jwtSecret) throw new Error('JWT_SECRET is not set');
  if (env.isProd && env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');

  await connectDb(env.mongoUri);
  const server = createApp().listen(env.port, () => console.log(`API listening on port ${env.port}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
