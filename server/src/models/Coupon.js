const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 1
  },
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: 0 // 0 means no cap
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  usageLimit: {
    type: Number,
    default: 1000
  },
  usedCount: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

couponSchema.methods.isValid = function (orderAmount) {
  const now = new Date();
  if (!this.active) return { valid: false, message: 'This coupon is inactive.' };
  if (this.expiryDate && now > this.expiryDate) return { valid: false, message: 'This coupon has expired.' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached.' };
  if (orderAmount < this.minimumOrderAmount) return { valid: false, message: `Minimum cart value of ₹${this.minimumOrderAmount} required for this coupon.` };
  
  let calculatedDiscount = 0;
  if (this.discountType === 'percentage') {
    calculatedDiscount = Math.round((orderAmount * this.discountValue) / 100);
    if (this.maxDiscountAmount > 0 && calculatedDiscount > this.maxDiscountAmount) {
      calculatedDiscount = this.maxDiscountAmount;
    }
  } else {
    calculatedDiscount = Math.min(this.discountValue, orderAmount);
  }

  return { valid: true, discountAmount: calculatedDiscount };
};

module.exports = mongoose.model('Coupon', couponSchema);
