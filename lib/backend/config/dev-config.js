// Development configuration fallbacks
// This file provides default values for development when .env is not configured

const devConfig = {
  NODE_ENV: 'development', // Force development mode
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/qorscend',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-key-for-testing-only',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DEV_CONTINUE_WITHOUT_DB: 'false',
  DEV_BYPASS_AUTH: 'false',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  PORT: process.env.PORT || 5000
};

module.exports = devConfig;
