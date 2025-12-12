const mongoose = require('mongoose');

const QuantumLibrarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Library name is required'],
    enum: ['qiskit', 'cirq', 'braket', 'pennylane', 'pyquil']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  version: {
    type: String,
    required: [true, 'Version is required']
  },
  features: [{
    type: String,
    required: [true, 'Features are required']
  }],
  documentationUrl: {
    type: String,
    required: [true, 'Documentation URL is required']
  },
  popularity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  color: {
    type: String,
    default: 'bg-blue-500/10 text-blue-500'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    conversionCount: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
QuantumLibrarySchema.index({ name: 1 }, { unique: true });
QuantumLibrarySchema.index({ isActive: 1 });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.QuantumLibrary || mongoose.model('QuantumLibrary', QuantumLibrarySchema);
