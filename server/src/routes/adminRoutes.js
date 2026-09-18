const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCustomers,
  getCustomerById,
  getCustomerOrders,
  updateProductStock,
  deleteCustomer,
  getLowStockProducts
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.get('/customers/:id/orders', getCustomerOrders);
router.delete('/customers/:id', deleteCustomer);
router.get('/inventory', getLowStockProducts);
router.patch('/inventory/:productId', updateProductStock);

module.exports = router;
