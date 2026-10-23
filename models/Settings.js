const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'app_config' },
  tier1Price: { type: Number, default: 99 },
  tier2Price: { type: Number, default: 499 },
  upiId: { type: String, default: '8000757744@upi' },
  razorpayAccountId: { type: String, default: 'acc_RkgFhN1xao5sNF' },
  razorpayMerchantId: { type: String, default: 'RkgFhN1xao5sNF' },
  razorpayKeyId: { type: String, default: '' },
  razorpayKeySecret: { type: String, default: '' },
  razorpayEnabled: { type: Boolean, default: true },
  directUpiEnabled: { type: Boolean, default: false },
  adminUsername: { type: String, default: 'aks008' },
  adminSecretUrl: { type: String, default: 'portal-aks008' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
