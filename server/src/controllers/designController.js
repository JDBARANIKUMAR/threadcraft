const Design = require('../models/Design');
const {
  isConfigured: cloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary
} = require('../config/cloudinary');
const fs = require('fs');

// Remove a staged temp file without ever throwing
const cleanupTemp = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch { /* ignore */ }
};

// @desc    Get all active designs for T-Shirt Customizer
// @route   GET /api/designs
// @access  Public
const getDesigns = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { active: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const designs = await Design.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: designs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all designs for admin (including inactive)
// @route   GET /api/designs/admin
// @access  Private/Admin
const getAdminDesigns = async (req, res, next) => {
  try {
    const designs = await Design.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: designs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload an image → Cloudinary (or local disk in dev fallback).
 *          Returns { url, publicId } so MongoDB can manage the asset later.
 * @route   POST /api/designs/upload?kind=products|variants|banners|designs|customization
 * @access  Private/Admin
 */
const uploadDesignImage = async (req, res, next) => {
  let tempPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }
    tempPath = req.file.path;

    const { folderForKind } = require('../middleware/uploadMiddleware');

    let url = '';
    let publicId = '';

    if (cloudinaryConfigured) {
      // Production path: staged temp file → Cloudinary → temp cleaned up
      const folder = folderForKind(req);
      const uploaded = await uploadToCloudinary(tempPath, folder);
      url = uploaded.url;
      publicId = uploaded.publicId;
    } else if (process.env.NODE_ENV === 'production') {
      // /uploads is only served in dev (see app.js) and Render's disk is
      // ephemeral — a "successful" local save here would produce a dead URL.
      // Fail loudly so the admin knows to set Cloudinary credentials.
      return res.status(503).json({
        success: false,
        message: 'Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.'
      });
    } else {
      // Dev fallback (no Cloudinary credentials): keep the file under /uploads
      const destDir = require('path').join(__dirname, '../../uploads');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = require('path').join(destDir, req.file.filename);
      fs.renameSync(tempPath, destPath);
      tempPath = null;
      url = `/uploads/${req.file.filename}`;
      publicId = ''; // local files are not cloud-managed
    }

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url, publicId }
    });
  } catch (error) {
    next(error);
  } finally {
    cleanupTemp(tempPath);
  }
};

// @desc    Create a new design in library (Admin)
// @route   POST /api/designs
// @access  Private/Admin
const createDesign = async (req, res, next) => {
  try {
    const { name, image, imagePublicId, category, tags, price, active } = req.body;

    if (!name || !image) {
      return res.status(400).json({ success: false, message: 'Design name and image are required' });
    }

    const design = await Design.create({
      name,
      image,
      imagePublicId: imagePublicId || '',
      category: category || 'Streetwear',
      tags: tags || [],
      price: price ? Number(price) : 0,
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      message: 'Design added to library successfully',
      data: design
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update design (Admin) — replaces cloud asset when image changes
// @route   PUT /api/designs/:id
// @access  Private/Admin
const updateDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    const nextImage = req.body.image;
    const imageChanged =
      nextImage !== undefined && nextImage !== '' && nextImage !== design.image;

    Object.assign(design, req.body);

    if (imageChanged) {
      // Safe replacement: only drop the old cloud asset if nothing else
      // references it (designs are 1:1 with their image), then clear the id.
      await deleteFromCloudinary(design.imagePublicId);
      design.imagePublicId = req.body.imagePublicId || '';
    } else if (nextImage === '') {
      // Image explicitly cleared without replacement
      await deleteFromCloudinary(design.imagePublicId);
      design.imagePublicId = '';
    }

    const updated = await design.save();

    res.json({
      success: true,
      message: 'Design updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete design (Admin) — cloud asset cleaned up safely
// @route   DELETE /api/designs/:id
// @access  Private/Admin
const deleteDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    await Design.findByIdAndDelete(req.params.id);
    await deleteFromCloudinary(design.imagePublicId);

    res.json({
      success: true,
      message: 'Design deleted from library'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDesigns,
  getAdminDesigns,
  uploadDesignImage,
  createDesign,
  updateDesign,
  deleteDesign
};
