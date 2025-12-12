const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['card', 'paypal'], required: true },
  brand: { type: String },
  last4: { type: String },
  email: { type: String },
  expiryMonth: { type: Number },
  expiryYear: { type: Number },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', PaymentMethodSchema);


