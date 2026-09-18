const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  markPaymentFailed,
  paymentWebhook
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/payment/create-order — create a Razorpay order from the internal order total
router.post('/create-order', protect, createOrder);

// POST /api/payment/verify — verify signature & capture the payment server-side
router.post('/verify', protect, verifyPayment);

// POST /api/payment/failed — record a failed/cancelled checkout attempt
router.post('/failed', protect, markPaymentFailed);

// POST /api/payment/webhook — Razorpay server-to-server events (raw body needed for signature)
router.post('/webhook', paymentWebhook);

module.exports = router;
