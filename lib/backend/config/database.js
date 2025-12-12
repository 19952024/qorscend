const mongoose = require('mongoose');
const logger = require('../utils/logger');
const devConfig = require('./dev-config');
const prodConfig = require('./production');

const connectDB = async () => {
  try {
    const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
    const mongoURI = process.env.MONGODB_URI || config.MONGODB_URI;

    const conn = await mongoose.connect(mongoURI);

    logger.info(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    
    // In development mode, continue without database for testing
    const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
    if (config.NODE_ENV === 'development' && config.DEV_CONTINUE_WITHOUT_DB === 'true') {
      logger.warn('Continuing in development mode without database connection');
      return;
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
