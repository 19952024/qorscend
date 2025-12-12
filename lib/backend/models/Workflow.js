const mongoose = require('mongoose');

const WorkflowStepSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['convert', 'benchmark', 'clean'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  result: {
    type: mongoose.Schema.Types.Mixed
  },
  error: {
    type: String
  }
});

const WorkflowSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  steps: [WorkflowStepSchema],
  status: {
    type: String,
    enum: ['draft', 'running', 'completed', 'failed'],
    default: 'draft'
  },
  completedAt: {
    type: Date
  },
  metadata: {
    totalRuns: {
      type: Number,
      default: 0
    },
    successRuns: {
      type: Number,
      default: 0
    },
    averageRuntime: {
      type: Number // in milliseconds
    },
    lastRunAt: {
      type: Date
    }
  },
  tags: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
WorkflowSchema.index({ user: 1, createdAt: -1 });
WorkflowSchema.index({ status: 1 });
WorkflowSchema.index({ 'metadata.lastRunAt': -1 });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);
