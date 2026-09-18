import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartService } from '../services/cartService';
import { couponService } from '../services/couponService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { readAccountData, writeAccountData } from '../utils/accountStorage';

// Local shipping policy mirrors the server's; the server re-validates at order time.
const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_FEE = 99;

const makeLocalItemId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast, success, error: toastError } = useToast();
  const guestModeRef = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // ── Load cart ────────────────────────────────────────────────────────────
  // Authenticated: single source of truth is the server cart (/api/cart).
  // Guest: localStorage account data (the server cart requires a user).
  useEffect(() => {
    if (authLoading) return;

    const loadServerCart = async () => {
      try {
        const res = await cartService.getCart();
        if (res?.success && Array.isArray(res.data?.items)) {
          const serverItems = res.data.items.map((item) => ({
            _id: item._id,
            productId: item.product?._id || item.product,
            product: item.product || undefined,
            name: item.product?.name || item.customization?.text || 'Custom Tee',
            image: item.product?.images?.[0] || item.customization?.previewSnapshot || '',
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            colour: item.colour,
            customization: item.customization || { isCustomized: false },
          }));
          setItems(serverItems);
        }
      } catch {
        // Server cart unavailable — fall back to local cart for this session
        guestModeRef.current = true;
        setItems(readAccountData(user).cart);
      }
    };

    if (user) {
      loadServerCart();
    } else {
      setItems(readAccountData(null).cart);
    }
    setCoupon(null);
  }, [user, authLoading]);

  // ── Persist guest cart to localStorage ───────────────────────────────
  // Guest carts survive refresh (bug fix): every guest cart change is written
  // to the 'guest' storage bucket and merges into the server cart on login.
  useEffect(() => {
    if (authLoading || user) return;
    writeAccountData(null, { ...readAccountData(null), cart: items });
  }, [items, user, authLoading]);

  // Merge a guest cart into the server cart after login
  useEffect(() => {
    if (!user || authLoading) return;
    const mergeGuestCart = async () => {
      const guestCart = readAccountData(null).cart;
      if (!guestCart.length) return;
      try {
        for (const item of guestCart) {
          await cartService.addToCart({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            colour: item.colour,
            customization: item.customization,
          });
        }
        writeAccountData(null, { ...readAccountData(null), cart: [] });
      } catch {
        // Silent — next successful server cart load will reconcile
      }
    };
    mergeGuestCart();
  }, [user, authLoading]);

  // ── Mutations (optimistic local state, server as source of truth) ────────
  const addToCart = useCallback(
    async (item, goToCheckout = false) => {
      const isCustomized = !!(item.customization && (
        item.customization.text ||
        (item.customization.selectedDesign && item.customization.selectedDesign.url) ||
        (item.customization.uploadedImage && item.customization.uploadedImage.url) ||
        item.customization.isCustomized
      ));

      const payload = {
        productId: item.productId,
        quantity: item.quantity || 1,
        size: item.size || 'M',
        colour: item.colour || { name: 'Jet Black', hex: '#111827' },
        customization: isCustomized
          ? {
              isCustomized: true,
              printSide: item.customization.printSide || 'front',
              previewSnapshot: item.customization.previewSnapshot || '',
              text: item.customization.text || '',
              textProps: item.customization.textProps || {},
              selectedDesign: item.customization.selectedDesign || {},
              uploadedImage: item.customization.uploadedImage || {},
              customPrintCost: Number(item.customization.customPrintCost || item.customization.extraCharge || 0),
            }
          : { isCustomized: false },
      };

      const localEntry = {
        _id: makeLocalItemId(),
        productId: item.productId,
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity || 1,
        size: payload.size,
        colour: payload.colour,
        customization: payload.customization,
      };

      if (user && !guestModeRef.current) {
        try {
          const res = await cartService.addToCart(payload);
          if (res?.success && res.data?.items) {
            const serverItems = res.data.items.map((serverItem) => ({
              _id: serverItem._id,
              productId: serverItem.product?._id || serverItem.product,
              product: serverItem.product || localEntry.product,
              name: serverItem.product?.name || localEntry.name,
              image: serverItem.product?.images?.[0] || localEntry.image,
              price: serverItem.price,
              quantity: serverItem.quantity,
              size: serverItem.size,
              colour: serverItem.colour,
              customization: serverItem.customization || { isCustomized: false },
            }));
            setItems(serverItems);
            success('Added to cart!');
            return;
          }
        } catch {
          // Fall through to guest cart handling below
        }
      }

      if (user && !guestModeRef.current) {
        toastError('Could not update cart. Is the server running?');
        return;
      }

      // Guest / offline path — colour, size and variant survive local storage
      setItems((prev) => {
        const customizedName = localEntry.name && localEntry.name.includes('(Customized)');
        const isUnique = isCustomized || customizedName;
        if (!isUnique) {
          const existingIdx = prev.findIndex(
            (i) =>
              i.productId === localEntry.productId &&
              i.size === localEntry.size &&
              i.colour?.hex === localEntry.colour?.hex &&
              i.colour?.name === localEntry.colour?.name &&
              (!i.customization || !i.customization.isCustomized)
          );
          if (existingIdx > -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + localEntry.quantity,
            };
            return updated;
          }
        }
        return [...prev, localEntry];
      });
      success('Added to cart!');
    },
    [user, success, toastError]
  );

  const updateQuantity = useCallback(
    async (itemId, newQuantity) => {
      if (newQuantity < 1) return;
      const target = itemsRef.current.find((i) => i._id === itemId);
      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, quantity: newQuantity } : item))
      );
      if (user && !guestModeRef.current && target && !String(itemId).startsWith('item-')) {
        try {
          await cartService.updateQuantity(itemId, newQuantity);
        } catch {
          guestModeRef.current = true;
        }
      }
    },
    [user]
  );

  const removeItem = useCallback(
    async (itemId) => {
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      showToast('Item removed from cart', 'info');
      if (user && !guestModeRef.current && !String(itemId).startsWith('item-')) {
        try {
          await cartService.removeItem(itemId);
        } catch {
          guestModeRef.current = true;
        }
      }
    },
    [user, showToast]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    setCoupon(null);
    if (user && !guestModeRef.current) {
      try {
        await cartService.clearCart();
      } catch {
        guestModeRef.current = true;
      }
    }
  }, [user]);

  // ── Totals ───────────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (coupon && subtotal > 0) {
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }
  }

  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING_FEE;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCharge);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      toastError('Please enter a coupon code');
      return false;
    }

    try {
      setLoading(true);
      const res = await couponService.validateCoupon(code, subtotal);
      if (res.success) {
        setCoupon(res.data);
        success(`Coupon "${res.data.code}" applied! You saved ₹${res.data.discountAmount}`);
        return true;
      }
    } catch (err) {
      toastError(err.message || 'Invalid coupon code');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    showToast('Coupon removed', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        discountAmount,
        shippingCharge,
        totalAmount,
        coupon,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
