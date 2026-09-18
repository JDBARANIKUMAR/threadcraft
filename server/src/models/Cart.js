const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  size: { type: String, required: true, default: 'L' },
  colour: {
    name: { type: String, required: true, default: 'Jet Black' },
    hex: { type: String, required: true, default: '#111827' }
  },
  price: { type: Number, required: true },
  customization: {
    isCustomized: { type: Boolean, default: false },
    printSide: { type: String, enum: ['front', 'back', 'both'], default: 'front' },
    previewSnapshot: { type: String, default: '' },
    // Full canvas element snapshots (designer state) so nothing is lost between cart and order
    frontElements: { type: Array, default: [] },
    backElements: { type: Array, default: [] },
    text: { type: String, default: '' },
    textProps: {
      fontSize: { type: Number, default: 32 },
      fontFamily: { type: String, default: 'Outfit' },
      fill: { type: String, default: '#FFFFFF' },
      align: { type: String, default: 'center' },
      isBold: { type: Boolean, default: false },
      isItalic: { type: Boolean, default: false },
      x: { type: Number, default: 50 },
      y: { type: Number, default: 45 }
    },
    selectedDesign: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      url: { type: String, default: '' },
      scale: { type: Number, default: 1 },
      x: { type: Number, default: 50 },
      y: { type: Number, default: 45 },
      rotation: { type: Number, default: 0 }
    },
    uploadedImage: {
      url: { type: String, default: '' },
      scale: { type: Number, default: 1 },
      x: { type: Number, default: 50 },
      y: { type: Number, default: 45 },
      rotation: { type: Number, default: 0 }
    },
    customPrintCost: { type: Number, default: 0 }
  }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
