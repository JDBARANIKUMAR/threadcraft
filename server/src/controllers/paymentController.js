const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isPlaceholder = !keyId || !keySecret;

  let client = null;
  if (!isPlaceholder) {
    client = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return { keyId, keySecret, client, isPlaceholder };
};

/**
 * @desc    Create a Razorpay order for an existing internal order.
 *          The amount ALWAYS comes from the server-side Order document —
 *          the client never supplies a price.
 * @route   POST /api/payment/create-order
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order',
      });
    }

    // Prevent duplicate payment attempts for an already-paid order
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid',
      });
    }

    const { keyId, client, isPlaceholder } = getRazorpayConfig();

    if (isPlaceholder || !client) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env and restart the server.',
      });
    }

    // Amount is taken from the server-side order total — never from the client
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    if (!amountInPaise || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Order total is invalid; cannot initiate payment',
      });
    }

    const razorpayOrder = await client.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber.slice(0, 40),
      notes: {
        brand: 'ThreadCraft Studio',
        internal_order_id: String(order._id),
        order_number: order.orderNumber,
      },
    });

    // Link the Razorpay order to the internal order and lock the payment method
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentMethod = 'razorpay';
    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    return res.status(500).json({
      success: false,
      message: error.error?.description || error.message || 'Failed to create payment order',
    });
  }
};

/**
 * @desc    Verify Razorpay payment signature and capture the payment.
 *          Marks the internal order paid ONLY after HMAC-SHA256 signature
 *          validation against RAZORPAY_KEY_SECRET.
 * @route   POST /api/payment/verify
 * @access  Private
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this order',
      });
    }

    // Idempotency: never double-capture an already-completed order
    if (order.paymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified for this order',
        data: {
          paymentId: order.paymentId,
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          alreadyVerified: true,
        },
      });
    }

    const { keySecret, isPlaceholder } = getRazorpayConfig();
    if (isPlaceholder) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay keys are missing. Cannot verify payment.',
      });
    }

    // The Razorpay order must be the one issued for THIS internal order
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment does not belong to this order',
      });
    }

    // HMAC-SHA256 signature verification (Razorpay standard scheme)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        lastVerificationAttempt: new Date().toISOString(),
        failureReason: 'signature_mismatch',
      };
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature',
      });
    }

    // Signature is valid — capture the payment
    order.paymentStatus = 'completed';
    order.paymentId = razorpay_payment_id;
    order.paidAt = new Date();
    order.orderStatus = 'Confirmed';
    order.paymentDetails = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      verifiedAt: new Date().toISOString(),
      amountPaid: order.totalAmount,
    };
    order.statusHistory.push({
      status: 'Confirmed',
      timestamp: new Date(),
      note: `Payment captured via Razorpay (${razorpay_payment_id}).`
    });
    await order.save();

    // Fulfilment: reduce product stock and clear the customer's cart
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }
    await Cart.findOneAndUpdate({ user: order.user._id || order.user }, { items: [] });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Verify Razorpay Payment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during payment verification',
    });
  }
};

/**
 * @desc    Mark an order failed after Razorpay reports a failed/abandoned payment
 * @route   POST /api/payment/failed
 * @access  Private
 */
exports.markPaymentFailed = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Only mark failed if still pending — a completed order must never regress
    if (order.paymentStatus === 'pending') {
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        failedAt: new Date().toISOString(),
        failureReason: reason || 'payment_failed_or_cancelled',
      };
      order.statusHistory.push({
        status: 'Failed',
        timestamp: new Date(),
        note: 'Payment failed or was cancelled before completion.'
      });
      await order.save();
    }

    return res.status(200).json({ success: true, message: 'Payment marked as failed' });
  } catch (error) {
    console.error('Mark Payment Failed Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment state' });
  }
};

/**
 * @desc    Razorpay webhook (payment.captured / payment.failed) — backup
 *          server-to-server source of truth for payment state.
 * @route   POST /api/payment/webhook
 * @access  Public (validated via RAZORPAY_WEBHOOK_SECRET signature)
 */
exports.paymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      return res.status(200).json({ success: true, message: 'Webhook not configured; ignored' });
    }

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    // Audit fix: verify against the RAW request body (the exact bytes Razorpay
    // signed), not a re-serialized JSON object whose key order/whitespace differs.
    const rawBody = req.rawBody;
    if (!rawBody) {
      return res.status(400).json({ success: false, message: 'Missing raw request body for verification' });
    }

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body;
    const paymentEntity = event?.payload?.payment?.entity;

    if (paymentEntity?.order_id) {
      const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (order) {
        if (event.event === 'payment.captured' && order.paymentStatus !== 'completed') {
          order.paymentStatus = 'completed';
          order.paymentId = paymentEntity.id;
          order.paidAt = new Date();
          if (order.orderStatus === 'Pending') {
            order.orderStatus = 'Confirmed';
            order.statusHistory.push({
              status: 'Confirmed',
              timestamp: new Date(),
              note: `Payment captured via Razorpay webhook (${paymentEntity.id}).`
            });
          }
          await order.save();
        } else if (event.event === 'payment.failed' && order.paymentStatus === 'pending') {
          order.paymentStatus = 'failed';
          await order.save();
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};
