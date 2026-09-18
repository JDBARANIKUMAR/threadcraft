const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Category name is required'], trim: true, unique: true },
  slug: { type: String, lowercase: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  // Cloudinary public id for safe asset lifecycle (empty for legacy local files)
  imagePublicId: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.index({ slug: 1 });
categorySchema.index({ active: 1, name: 1 });

categorySchema.pre('save', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
