// Environment configuration. All values have safe local defaults so `npm start` works out of the box.
const toInt = (v, d) => (Number.isFinite(Number.parseInt(v, 10)) ? Number.parseInt(v, 10) : d);

const config = Object.freeze({
  port: toInt(process.env.PORT, 3000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  seedOnStart: (process.env.SEED_ON_START || 'true') !== 'false',
  env: process.env.NODE_ENV || 'development',
});

module.exports = config;
