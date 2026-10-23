const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true }, // UTR or Razorpay Payment ID
  orderId: { type: String, default: '' }, // Razorpay Order ID if applicable
  noticeRefNo: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  tier: { type: String, enum: ['TIER_1', 'TIER_2'], default: 'TIER_1' },
  gateway: { type: String, enum: ['RAZORPAY', 'UPI_DIRECT', 'ADMIN_APPROVED'], default: 'UPI_DIRECT' },
  status: { type: String, enum: ['CONFIRMED', 'PENDING', 'FAILED'], default: 'PENDING', index: true },
  customerPhone: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  verifiedAt: { type: Date },
  rawData: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
