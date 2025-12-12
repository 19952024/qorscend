const mongoose = require('mongoose');
const logger = require('../utils/logger');
const devConfig = require('./dev-config');
const prodConfig = require('./production');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
    const mongoURI = process.env.MONGODB_URI || config.MONGODB_URI;

    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
      logger.info(`📦 MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    }).catch((error) => {
      logger.error('Database connection failed:', error);
      
      // In development mode, continue without database for testing
      if (config.NODE_ENV === 'development' && config.DEV_CONTINUE_WITHOUT_DB === 'true') {
        logger.warn('Continuing in development mode without database connection');
        return null;
      }
      
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;

