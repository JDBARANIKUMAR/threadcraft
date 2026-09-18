const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/item/:itemId', updateCartItemQuantity);
router.delete('/item/:itemId', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
