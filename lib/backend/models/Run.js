const mongoose = require('mongoose');

const RunSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  name: { type: String },
  steps: [{
    type: { type: String, enum: ['convert', 'benchmark', 'clean'] },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    result: { type: mongoose.Schema.Types.Mixed },
    error: { type: String }
  }],
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  durationMs: { type: Number },
}, { timestamps: true });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.Run || mongoose.model('Run', RunSchema);


