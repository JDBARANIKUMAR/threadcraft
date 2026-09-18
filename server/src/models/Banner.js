const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },
  badgeText: { type: String, default: 'LIMITED DROP' },
  image: { type: String, required: true },
  // Cloudinary public id for safe asset lifecycle (empty for legacy local files)
  imagePublicId: { type: String, default: '' },
  buttonText: { type: String, default: 'Shop now' },
  buttonLink: { type: String, default: '/shop' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
