const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Profile settings
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  organization: {
    type: String,
    trim: true,
    maxlength: [100, 'Organization cannot be more than 100 characters']
  },
  
  // Tool preferences
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
      enum: ['qiskit', 'cirq', 'braket', 'pennylane'],
      default: 'qiskit'
    },
    preferredChartType: {
      type: String,
      enum: ['line', 'bar', 'scatter'],
      default: 'line'
    }
  },
  
  // Appearance settings
  appearance: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    colorScheme: {
      type: String,
      enum: ['blue', 'purple', 'green', 'orange'],
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
  },
  
  // Notification settings
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    jobCompletionAlerts: {
      type: Boolean,
      default: true
    },
    weeklyReports: {
      type: Boolean,
      default: false
    },
    quietHours: {
      type: String,
      default: '22:00-08:00'
    }
  },
  
  // Data & Privacy settings
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
  }
}, {
  timestamps: true
});

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.UserSettings || mongoose.model('UserSettings', UserSettingsSchema);
