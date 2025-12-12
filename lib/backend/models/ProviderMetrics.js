const mongoose = require('mongoose');

const ProviderMetricsSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: [true, 'Provider name is required'],
    enum: ['IBM Quantum', 'Google Quantum AI', 'Amazon Braket', 'Xanadu', 'Rigetti', 'IonQ']
  },
  backend: {
    name: {
      type: String,
      required: [true, 'Backend name is required']
    },
    qubits: {
      type: Number,
      required: [true, 'Number of qubits is required']
    },
    type: {
      type: String,
      enum: ['superconducting', 'trapped-ion', 'photonic', 'neutral-atom'],
      required: true
    }
  },
  metrics: {
    queueTime: {
      type: Number, // in seconds
      required: true
    },
    costPerShot: {
      type: Number, // in USD
      required: true
    },
    errorRate: {
      type: Number, // as decimal (e.g., 0.012 for 1.2%)
      required: true
    },
    availability: {
      type: Number, // percentage (0-100)
      required: true
    },
    coherenceTime: {
      type: Number // in microseconds
    },
    gateFidelity: {
      type: Number // as decimal
    },
    readoutFidelity: {
      type: Number // as decimal
    }
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'error'],
    default: 'online'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dataSource: {
    type: String,
    enum: ['api', 'manual', 'scraped'],
    default: 'api'
  },
  region: {
    type: String,
    default: 'global'
  }
}, {
  timestamps: true
});

// Indexes
ProviderMetricsSchema.index({ status: 1 });
ProviderMetricsSchema.index({ lastUpdated: -1 });
// Single compound index ensures uniqueness and supports lookups
ProviderMetricsSchema.index({ provider: 1, 'backend.name': 1 }, { unique: true });

// Virtual for formatted queue time
ProviderMetricsSchema.virtual('formattedQueueTime').get(function() {
  if (this.metrics.queueTime === 0) return 'N/A';
  if (this.metrics.queueTime < 60) return `${this.metrics.queueTime}s`;
  const minutes = Math.floor(this.metrics.queueTime / 60);
  return `${minutes}m`;
});

// Virtual for formatted cost
ProviderMetricsSchema.virtual('formattedCost').get(function() {
  return `$${this.metrics.costPerShot.toFixed(3)}`;
});

// Virtual for formatted error rate
ProviderMetricsSchema.virtual('formattedErrorRate').get(function() {
  return `${(this.metrics.errorRate * 100).toFixed(1)}%`;
});

// Ensure virtual fields are serialized
ProviderMetricsSchema.set('toJSON', { virtuals: true });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.ProviderMetrics || mongoose.model('ProviderMetrics', ProviderMetricsSchema);
