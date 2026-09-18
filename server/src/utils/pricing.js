const Product = require('../models/Product');
const Settings = require('../models/Settings');

/**
 * Server-authoritative pricing + inventory validation.
 *
 * The client NEVER supplies a price. For each requested item we:
 *   1. Load the product (must exist and be active)
 *   2. Validate the requested colour variant (must exist, be active, and have stock)
 *   3. Validate the requested size (must be offered by the product)
 *   4. Compute the unit price from the Product document + validated customization
 *   5. Compute the per-item total
 *
 * Returns { ok, items, subtotal, error } — `error` is a { status, message } on failure.
 */
const priceOrderItems = async (rawItems = []) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: { status: 400, message: 'No items in order' } };
  }

  const settings = await Settings.get();
  const globalPerSide = settings.customizationPricePerSide;
  const freeShipAbove = settings.freeShippingThreshold;
  const flatShipping = settings.shippingFee;

  let subtotal = 0;
  const items = [];

  for (const raw of rawItems) {
    const quantity = Math.max(1, Math.min(20, Number(raw.quantity) || 1));

    const product = await Product.findById(raw.product || raw.productId);
    if (!product || product.active === false) {
      return {
        ok: false,
        error: { status: 404, message: `Product not found or unavailable: ${raw.name || ''}` }
      };
    }

    // ── Variant (colour) validation ────────────────────────────────────────
    const requestedColourName = raw.colour?.name || '';
    const requestedColourHex = raw.colour?.hex || '';
    const variants = product.availableColours || [];
    const activeVariants = variants.filter((c) => c.active !== false);

    let variant = null;
    if (requestedColourName || requestedColourHex) {
      variant = activeVariants.find(
        (c) =>
          (requestedColourName && c.name.toLowerCase() === String(requestedColourName).toLowerCase()) ||
          (requestedColourHex && c.hex.toLowerCase() === String(requestedColourHex).toLowerCase())
      );
      if (!variant) {
        return {
          ok: false,
          error: { status: 400, message: `Colour "${requestedColourName || requestedColourHex}" is not available for ${product.name}` }
        };
      }
    } else if (activeVariants.length > 0) {
      variant = activeVariants[0];
    }

    // ── Size validation ────────────────────────────────────────────────────
    const size = String(raw.size || product.availableSizes?.[0] || 'M').slice(0, 10);
    if (product.availableSizes?.length > 0 && !product.availableSizes.includes(size)) {
      return {
        ok: false,
        error: { status: 400, message: `Size "${size}" is not available for ${product.name}` }
      };
    }

    // ── Stock validation (variant-aware) ───────────────────────────────────
    const productTotal = product.totalStock();
    // Variant stock is authoritative when the variant defines it; otherwise
    // fall back to product-level stock (legacy data).
    const variantHasOwnStock = variant && variant.stock != null;
    const availableStock = variantHasOwnStock ? Number(variant.stock) : productTotal;

    if (availableStock < quantity) {
      const label = variant ? `${variant.name} · ${size}` : product.name;
      return {
        ok: false,
        error: {
          status: 400,
          message: `Not enough stock for ${product.name} (${label}). Only ${Math.max(0, availableStock)} available.`
        }
      };
    }

    // ── Customization pricing (server-side only) ───────────────────────────
    const customization = raw.customization && typeof raw.customization === 'object' ? raw.customization : null;
    let printSides = 0;
    if (customization && customization.isCustomized) {
      const frontHasContent = Array.isArray(customization.frontElements) && customization.frontElements.length > 0;
      const backHasContent = Array.isArray(customization.backElements) && customization.backElements.length > 0;
      const hasText = Boolean(customization.text);
      const hasDesign = Boolean(customization.selectedDesign && customization.selectedDesign.url);
      const hasUpload = Boolean(customization.uploadedImage && customization.uploadedImage.url);
      const hasLegacyFront = customization.printSide === 'front' || customization.printSide === 'both';
      const hasLegacyBack = customization.printSide === 'back' || customization.printSide === 'both';

      if (frontHasContent || hasText || hasDesign || hasUpload || hasLegacyFront) printSides += 1;
      if (backHasContent || hasLegacyBack) printSides += 1;
      if (printSides === 0) printSides = 1; // customized flag with no content still counts as one side
    }

    const perSide = product.customizationPricePerSide(globalPerSide);
    const printCost = customization && customization.isCustomized ? Math.min(printSides * perSide, 10000) : 0;

    const unitPrice = product.effectivePrice + printCost;
    const itemTotal = unitPrice * quantity;
    subtotal += itemTotal;

    items.push({
      product: product._id,
      name: product.name,
      image:
        (variant && (variant.mockup || variant.mockupFront || variant.thumbnail)) ||
        (variant && variant.images?.[0]) ||
        product.images?.[0] ||
        '',
      quantity,
      size,
      colour: {
        name: variant ? variant.name : raw.colour?.name || 'Default',
        hex: variant ? variant.hex : raw.colour?.hex || '#111827'
      },
      price: unitPrice,
      totalPrice: itemTotal,
      customization: customization
        ? {
            ...customization,
            isCustomized: !!customization.isCustomized,
            // Server-computed print cost overwrites whatever the client claimed
            customPrintCost: printCost
          }
        : { isCustomized: false }
    });
  }

  const shippingCharge = subtotal > freeShipAbove ? 0 : flatShipping;
  return { ok: true, items, subtotal, shippingCharge };
};

module.exports = { priceOrderItems };
