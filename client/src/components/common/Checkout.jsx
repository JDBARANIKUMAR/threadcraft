import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Check, Lock, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/formatPrice';
import { orderService } from '../../services/orderService';
import { launchRazorpayCheckout } from '../../services/razorpayService';

const CheckoutInput = ({ label, name, value, onChange, type = 'text', required = true, span2 = false }) => (
  <label className={span2 ? 'sm:col-span-2' : ''}>
    <span className="field-label">{label}</span>
    <input name={name} type={type} value={value} onChange={onChange} required={required} className="input" />
  </label>
);

const PAYMENT_STEPS = ['Address', 'Payment', 'Done'];
const getStepIndex = (view) => PAYMENT_STEPS.indexOf(view.charAt(0).toUpperCase() + view.slice(1));

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, subtotal, discountAmount, shippingCharge, totalAmount, coupon, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState('address'); // address | payment | done
  const [placedOrder, setPlacedOrder] = useState(null); // server order document
  const [paymentError, setPaymentError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // razorpay | cod

  const [delivery, setDelivery] = useState(() => ({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  }));

  // Support direct "Buy Now" custom item via location.state (survives refresh within session)
  const directItem = location.state?.customItem || null;
  const isDirectCheckout = !!directItem;

  const checkoutItems = useMemo(() => {
    if (isDirectCheckout) {
      return [
        {
          _id: directItem.productId || `custom-${Date.now()}`,
          productId: directItem.productId,
          name: directItem.name,
          price: directItem.price,
          quantity: directItem.quantity || 1,
          size: directItem.size,
          colour: directItem.colour,
          image: directItem.image,
          customization: directItem.customization,
        },
      ];
    }
    return cartItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirectCheckout, directItem, cartItems]);

  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems]
  );
  const checkoutShipping = checkoutSubtotal > 999 || checkoutSubtotal === 0 ? 0 : 99;
  const checkoutDiscount = isDirectCheckout ? 0 : discountAmount;
  const checkoutTotal = Math.max(0, checkoutSubtotal - checkoutDiscount + checkoutShipping);

  const updateDelivery = (event) =>
    setDelivery((current) => ({ ...current, [event.target.name]: event.target.value }));

  // ── Step 1: create the server order (server computes the real total) ────
  const createServerOrder = async () => {
    const res = await orderService.createOrder({
      items: checkoutItems.map((item) => ({
        product: item.productId || item._id,
        quantity: item.quantity,
        size: item.size,
        colour: item.colour,
        image: item.image,
        name: item.name,
        customization: item.customization || { isCustomized: false },
      })),
      shippingAddress: delivery,
      couponCode: coupon?.code,
      paymentMethod,
    });
    if (!res.success || !res.data?._id) {
      throw new Error(res.message || 'Could not create your order. Please try again.');
    }
    return res.data;
  };

  // ── Step 2: pay via Razorpay UPI and verify server-side ─────────────────
  const handlePay = async () => {
    setPaymentError('');

    if (isProcessingPayment) return; // duplicate-click guard
    setIsProcessingPayment(true);

    try {
      // Create (or reuse) the pending server order
      let order = placedOrder;
      if (!order) {
        order = await createServerOrder();
        setPlacedOrder(order);
      }

      // Cash on Delivery skips the gateway entirely; the server keeps the
      // order pending until delivery (status transition marks it paid).
      if (paymentMethod === 'cod') {
        if (!isDirectCheckout) clearCart();
        setPlacedOrder((current) => ({ ...order, paymentMethod: 'cod' }));
        setStep('done');
        window.scrollTo({ top: 0 });
        setIsProcessingPayment(false);
        return;
      }

      await new Promise((resolve, reject) => {
        launchRazorpayCheckout({
          orderId: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: delivery.fullName,
            email: user?.email || '',
            phone: delivery.phone,
          },
          onSuccess: (paymentInfo) => {
            // Payment verified server-side: order captured, cart cleared there
            if (!isDirectCheckout) clearCart();
            setPlacedOrder((current) => ({
              ...order,
              paymentId: paymentInfo.paymentId,
              paymentStatus: 'completed',
            }));
            setStep('done');
            window.scrollTo({ top: 0 });
            resolve();
          },
          onFailure: (errMsg) => {
            setIsProcessingPayment(false);
            setPaymentError(
              errMsg ||
                'Payment could not be completed. Your order is saved — you can retry the payment below.'
            );
            reject(new Error(errMsg || 'payment_failed'));
          },
        });
      });
    } catch (err) {
      if (err?.message !== 'payment_failed') {
        setIsProcessingPayment(false);
        setPaymentError(err.message || 'Something went wrong while placing your order.');
      }
    }
  };

  const handlePlaceOrder = () => {
    // Basic address validation before payment
    if (!delivery.fullName || !delivery.phone || !delivery.street || !delivery.city || !delivery.state || !delivery.postalCode) {
      setPaymentError('Please fill out all delivery fields before continuing.');
      return;
    }
    if (!/^\d{6}$/.test(delivery.postalCode.trim())) {
      setPaymentError('Please enter a valid 6-digit pincode.');
      return;
    }
    setPaymentError('');
    setStep('payment');
    window.scrollTo({ top: 0 });
  };

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (step === 'done' && placedOrder) {
    return (
      <section className="checkout-bg">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-20 pt-14 text-center sm:px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-canvas">
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <p className="eyebrow mt-6 text-ink-500">Order confirmed</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            {placedOrder.orderNumber}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-600">
            {placedOrder.paymentMethod === 'cod'
              ? 'Your order has been placed — pay in cash when it is delivered. You can track its status from your account.'
              : "Payment received and verified. A confirmation has been saved to your account — we'll email updates as your tee goes into production."}
          </p>

          {placedOrder.paymentId && (
            <p className="mt-5 bg-white px-3 py-2 text-xs text-ink-500">
              Payment ID <span className="font-mono text-ink-900">{placedOrder.paymentId}</span>
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/orders" className="btn-primary">View my orders</Link>
            <Link to="/shop" className="btn-secondary">Continue shopping</Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (checkoutItems.length === 0) {
    return (
      <section className="checkout-bg min-h-[70vh]">
        <div className="mx-auto w-full max-w-xl px-4 pb-20 pt-16 text-center sm:px-6">
          <div className="border border-line bg-white px-6 py-14">
            <ShoppingBag className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1.5} />
            <p className="mt-4 font-display text-lg font-semibold text-ink-900">Nothing to check out</p>
            <p className="mt-2 text-sm text-ink-500">Your cart is empty — add a tee before checking out.</p>
            <Link to="/shop" className="btn-primary mt-6">Back to shop</Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Main checkout view ───────────────────────────────────────────────────
  return (
    <section className="checkout-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* Steps indicator */}
        <div className="mb-8 flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-wideplus">
          {PAYMENT_STEPS.map((label, idx) => {
            const currentIdx = step === 'address' ? 0 : step === 'payment' ? 1 : 2;
            const isActive = idx === currentIdx;
            const isDone = idx < currentIdx;
            return (
              <React.Fragment key={label}>
                {idx > 0 && <span className="h-px w-8 bg-ink-300 sm:w-14" />}
                <span className={isActive ? 'text-ink-900' : isDone ? 'text-emerald-700' : 'text-ink-400'}>
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            {paymentError && (
              <div className="flex items-start gap-2.5 border border-clay-100 bg-clay-50 p-3.5 text-sm text-clay-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {step === 'address' && (
              <div className="border border-line bg-white p-5 sm:p-7">
                <p className="eyebrow text-ink-900">Delivery</p>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-ink-900">Shipping address</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <CheckoutInput label="Full name" name="fullName" value={delivery.fullName} onChange={updateDelivery} />
                  <CheckoutInput label="Phone number" name="phone" value={delivery.phone} onChange={updateDelivery} type="tel" />
                  <CheckoutInput label="Street address" name="street" value={delivery.street} onChange={updateDelivery} span2 />
                  <CheckoutInput label="City" name="city" value={delivery.city} onChange={updateDelivery} />
                  <CheckoutInput label="State" name="state" value={delivery.state} onChange={updateDelivery} />
                  <CheckoutInput label="PIN code" name="postalCode" value={delivery.postalCode} onChange={updateDelivery} />
                  <CheckoutInput label="Country" name="country" value={delivery.country} onChange={updateDelivery} />
                </div>

                <button type="button" onClick={handlePlaceOrder} className="btn-primary mt-6 w-full justify-center sm:w-auto">
                  Continue to payment
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="border border-line bg-white p-5 sm:p-7">
                <p className="eyebrow text-ink-900">Payment</p>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-ink-900">Payment method</h2>

                {/* Payment method selection */}
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[[
                    'razorpay',
                    'UPI',
                    'GPay, PhonePe, Paytm — instant, via Razorpay'
                  ], [
                    'razorpay',
                    'Card',
                    'Credit / debit / netbanking via Razorpay'
                  ], [
                    'cod',
                    'Cash on Delivery',
                    'Pay when your tee arrives'
                  ]].map(([value, label, desc], idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPaymentMethod(value)}
                      className={`border p-3 text-left transition ${
                        // Card and UPI both route through Razorpay; COD is separate
                        (paymentMethod === 'cod' ? 'cod' : paymentMethod) === value
                          ? 'border-ink-900 bg-canvasd'
                          : 'border-line hover:border-ink-400'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-ink-900">{label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-ink-500">{desc}</span>
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-ink-600">
                  {paymentMethod === 'cod' ? (
                    <>Pay {formatINR(checkoutTotal)} in cash when your order is delivered.</>
                  ) : (
                    <>{formatINR(checkoutTotal)} will be collected securely via Razorpay. UPI apps are offered first; cards and netbanking are available in the checkout window.</>
                  )}
                </p>

                <ul className="mt-4 space-y-2 text-xs text-ink-500">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700" /> Order {placedOrder?.orderNumber} is saved and awaiting payment
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700" /> Amount confirmed by our server — not editable in the browser
                  </li>
                  {paymentMethod === 'cod' ? (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-700" /> Payable on delivery — status updates as it ships
                    </li>
                  ) : (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-700" /> Payment is verified against a signed Razorpay confirmation before the order is marked paid
                    </li>
                  )}
                </ul>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isProcessingPayment}
                    className="btn-primary flex-1 justify-center"
                  >
                    <Lock className="h-4 w-4" />
                    {isProcessingPayment
                      ? 'Processing…'
                      : paymentMethod === 'cod'
                        ? `Place order · ${formatINR(checkoutTotal)} COD`
                        : `Pay ${formatINR(checkoutTotal)} now`}
                  </button>
                  <button type="button" onClick={() => setStep('address')} disabled={isProcessingPayment} className="btn-quiet justify-center">
                    Back
                  </button>
                </div>

                {paymentError && placedOrder && !isProcessingPayment && (
                  <button
                    type="button"
                    onClick={handlePay}
                    className="mt-4 text-xs font-semibold text-clay-600 underline underline-offset-2"
                  >
                    Retry payment for {placedOrder.orderNumber}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order summary */}
          <aside className="h-fit lg:sticky lg:top-32">
            <div className="border border-line bg-white p-5 sm:p-6">
              <h2 className="eyebrow text-ink-900">Your order</h2>

              <ul className="mt-4 max-h-72 space-y-4 overflow-y-auto pr-1">
                {checkoutItems.map((item) => (
                  <li key={item._id || item.productId} className="flex gap-3">
                    <div className="h-20 w-16 shrink-0 overflow-hidden bg-canvasd">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl">👕</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{item.name}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-500">
                        {item.size}
                        {item.colour?.name && (
                          <>
                            {' · '}
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-ink-900/25"
                              style={{ backgroundColor: item.colour.hex }}
                            />
                            {item.colour.name}
                          </>
                        )}
                        {' · '}Qty {item.quantity}
                      </p>
                      {item.customization?.isCustomized && (
                        <p className="mt-0.5 text-[11px] font-semibold text-clay-600">Custom print</p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {formatINR(item.price * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-ink-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-ink-900">{formatINR(checkoutSubtotal)}</span>
                </div>
                {checkoutDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-medium">−{formatINR(checkoutDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-ink-900">
                    {checkoutShipping === 0 ? 'Free' : formatINR(checkoutShipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink-900">
                  <span>Total</span>
                  <span>{formatINR(checkoutTotal)}</span>
                </div>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-line pt-4 text-[11px] text-ink-400">
                <Lock className="h-3 w-3" /> Payments processed securely by Razorpay
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
