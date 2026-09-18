import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, Tag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/formatPrice';

const CartPage = () => {
  const {
    items,
    subtotal,
    discountAmount,
    shippingCharge,
    totalAmount,
    coupon,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    loading,
  } = useCart();
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (await applyCoupon(couponCode)) {
      setCouponCode('');
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="rule-heading mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">Your Cart</h1>
        <p className="text-sm text-ink-500">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-line bg-white px-6 py-16 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1.5} />
          <p className="mt-4 font-display text-lg font-semibold text-ink-900">Your cart is empty</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
            Add a tee from the collection, or design your own in the studio.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="btn-primary">Shop the collection</Link>
            <Link to="/customize" className="btn-secondary">Open design studio</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Items */}
          <div>
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item._id} className="flex gap-4 py-6 sm:gap-6">
                  <Link to={item.productId ? `/products/${item.productId}` : '#'} className="shrink-0">
                    <div className="h-36 w-28 overflow-hidden bg-canvasd sm:h-40 sm:w-32">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">👕</div>
                      )}
                    </div>
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          to={item.productId ? `/products/${item.productId}` : '#'}
                          className="text-sm font-semibold text-ink-900 hover:underline underline-offset-2"
                        >
                          {item.name}
                        </Link>
                        {/* Variant info — colour survives the whole flow */}
                        <p className="mt-1 text-xs text-ink-500">
                          Size {item.size}
                          {item.colour?.name && (
                            <>
                              {' · '}
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-full border border-ink-900/25"
                                  style={{ backgroundColor: item.colour.hex }}
                                />
                                {item.colour.name}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item._id)}
                        className="p-1.5 text-ink-400 transition hover:text-clay-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {item.customization?.isCustomized && (
                      <div className="mt-2 inline-flex w-fit flex-col gap-0.5 border border-line bg-canvas px-2.5 py-1.5 text-[11px] leading-4 text-ink-600">
                        <span className="font-semibold uppercase tracking-wideplus text-ink-900">Custom print</span>
                        {item.customization.text && <span>Text: “{item.customization.text}”</span>}
                        {item.customization.selectedDesign?.name && (
                          <span>Graphic: {item.customization.selectedDesign.name}</span>
                        )}
                        {item.customization.uploadedImage?.url && <span>Uploaded artwork included</span>}
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="inline-flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="p-2 text-ink-600 transition hover:text-ink-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-ink-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="p-2 text-ink-600 transition hover:text-ink-900"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-ink-900">
                        {formatINR(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          <aside className="h-fit lg:sticky lg:top-32">
            <div className="border border-line bg-white p-5 sm:p-6">
              <h2 className="eyebrow text-ink-900">Order Summary</h2>

              <div className="mt-5 space-y-2.5 text-sm text-ink-700">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-ink-900">{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Discount {coupon?.code && `(${coupon.code})`}
                    </span>
                    <span className="font-medium">−{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-ink-900">
                    {shippingCharge === 0 ? 'Free' : formatINR(shippingCharge)}
                  </span>
                </div>
              </div>

              {/* Coupon */}
              <div className="mt-5 border-t border-line pt-4">
                {coupon ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                      <Tag className="h-3.5 w-3.5" /> {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="inline-flex items-center gap-1 text-ink-400 hover:text-clay-600"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Promo code"
                      className="input flex-1 rounded-none"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="shrink-0 border border-ink-900 bg-transparent px-3.5 text-xs font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-canvas disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm font-medium text-ink-900">Total</span>
                <span className="text-lg font-semibold text-ink-900">{formatINR(totalAmount)}</span>
              </div>

              <p className="mt-1 text-[11px] text-ink-400">
                {totalAmount < 999 ? `Add ${formatINR(999 - totalAmount)} more for free shipping` : 'Free shipping applied'}
              </p>

              <Link to="/checkout" className="btn-primary mt-5 w-full justify-center">
                Proceed to checkout
              </Link>
              <Link
                to="/shop"
                className="mt-3 block text-center text-xs font-medium text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
