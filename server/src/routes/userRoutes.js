const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

module.exports = router;
