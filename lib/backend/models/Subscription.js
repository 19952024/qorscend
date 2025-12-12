const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['active', 'past_due', 'canceled'], default: 'active' },
  currentPeriodEnd: { type: Date },
  provider: { type: String, enum: ['stripe', 'paypal', 'mock'], default: 'mock' },
  customerId: { type: String },
  subscriptionId: { type: String },
}, { timestamps: true });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);


