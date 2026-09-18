const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public coupon validation
router.post('/validate', validateCoupon);

// Admin-only management
router.get('/', protect, adminOnly, getAllCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
