const Banner = require('../models/Banner');
const { deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get active banners for homepage
// @route   GET /api/banners
// @access  Public
const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all banners (Admin)
// @route   GET /api/banners/admin
// @access  Private/Admin
const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new banner (Admin)
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, badgeText, image, imagePublicId, buttonText, buttonLink, order, active } = req.body;

    if (!title || !image) {
      return res.status(400).json({ success: false, message: 'Title and image are required' });
    }

    const banner = await Banner.create({
      title,
      subtitle: subtitle || '',
      badgeText: badgeText || 'LIMITED DROP',
      image,
      imagePublicId: imagePublicId || '',
      buttonText: buttonText || 'Shop now',
      buttonLink: buttonLink || '/shop',
      order: Number(order) || 0,
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update banner (Admin)
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const nextImage = req.body.image;
    const imageChanged =
      nextImage !== undefined && nextImage !== '' && nextImage !== banner.image;

    Object.assign(banner, req.body);

    if (imageChanged) {
      await deleteFromCloudinary(banner.imagePublicId);
      banner.imagePublicId = req.body.imagePublicId || '';
    } else if (nextImage === '') {
      await deleteFromCloudinary(banner.imagePublicId);
      banner.imagePublicId = '';
    }

    const updated = await banner.save();

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete banner (Admin)
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await Banner.findByIdAndDelete(req.params.id);
    await deleteFromCloudinary(banner.imagePublicId);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
};
