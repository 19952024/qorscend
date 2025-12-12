const mongoose = require('mongoose');

const DataFileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  fileType: {
    type: String,
    enum: ['json', 'csv'],
    required: [true, 'File type is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'error'],
    default: 'uploaded'
  },
  data: {
    raw: {
      type: mongoose.Schema.Types.Mixed
    },
    processed: {
      type: mongoose.Schema.Types.Mixed
    },
    metadata: {
      recordCount: {
        type: Number
      },
      columns: [{
        type: String
      }],
      dataTypes: {
        type: mongoose.Schema.Types.Mixed
      },
      summary: {
        type: mongoose.Schema.Types.Mixed
      }
    }
  },
  processing: {
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number // in milliseconds
    },
    steps: [{
      name: {
        type: String
      },
      status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed']
      },
      duration: {
        type: Number
      },
      error: {
        type: String
      }
    }]
  },
  visualization: {
    charts: [{
      type: {
        type: String,
        enum: ['histogram', 'scatter', 'line', 'bar', 'heatmap']
      },
      title: {
        type: String
      },
      data: {
        type: mongoose.Schema.Types.Mixed
      },
      config: {
        type: mongoose.Schema.Types.Mixed
      }
    }]
  },
  tags: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
DataFileSchema.index({ user: 1, createdAt: -1 });
DataFileSchema.index({ status: 1 });
DataFileSchema.index({ fileType: 1 });
DataFileSchema.index({ tags: 1 });

// Virtual for formatted file size
DataFileSchema.virtual('formattedFileSize').get(function() {
  if (this.fileSize === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(k));
  return parseFloat((this.fileSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for processing duration in seconds
DataFileSchema.virtual('processingDurationSeconds').get(function() {
  return this.processing.duration ? this.processing.duration / 1000 : null;
});

// Virtual for record count
DataFileSchema.virtual('recordCount').get(function() {
  return this.data.metadata?.recordCount || 0;
});

// Ensure virtual fields are serialized
DataFileSchema.set('toJSON', { virtuals: true });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.DataFile || mongoose.model('DataFile', DataFileSchema);
