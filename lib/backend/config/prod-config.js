// Production configuration fallbacks
// This file provides default values for production when .env is not configured

const prodConfig = {
  NODE_ENV: 'production',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/qorscend',
  JWT_SECRET: process.env.JWT_SECRET || 'production-jwt-secret-key-change-this',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DEV_CONTINUE_WITHOUT_DB: 'false',
  DEV_BYPASS_AUTH: 'false',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://www.qorscend.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://www.qorscend.com',
  BASE_URL: process.env.BASE_URL || 'https://qorscend-backend.onrender.com',
  PORT: process.env.PORT || 5000
};

module.exports = prodConfig;
