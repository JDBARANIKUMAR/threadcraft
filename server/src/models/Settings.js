const mongoose = require('mongoose');

// Singleton document holding global store settings that admins can change.
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'store', unique: true },
  // Per-side customization print pricing (each printed side charges this)
  customizationPricePerSide: { type: Number, default: 150, min: 0 },
  // Shipping policy — the server is the single source of truth; the storefront
  // merely mirrors these values for display.
  freeShippingThreshold: { type: Number, default: 999, min: 0 },
  shippingFee: { type: Number, default: 99, min: 0 }
}, { timestamps: true });

settingsSchema.statics.get = async function () {
  let doc = await this.findOne({ key: 'store' });
  if (!doc) doc = await this.create({ key: 'store' });
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
