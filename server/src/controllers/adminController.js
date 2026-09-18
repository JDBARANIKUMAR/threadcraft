const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Settings = require('../models/Settings');

// Order statuses as stored in the Order schema (capitalised lifecycle)
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Failed'];

// @desc    Get dashboard metrics, chart data & recent orders
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery'] } });
    const completedOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

    const totalProducts = await Product.countDocuments({ active: true });

    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Revenue = paid orders (Razorpay verified or COD delivered)
    const revenueMatch = {
      $or: [
        { paymentStatus: 'completed' },
        { paymentMethod: 'cod', orderStatus: 'Delivered' }
      ]
    };

    const revenueData = await Order.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Monthly sales for the chart — TRUE last 6 calendar months (fixed:
    // the old pipeline sorted then $limit'ed, which returned the FIRST six
    // months ever recorded, not the recent ones).
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = await Order.aggregate([
      { $match: { ...revenueMatch, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent 6 orders for the dashboard feed
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6)
      .select('-items.customization');

    res.json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalOrders,
          pendingOrders,
          processingOrders,
          completedOrders,
          cancelledOrders,
          totalCustomers,
          totalProducts
        },
        monthlySales,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered customers (with order stats)
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Single aggregation for order stats of ALL listed customers
    // (replaces the old N+1 countDocuments + find pattern)
    const userIds = customers.map((c) => c._id);
    const stats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$paymentStatus', 'completed'] }, { $and: [{ $eq: ['$paymentMethod', 'cod'] }, { $eq: ['$orderStatus', 'Delivered'] }] }] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);
    const statsMap = new Map(stats.map((s) => [String(s._id), s]));

    const data = customers.map((cust) => {
      const obj = cust.toObject();
      const s = statsMap.get(String(cust._id));
      return { ...obj, orderCount: s?.orderCount ?? 0, totalSpent: s?.totalSpent ?? 0 };
    });

    res.json({
      success: true,
      data,
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

// @desc    Get one customer (admin view)
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a customer's orders (admin view)
// @route   GET /api/admin/customers/:id/orders
// @access  Private/Admin
const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .select('-items.customization.frontElements -items.customization.backElements');
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product stock directly from inventory page
// @route   PATCH /api/admin/inventory/:productId
// @access  Private/Admin
const updateProductStock = async (req, res, next) => {
  try {
    const { stock, colourName } = req.body;
    if (stock === undefined || isNaN(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative stock quantity required' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (colourName && product.availableColours?.length) {
      // Variant-level stock update
      const variant = product.availableColours.find(
        (c) => c.name.toLowerCase() === String(colourName).toLowerCase()
      );
      if (!variant) {
        return res.status(404).json({ success: false, message: `Colour "${colourName}" not found on this product` });
      }
      variant.stock = Number(stock);
      await product.save();
    } else {
      product.stock = Number(stock);
      await product.save();
    }

    res.json({
      success: true,
      message: `Stock updated to ${stock} for ${product.name}${colourName ? ` (${colourName})` : ''}`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Delete a customer (admin only)
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role !== 'customer') {
      return res.status(400).json({ success: false, message: 'Only customers can be deleted via this endpoint' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Low stock products (variant-aware totals computed client-side from full docs)
// @route   GET /api/admin/inventory
// @access  Private/Admin
const getLowStockProducts = async (req, res, next) => {
  try {
    const settings = await Settings.get();
    const threshold = Math.max(1, Math.min(100, parseInt(req.query.threshold, 10) || 10));
    const products = await Product.find({ active: true }).select('name stock availableColours images');
    const low = products.filter((p) => p.totalStock() <= threshold);
    res.json({
      success: true,
      data: low,
      meta: {
        threshold,
        freeShippingThreshold: settings.freeShippingThreshold,
        shippingFee: settings.shippingFee
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getCustomers,
  getCustomerById,
  getCustomerOrders,
  updateProductStock,
  deleteCustomer,
  getLowStockProducts
};
