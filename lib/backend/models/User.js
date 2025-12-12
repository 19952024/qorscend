const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    appearance: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      colorScheme: {
        type: String,
        default: 'blue'
      },
      compactMode: {
        type: Boolean,
        default: false
      },
      showAnimations: {
        type: Boolean,
        default: true
      }
    }
  },
  toolPreferences: {
    autoSaveConversions: {
      type: Boolean,
      default: false
    },
    liveBenchmarks: {
      type: Boolean,
      default: false
    },
    autoProcessData: {
      type: Boolean,
      default: false
    },
    defaultQuantumLibrary: {
      type: String,
      default: 'qiskit'
    },
    preferredChartType: {
      type: String,
      default: 'line'
    }
  },
  dataPrivacy: {
    dataCollection: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: true
    },
    marketingCommunications: {
      type: Boolean,
      default: false
    },
    dataRetention: {
      type: String,
      enum: ['30-days', '6-months', '1-year', 'forever'],
      default: '1-year'
    }
  },
  stats: {
    codeConversions: {
      type: Number,
      default: 0
    },
    benchmarksRun: {
      type: Number,
      default: 0
    },
    dataFilesProcessed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    // If next is provided (callback style), use it; otherwise return (async style)
    if (typeof next === 'function') {
      return next();
  }
    return;
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const salt = await bcrypt.genSalt(saltRounds);
  this.password = await bcrypt.hash(this.password, salt);
    
    // If next is provided (callback style), use it; otherwise return (async style)
    if (typeof next === 'function') {
      return next();
    }
  } catch (error) {
    // If next is provided (callback style), use it; otherwise throw (async style)
    if (typeof next === 'function') {
      return next(error);
    }
    throw error;
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret';
  return jwt.sign(
    { id: this._id },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login
UserSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

// Update stats
UserSchema.methods.updateStats = async function(type, increment = 1) {
  if (this.stats && this.stats[type] !== undefined) {
    this.stats[type] = (this.stats[type] || 0) + increment;
    await this.save();
  }
};

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
