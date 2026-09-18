const User = require('../models/User');

// @desc    Get all addresses of logged-in user
// @route   GET /api/users/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user.addresses || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, street, city, state, postalCode, country, isDefault, tag } = req.body;

    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: 'All address fields are required' });
    }

    const user = await User.findById(req.user._id);

    // If marked default or first address, unset previous defaults
    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    const newAddress = {
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country: country || 'India',
      isDefault: isDefault || user.addresses.length === 0,
      tag: tag || 'Home'
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (req.body.isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    await user.save();

    res.json({
      success: true,
      message: 'Address removed successfully',
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set address as default
// @route   PATCH /api/users/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    let found = false;
    user.addresses.forEach(addr => {
      if (addr._id.toString() === addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Default address updated',
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
