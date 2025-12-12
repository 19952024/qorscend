const mongoose = require('mongoose');

const WorkflowTemplateStepSchema = new mongoose.Schema({
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
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const WorkflowTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Template description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  icon: {
    type: String,
    required: true,
    enum: ['Code2', 'BarChart3', 'Database', 'Zap', 'Star', 'Clock', 'Users']
  },
  color: {
    type: String,
    required: true,
    default: 'text-blue-500'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  estimatedTime: {
    type: String,
    required: true
  },
  popularity: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  steps: [WorkflowTemplateStepSchema],
  usageCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String
  }],
  metadata: {
    lastUsed: {
      type: Date
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
WorkflowTemplateSchema.index({ isPublic: 1, popularity: -1 });
WorkflowTemplateSchema.index({ difficulty: 1 });
WorkflowTemplateSchema.index({ tags: 1 });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.WorkflowTemplate || mongoose.model('WorkflowTemplate', WorkflowTemplateSchema);
