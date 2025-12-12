// Production configuration with fallbacks for Render deployment
// This ensures the app can start even with missing environment variables

const productionConfig = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 5000,
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/qorscend',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'production-jwt-secret-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://www.qorscend.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://www.qorscend.com',
  BASE_URL: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'https://qorscend-backend.onrender.com',
  
  // Development Flags (should be false in production)
  DEV_CONTINUE_WITHOUT_DB: process.env.DEV_CONTINUE_WITHOUT_DB || 'false',
  DEV_BYPASS_AUTH: process.env.DEV_BYPASS_AUTH || 'false',
  
  // OAuth Configuration (optional)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  
  // PayPal Configuration (optional)
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  PAYPAL_RETURN_URL: process.env.PAYPAL_RETURN_URL || 'https://www.qorscend.com/dashboard/billing',
  PAYPAL_CANCEL_URL: process.env.PAYPAL_CANCEL_URL || 'https://www.qorscend.com/dashboard/billing',
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

module.exports = productionConfig;
