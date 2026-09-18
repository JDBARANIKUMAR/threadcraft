const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  // Optional: admin-created products may have no gallery image yet
  image: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, required: true },
  colour: {
    name: { type: String, required: true },
    hex: { type: String, required: true }
  },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  customization: {
    isCustomized: { type: Boolean, default: false },
    printSide: { type: String, default: 'front' },
    previewSnapshot: { type: String, default: '' },
    // Full canvas element snapshots preserved for production
    frontElements: { type: Array, default: [] },
    backElements: { type: Array, default: [] },
    text: { type: String, default: '' },
    textProps: { type: Object, default: {} },
    selectedDesign: { type: Object, default: {} },
    uploadedImage: { type: Object, default: {} },
    customPrintCost: { type: Number, default: 0 }
  }
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  shippingCharge: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  couponApplied: {
    code: { type: String, default: '' },
    discountValue: { type: Number, default: 0 },
    discountType: { type: String, default: '' }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'card', 'cod'],
    default: 'razorpay'
  },
  paymentId: { type: String, default: '' },
  paymentDetails: { type: Object, default: {} },
  razorpayOrderId: { type: String, default: '' },
  paidAt: { type: Date, default: null },
  orderStatus: {
    type: String,
    enum: [
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Failed'
    ],
    default: 'Pending'
  },
  statusHistory: [statusHistorySchema]
}, { timestamps: true });

// Brief #46: indexes for admin order queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });

// Auto-generate human-readable order number if missing
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.orderNumber = `TC-${new Date().getFullYear()}-${randomSuffix}`;
  }
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.orderStatus || 'Pending',
      timestamp: new Date(),
      note: 'Order placed successfully.'
    }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
