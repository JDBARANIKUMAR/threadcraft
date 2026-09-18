const Coupon = require('../models/Coupon');

// @desc    Validate a coupon code against a subtotal
// @route   POST /api/coupons/validate
// @access  Public / Authenticated
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code. Please try another.' });
    }

    const validation = coupon.isValid(Number(orderAmount) || 0);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    res.json({
      success: true,
      message: 'Coupon applied successfully!',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: validation.discountAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minimumOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      active
    } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, discount value, and expiry date are required' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon with this code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      expiryDate: new Date(expiryDate),
      usageLimit: Number(usageLimit) || 1000,
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    Object.assign(coupon, req.body);
    if (req.body.code) coupon.code = req.body.code.toUpperCase().trim();

    const updated = await coupon.save();

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
