const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  inquiryId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  city: { type: String, default: 'Not specified' },
  amountWithheld: { type: Number, default: 0 },
  message: { type: String, default: '' },
  status: { type: String, enum: ['NEW', 'CONTACTED', 'RESOLVED'], default: 'NEW' },
  notes: { type: String, default: '' },
  ipAddress: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inquiry', InquirySchema);
