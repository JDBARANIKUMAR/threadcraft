const express = require('express');
const router = express.Router();
const {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public active banners
router.get('/', getActiveBanners);

// Admin-only management
router.get('/admin', protect, adminOnly, getAllBanners);
router.post('/', protect, adminOnly, createBanner);
router.put('/:id', protect, adminOnly, updateBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

module.exports = router;
