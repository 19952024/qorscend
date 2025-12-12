const mongoose = require('mongoose');

const CodeConversionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sourceLibrary: {
    type: String,
    required: [true, 'Source library is required'],
    enum: ['qiskit', 'cirq', 'braket', 'pennylane', 'pyquil']
  },
  targetLibrary: {
    type: String,
    required: [true, 'Target library is required'],
    enum: ['qiskit', 'cirq', 'braket', 'pennylane', 'pyquil']
  },
  sourceCode: {
    type: String,
    required: [true, 'Source code is required']
  },
  convertedCode: {
    type: String,
    required: [true, 'Converted code is required']
  },
  status: {
    type: String,
    enum: ['success', 'error', 'processing'],
    default: 'processing'
  },
  errorMessage: {
    type: String
  },
  metadata: {
    linesOfCode: {
      type: Number
    },
    conversionTime: {
      type: Number // in milliseconds
    },
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  },
  tags: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
CodeConversionSchema.index({ user: 1, createdAt: -1 });
CodeConversionSchema.index({ sourceLibrary: 1, targetLibrary: 1 });
CodeConversionSchema.index({ status: 1 });

// Virtual for conversion time in seconds
CodeConversionSchema.virtual('conversionTimeSeconds').get(function() {
  return this.metadata.conversionTime ? this.metadata.conversionTime / 1000 : null;
});

// Ensure virtual fields are serialized
CodeConversionSchema.set('toJSON', { virtuals: true });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.CodeConversion || mongoose.model('CodeConversion', CodeConversionSchema);
