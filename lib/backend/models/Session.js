const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  deviceInfo: {
    browser: {
      type: String,
      required: true
    },
    os: {
      type: String,
      required: true
    },
    device: {
      type: String,
      default: 'desktop'
    }
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
SessionSchema.index({ user: 1, isActive: 1 });
// Ensure sessionId uniqueness via index rather than schema option to avoid duplication warnings
SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to update last activity
SessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Method to deactivate session
SessionSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Static method to get active sessions for a user
SessionSchema.statics.getActiveSessions = function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 });
};

// Static method to create a new session
SessionSchema.statics.createSession = function(userId, sessionData) {
  // Deactivate all current sessions for this user
  this.updateMany(
    { user: userId, isCurrent: true },
    { isCurrent: false }
  );

  // Create new session
  return this.create({
    user: userId,
    sessionId: sessionData.sessionId,
    deviceInfo: sessionData.deviceInfo,
    ipAddress: sessionData.ipAddress,
    userAgent: sessionData.userAgent,
    isCurrent: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
};

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.Session || mongoose.model('Session', SessionSchema);
