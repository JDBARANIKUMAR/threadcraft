const express = require('express');
const router = express.Router();
const {
  getDesigns,
  getAdminDesigns,
  uploadDesignImage,
  createDesign,
  updateDesign,
  deleteDesign
} = require('../controllers/designController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/', getDesigns);
// Upload is admin-only (audit: was public — anyone could fill the disk)
router.post('/upload', protect, adminOnly, upload.single('image'), uploadDesignImage);

// Admin-only endpoints
router.get('/admin', protect, adminOnly, getAdminDesigns);
router.post('/', protect, adminOnly, createDesign);
router.put('/:id', protect, adminOnly, updateDesign);
router.delete('/:id', protect, adminOnly, deleteDesign);

module.exports = router;
