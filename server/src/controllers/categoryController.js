const Category = require('../models/Category');
const { deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories for admin (including inactive)
// @route   GET /api/categories/admin
// @access  Private/Admin
const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, imagePublicId, active } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      description: description || '',
      image: image || '',
      imagePublicId: imagePublicId || '',
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (req.body.name) {
      category.name = req.body.name;
      // Slug follows the new name so /shop/<slug> keeps working
      category.slug = String(req.body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    if (req.body.slug !== undefined) category.slug = req.body.slug;
    if (req.body.description !== undefined) category.description = req.body.description;

    // Image replacement: drop the old cloud asset only when it actually changed
    const nextImage = req.body.image;
    const imageChanged = nextImage !== undefined && nextImage !== category.image;
    if (nextImage !== undefined) category.image = nextImage;
    if (imageChanged) {
      await deleteFromCloudinary(category.imagePublicId);
      category.imagePublicId = req.body.imagePublicId || '';
    }
    if (req.body.active !== undefined) category.active = req.body.active;

    const updated = await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    await deleteFromCloudinary(category.imagePublicId);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
