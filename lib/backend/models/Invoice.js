const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  number: { type: String, required: true, unique: true },
  status: { type: String, enum: ['paid', 'pending', 'overdue', 'canceled'], default: 'paid' },
  plan: { type: String, required: true },
  date: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' }
}, { timestamps: true });

// Prevent model overwrite during hot reload in Next.js
module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);


