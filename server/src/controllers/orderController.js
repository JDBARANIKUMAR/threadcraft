const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const { priceOrderItems } = require('../utils/pricing');

// Shipping policy lives in Settings (admin-editable); pricing.js returns the
// computed charge alongside the priced items.

// @desc    Create a new order from cart or direct checkout
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      couponCode,
      paymentMethod = 'razorpay'
    } = req.body;

    // NOTE: `price` is intentionally NOT read from the client — the server
    // is the source of truth for product pricing, variant availability,
    // stock and customization costs. See utils/pricing.js.
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ success: false, message: 'Complete delivery address is required' });
    }

    const priced = await priceOrderItems(items);
    if (!priced.ok) {
      return res.status(priced.error.status).json({ success: false, message: priced.error.message });
    }

    const { items: orderItems, subtotal, shippingCharge } = priced;

    // Handle coupon discount — revalidated server-side
    let discount = 0;
    let couponApplied = { code: '', discountValue: 0, discountType: '' };

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
      if (coupon) {
        const validation = coupon.isValid(subtotal);
        if (validation.valid) {
          discount = validation.discountAmount;
          couponApplied = {
            code: coupon.code,
            discountValue: coupon.discountValue,
            discountType: coupon.discountType
          };
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discount + shippingCharge);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      discount,
      shippingCharge,
      totalAmount,
      couponApplied,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'Pending',
      statusHistory: [{
        status: 'Pending',
        timestamp: new Date(),
        note: 'Order placed. Awaiting payment/confirmation.'
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user is owner or admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 15;
    const skip = (pageNumber - 1) * pageSize;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
        limit: pageSize
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status & add history step (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = [
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Failed'
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${orderStatus}` });
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Order updated to ${orderStatus}`
    });

    // If delivered, mark payment completed if COD
    if (orderStatus === 'Delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'completed';
    }

    // If cancelled, restore stock
    if (orderStatus === 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
