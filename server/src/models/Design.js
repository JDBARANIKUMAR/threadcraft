const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Design name is required'], trim: true },
  image: { type: String, required: [true, 'Design image URL or path is required'] },
  // Cloudinary public id — enables safe replacement/deletion of cloud assets.
  // Empty for legacy local /uploads assets (they are not cloud-managed).
  imagePublicId: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['Streetwear', 'Typography', 'Anime', 'Vintage', 'Minimalist', 'Cyberpunk', 'Badges', 'Abstract'],
    default: 'Streetwear'
  },
  tags: [{ type: String }],
  price: { type: Number, default: 0 }, // Extra price for premium graphic if applicable
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Design', designSchema);
