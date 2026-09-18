const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { optionalAuth, protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public: customer frontend needs the customization price + shipping rules to
// display estimates. (The server always recomputes authoritative values at
// cart/order time — these are display-only.)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const settings = await Settings.get();
    res.json({
      success: true,
      data: {
        customizationPricePerSide: settings.customizationPricePerSide,
        freeShippingThreshold: settings.freeShippingThreshold,
        shippingFee: settings.shippingFee
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: update store settings
router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { customizationPricePerSide, freeShippingThreshold, shippingFee } = req.body;
    const settings = await Settings.get();

    const numFields = [
      ['customizationPricePerSide', settings],
      ['freeShippingThreshold', settings],
      ['shippingFee', settings]
    ];

    for (const [field] of numFields) {
      const raw = req.body[field];
      if (raw !== undefined) {
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({ success: false, message: `Invalid ${field}` });
        }
        settings[field] = value;
      }
    }

    await settings.save();
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
