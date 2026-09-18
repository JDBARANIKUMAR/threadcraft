const Cart = require('../models/Cart');
const { priceOrderItems } = require('../utils/pricing');

// Helper to calculate totals
const formatCartResponse = async (cart) => {
  if (!cart) return { items: [], subtotal: 0, totalItems: 0 };

  await cart.populate({
    path: 'items.product',
    select: 'name slug images basePrice discountPrice stock customizationEnabled availableColours availableSizes'
  });

  let subtotal = 0;
  let totalItems = 0;

  const validItems = cart.items.filter(item => item.product != null);
  validItems.forEach(item => {
    subtotal += item.price * item.quantity;
    totalItems += item.quantity;
  });

  return {
    _id: cart._id,
    user: cart.user,
    items: validItems,
    subtotal: Math.round(subtotal * 100) / 100,
    totalItems
  };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const formattedCart = await formatCartResponse(cart);
    res.json({
      success: true,
      data: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart (standard or customized)
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const {
      productId,
      quantity = 1,
      size,
      colour,
      customization = null
      // NOTE: `price` is intentionally not accepted from the client —
      // cart pricing, variant availability and stock are computed/validated
      // server-side from the Product document (see utils/pricing.js).
    } = req.body;

    // Server-authoritative pricing + variant/stock/size validation
    const priced = await priceOrderItems([{ product: productId, quantity, size, colour, customization }]);
    if (!priced.ok) {
      return res.status(priced.error.status).json({ success: false, message: priced.error.message });
    }

    const serverItem = priced.items[0];
    const printCost = serverItem.customization.customPrintCost || 0;
    const isCustomized = serverItem.customization.isCustomized === true;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if duplicate standard product exists (customized products are unique)
    let existingItemIndex = -1;
    if (!isCustomized) {
      existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === String(productId) &&
                item.size === serverItem.size &&
                item.colour?.hex === serverItem.colour.hex &&
                (!item.customization || !item.customization.isCustomized)
      );
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        quantity: serverItem.quantity,
        size: serverItem.size,
        colour: serverItem.colour,
        price: serverItem.price,
        customization: {
          ...serverItem.customization,
          isCustomized,
          printSide: serverItem.customization.printSide || 'front',
          previewSnapshot: serverItem.customization.previewSnapshot || '',
          text: serverItem.customization.text || '',
          textProps: serverItem.customization.textProps || {},
          selectedDesign: serverItem.customization.selectedDesign || {},
          uploadedImage: serverItem.customization.uploadedImage || {},
          frontElements: serverItem.customization.frontElements || [],
          backElements: serverItem.customization.backElements || [],
          customPrintCost: printCost
        }
      });
    }

    await cart.save();
    const formattedCart = await formatCartResponse(cart);

    res.status(200).json({
      success: true,
      message: 'Added to cart successfully',
      data: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/item/:itemId
// @access  Private
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const product = await Product.findById(item.product).select('stock');
    if (product) {
      const productDoc = await Product.findById(item.product);
      const available = productDoc ? productDoc.totalStock() : product.stock;
      if (available < quantity) {
        return res.status(400).json({ success: false, message: `Only ${Math.max(0, available)} items remaining in stock` });
      }
    }

    item.quantity = Number(quantity);
    await cart.save();

    const formattedCart = await formatCartResponse(cart);
    res.json({
      success: true,
      message: 'Cart updated',
      data: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an item from cart
// @route   DELETE /api/cart/item/:itemId
// @access  Private
const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    const formattedCart = await formatCartResponse(cart);
    res.json({
      success: true,
      message: 'Item removed from cart',
      data: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared',
      data: { items: [], subtotal: 0, totalItems: 0 }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
