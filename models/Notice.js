const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  refNo: { type: String, required: true, unique: true, index: true },
  tenantName: { type: String, required: true },
  tenantPhone: { type: String, required: true },
  tenantEmail: { type: String, default: 'N/A' },
  landlordName: { type: String, required: true },
  landlordPhone: { type: String, default: 'N/A' },
  propertyAddress: { type: String, required: true },
  city: { type: String, required: true, default: 'Bengaluru, Karnataka' },
  tenancyStartDate: { type: String, default: '' },
  vacateDate: { type: String, required: true },
  depositPaid: { type: Number, required: true },
  monthlyRent: { type: Number, required: true },
  amountRefunded: { type: Number, default: 0 },
  amountWithheld: { type: Number, required: true },
  excuses: [{ type: String }],
  noticeServed: { type: String, default: 'Yes' },
  flatCondition: { type: String, default: 'Yes' },
  isUnlocked: { type: Boolean, default: false },
  tierUnlocked: { type: String, enum: ['NONE', 'TIER_1', 'TIER_2'], default: 'NONE' },
  unlockedAt: { type: Date },
  ipAddress: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', NoticeSchema);
