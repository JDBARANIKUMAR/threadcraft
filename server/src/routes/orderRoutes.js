const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

// Admin-only order routes
router.get('/admin/all', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);

// Order detail route must stay below explicit admin/list routes.
router.get('/:id', getOrderById);

module.exports = router;
