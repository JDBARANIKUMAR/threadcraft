const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', optionalAuth, getProductById);

// Admin-only endpoints
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
