const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products with filtering, search, sorting & pagination
// @route   GET /api/products
// @access  Public (admin sees inactive items too via ?includeInactive=true)
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      size,
      colour,
      shirtType,
      minPrice,
      maxPrice,
      inStock,
      customizableOnly,
      includeInactive,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    // Customers only ever see active products; admins may request inactive ones too
    const isAdminRequest =
      includeInactive === 'true' && req.user && req.user.role === 'admin';
    const query = isAdminRequest ? {} : { active: true };

    // Shirt type filter (collar / casual / oversized) — accepts comma-separated values
    if (shirtType) {
      const types = String(shirtType)
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (types.length > 0) {
        query.shirtType = { $in: types };
      }
    }

    // Search query across name, description, tags
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: { $regex: category, $options: 'i' } }]
        });
        if (catDoc) query.category = catDoc._id;
      }
    }

    // Size filter
    if (size) {
      const sizesArray = size.split(',');
      query.availableSizes = { $in: sizesArray };
    }

    // Colour filter
    if (colour) {
      const coloursArray = colour.split(',');
      query['availableColours.name'] = { $in: coloursArray.map(c => new RegExp(`^${c}$`, 'i')) };
    }

    // Price range filter — matches the effective selling price
    if (minPrice || maxPrice) {
      query.$and = query.$and || [];
      const priceCond = {};
      // effective price = discountPrice if set else basePrice, so match either branch
      const or = [];
      if (minPrice) {
        or.push({ discountPrice: { $gte: Number(minPrice) } });
        or.push({ $and: [{ discountPrice: null }, { basePrice: { $gte: Number(minPrice) } }] });
      }
      if (maxPrice) {
        or.push({ discountPrice: { $lte: Number(maxPrice) } });
        or.push({ $and: [{ discountPrice: null }, { basePrice: { $lte: Number(maxPrice) } }] });
      }
      if (or.length > 0) priceCond.$or = or;
      if (Object.keys(priceCond).length > 0) query.$and.push(priceCond);
    }

    // In-stock only (variant-aware)
    if (inStock === 'true') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'availableColours.stock': { $gt: 0 } },
          { $and: [{ 'availableColours.stock': { $type: 10 } }, { stock: { $gt: 0 } }] }
        ]
      });
    }

    // Customization enabled filter
    if (customizableOnly === 'true') {
      query.customizationEnabled = true;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { basePrice: 1 };
    else if (sort === 'price-high') sortOption = { basePrice: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'popular') sortOption = { numReviews: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 12;
    const skip = (pageNumber - 1) * pageSize;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    res.json({
      success: true,
      data: products,
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

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ active: true, featured: true })
      .populate('category', 'name slug')
      .limit(8);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or Slug
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: id }).populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Inactive products are hidden from customers but remain viewable by admins
    if (
      product.active === false &&
      !(req.user && req.user.role === 'admin')
    ) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      discountPrice,
      images,
      availableSizes,
      availableColours,
      stock,
      customizationEnabled,
      customizationPrice,
      featured,
      active,
      fabric,
      fit,
      shirtType,
      tags
    } = req.body;

    if (!name || !description || !category || !basePrice) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const product = await Product.create({
      name,
      description,
      category,
      basePrice: Number(basePrice),
      discountPrice: discountPrice !== undefined && discountPrice !== '' ? Number(discountPrice) : null,
      // No fake placeholder image — the frontend already renders a clean
      // fallback tile when a product has no image yet.
      images: images && images.length ? images : [],
      availableSizes: availableSizes || ['S', 'M', 'L', 'XL', 'XXL'],
      availableColours: availableColours || [],
      stock: stock !== undefined ? Number(stock) : 50,
      customizationEnabled: customizationEnabled !== undefined ? customizationEnabled : true,
      customizationPrice:
        customizationPrice !== undefined && customizationPrice !== '' && customizationPrice !== null
          ? Number(customizationPrice)
          : null,
      featured: featured || false,
      active: active !== undefined ? active : true,
      fabric: fabric || '100% Combed Cotton, 240 GSM Bio-Washed',
      fit: fit || 'Relaxed Streetwear Fit',
      shirtType: ['collar', 'casual', 'oversized'].includes(shirtType) ? shirtType : 'casual',
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      description,
      category,
      basePrice,
      discountPrice,
      images,
      availableSizes,
      availableColours,
      stock,
      customizationEnabled,
      customizationPrice,
      featured,
      active,
      fabric,
      fit,
      shirtType,
      tags
    } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (discountPrice !== undefined) {
      product.discountPrice =
        discountPrice === null || discountPrice === '' ? null : Number(discountPrice);
    }
    if (images !== undefined) product.images = images;
    if (availableSizes !== undefined) product.availableSizes = availableSizes;
    if (availableColours !== undefined) product.availableColours = availableColours;
    if (stock !== undefined) product.stock = Number(stock);
    if (customizationEnabled !== undefined) product.customizationEnabled = customizationEnabled;
    if (customizationPrice !== undefined) {
      product.customizationPrice =
        customizationPrice === null || customizationPrice === '' ? null : Number(customizationPrice);
    }
    if (featured !== undefined) product.featured = featured;
    if (active !== undefined) product.active = active;
    if (fabric !== undefined) product.fabric = fabric;
    if (fit !== undefined) product.fit = fit;
    if (shirtType !== undefined) product.shirtType = shirtType;
    if (tags !== undefined) product.tags = tags;

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
