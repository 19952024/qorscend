const jwt = require('jsonwebtoken');
const User = require('../models/User');
const devConfig = require('../config/dev-config');
const prodConfig = require('../config/production');

const protect = async (req, res, next) => {
  // Test environment bypass to enable API smoke tests without a database
  if (devConfig.NODE_ENV === 'test') {
    req.user = { id: 'test-user', role: 'user', updateStats: async () => {} };
    return next();
  }
  
  // Note: In development, we no longer bypass unconditionally here.
  // Bypass will only occur below when there is NO Authorization header.
  
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
      const jwtSecret = process.env.JWT_SECRET || config.JWT_SECRET;
      const decoded = jwt.verify(token, jwtSecret);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } else {
    // No token provided
    if (devConfig.NODE_ENV === 'development' && devConfig.DEV_BYPASS_AUTH === 'true') {
      // In development, allow requests without a token using a consistent user id
      req.user = { 
        id: '507f1f77bcf86cd799439011',
        role: 'user', 
        updateStats: async () => {} 
      };
      return next();
    }
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
