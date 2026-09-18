import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatINR } from '../../utils/formatPrice';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  const productId = product._id || product.id;
  const isFavorited = isInWishlist(productId);

  // Colour-variant aware image: prefer the first variant's mockup (what the
  // admin form saves), then the legacy mockupFront seed field, then gallery.
  const primaryImage =
    product.availableColours?.[0]?.mockup || product.availableColours?.[0]?.mockupFront || product.images?.[0] || '';

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if ((product.stock ?? 0) <= 0) return;
    addToCart({
      productId,
      product,
      name: product.name,
      image: primaryImage,
      price: product.discountPrice || product.basePrice,
      quantity: 1,
      size: product.availableSizes?.[1] || product.availableSizes?.[0] || 'M',
      colour: product.availableColours?.[0] || { name: 'Default', hex: '#111827' },
    });
  };

  const discountPercent =
    product.discountPrice && product.basePrice
      ? Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)
      : 0;

  const isOutOfStock = (product.stock ?? 0) <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 10;
  const shirtTypeLabel = product.shirtType
    ? product.shirtType.charAt(0).toUpperCase() + product.shirtType.slice(1)
    : product.category?.name || '';

  return (
    <div className="group relative flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-canvasd">
        <Link to={`/products/${productId}`} className="block w-full h-full" aria-label={product.name}>
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>

        {/* Minimal flags — text only, no coloured chips */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isOutOfStock && (
            <span className="bg-canvas px-2 py-1 text-[10px] font-semibold uppercase tracking-wideplus text-ink-700">Sold out</span>
          )}
          {!isOutOfStock && discountPercent > 0 && (
            <span className="bg-canvas px-2 py-1 text-[10px] font-semibold uppercase tracking-wideplus text-clay-600">
              {discountPercent}% off
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2 right-2 p-2 text-ink-500 hover:text-ink-900 transition-colors z-10"
          title={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-[17px] h-[17px] ${isFavorited ? 'fill-clay-500 text-clay-500' : ''}`} />
        </button>

        {/* Quick add appears on hover (desktop) */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            className="absolute inset-x-0 bottom-0 bg-ink-900/90 text-canvas text-xs font-semibold tracking-wide py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200 hidden md:block"
          >
            Quick add
          </button>
        )}
      </div>

      {/* Details */}
      <div className="pt-3 flex-1 flex flex-col">
        {shirtTypeLabel && (
          <p className="text-[11px] uppercase tracking-wideplus text-ink-400">{shirtTypeLabel}</p>
        )}

        <div className="mt-1 flex items-baseline justify-between gap-3">
          <Link
            to={`/products/${productId}`}
            className="text-sm font-medium text-ink-900 leading-snug hover:underline underline-offset-2 line-clamp-1"
          >
            {product.name}
          </Link>
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-sm font-semibold text-ink-900">
              {formatINR(product.discountPrice || product.basePrice)}
            </span>
            {product.discountPrice ? (
              <span className="text-xs text-ink-400 line-through">{formatINR(product.basePrice)}</span>
            ) : null}
          </div>
        </div>

        {/* Colour swatches — quiet preview */}
        {product.availableColours?.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.availableColours.slice(0, 5).map((col, idx) => (
              <span
                key={idx}
                className="w-3 h-3 rounded-full border border-ink-900/20"
                style={{ backgroundColor: col.hex }}
                title={col.name}
              />
            ))}
            {product.availableColours.length > 5 && (
              <span className="text-[10px] text-ink-400 pl-0.5">+{product.availableColours.length - 5}</span>
            )}
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <p className="mt-1.5 text-[11px] text-clay-600">Only {product.stock} left</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
