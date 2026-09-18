const express = require('express');
const router = express.Router();
const {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', getCategories);
router.get('/admin', protect, adminOnly, getAdminCategories);
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
