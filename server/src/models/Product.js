const mongoose = require('mongoose');

const colourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
    code: { type: String, default: '' },
    // Per-colour media. Plain-string URLs are still accepted (legacy data and
    // admin-pasted URLs); objects carry { url, publicId, alt } for cloud assets.
    images: { type: [mongoose.Schema.Types.Mixed], default: [] },
    thumbnail: { type: mongoose.Schema.Types.Mixed, default: '' },
    mockup: { type: mongoose.Schema.Types.Mixed, default: '' },
    mockupFront: { type: mongoose.Schema.Types.Mixed, default: '' }, // legacy field kept for existing data
    mockupBack: { type: mongoose.Schema.Types.Mixed, default: '' },  // legacy field kept for existing data
    stock: { type: Number, default: null, min: 0 }, // null = fall back to product.stock
    active: { type: Boolean, default: true }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  slug: { type: String, lowercase: true, trim: true },
  description: { type: String, required: [true, 'Description is required'] },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  basePrice: { type: Number, required: [true, 'Base price is required'], min: 0 },
  discountPrice: { type: Number, default: null, min: 0 },
  images: { type: [mongoose.Schema.Types.Mixed], default: [] },
  availableSizes: {
    type: [String],
    default: ['S', 'M', 'L', 'XL', 'XXL']
  },
  availableColours: [colourSchema],
  // Total product-level stock. Variant-level stock lives on each colour.
  stock: { type: Number, required: true, default: 50, min: 0 },
  customizationEnabled: { type: Boolean, default: true },
  // Extra charge for printing; split per print side (front/back each charge this amount).
  customizationPrice: { type: Number, default: null, min: 0 },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  rating: { type: Number, default: 4.8, min: 0, max: 5 },
  numReviews: { type: Number, default: 12 },
  fabric: { type: String, default: '100% Combed Cotton, 240 GSM Bio-Washed' },
  fit: { type: String, default: 'Relaxed Streetwear Fit' },
  shirtType: {
    type: String,
    enum: ['collar', 'casual', 'oversized'],
    default: 'casual',
    lowercase: true
  },
  tags: [{ type: String }]
}, { timestamps: true });

// Brief #46: indexes that materially help hot queries
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ active: 1, createdAt: -1 });
productSchema.index({ shirtType: 1, active: 1 });

productSchema.pre('save', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

/* ── Virtuals / helpers (backward compatible) ─────────────────────────── */

// Effective per-unit price: discount price if set, else base price
productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice != null && this.discountPrice > 0 ? this.discountPrice : this.basePrice;
});

// Per-side customization charge for this product. Falls back to the global
// Settings.customizationPricePerSide; callers may pass an override.
productSchema.methods.customizationPricePerSide = function (globalPrice = 150) {
  if (this.customizationPrice != null && this.customizationPrice >= 0) {
    return Number(this.customizationPrice);
  }
  return Number(globalPrice) || 0;
};

// Sum of variant-level stock. When variants carry explicit stock (not null),
// that is authoritative; otherwise fall back to product-level stock.
productSchema.methods.totalStock = function () {
  const variants = (this.availableColours || []).filter((c) => c.active !== false);
  if (variants.length > 0 && variants.some((c) => c.stock != null)) {
    return variants.reduce((sum, c) => {
      const s = c.stock != null ? Number(c.stock) : 0;
      return sum + (Number.isFinite(s) ? s : 0);
    }, 0);
  }
  return this.stock;
};

module.exports = mongoose.model('Product', productSchema);
