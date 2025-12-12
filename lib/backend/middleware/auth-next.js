const jwt = require('jsonwebtoken');
const User = require('../models/User');
const devConfig = require('../config/dev-config');
const prodConfig = require('../config/production');

// Next.js compatible protect middleware
const protect = async (req) => {
  // Test environment bypass to enable API smoke tests without a database
  if (devConfig.NODE_ENV === 'test') {
    return { id: 'test-user', role: 'user', updateStats: async () => {} };
  }
  
  let token;
  const authHeader = req.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Get token from header
      token = authHeader.split(' ')[1];

      // Verify token
      const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
      const jwtSecret = process.env.JWT_SECRET || config.JWT_SECRET;
      const decoded = jwt.verify(token, jwtSecret);

      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Not authorized to access this route');
    }
  } else {
    // No token provided
    if (devConfig.NODE_ENV === 'development' && devConfig.DEV_BYPASS_AUTH === 'true') {
      // In development, allow requests without a token using a consistent user id
      return { 
        id: '507f1f77bcf86cd799439011',
        role: 'user', 
        updateStats: async () => {} 
      };
    }
    throw new Error('No token provided');
  }
};

const authorize = (...roles) => {
  return (user) => {
    if (!roles.includes(user.role)) {
      throw new Error(`User role ${user.role} is not authorized to access this route`);
    }
  };
};

module.exports = { protect, authorize };

