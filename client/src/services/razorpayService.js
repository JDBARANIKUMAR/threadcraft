import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const authHeaders = () => {
  const token = localStorage.getItem('tc_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create a Razorpay payment order from an existing server-side order.
 * The amount is computed by the backend from the Order document — the client
 * never sends a price.
 */
export const createBackendPaymentOrder = async (orderId) => {
  const response = await axios.post(
    `${API_BASE_URL}/payment/create-order`,
    { orderId },
    { headers: authHeaders() }
  );
  return response.data;
};

/**
 * Verify the Razorpay payment signature on the backend. Only a `success: true`
 * response means the payment was actually captured and the order marked paid.
 */
export const verifyBackendPaymentSignature = async (payload) => {
  const response = await axios.post(
    `${API_BASE_URL}/payment/verify`,
    payload,
    { headers: authHeaders() }
  );
  return response.data;
};

/**
 * Record a failed/cancelled payment attempt so the server order state stays accurate.
 */
export const markBackendPaymentFailed = async (orderId, reason) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payment/failed`,
      { orderId, reason },
      { headers: authHeaders() }
    );
    return response.data;
  } catch {
    // Non-critical — the order simply remains pending server-side.
    return { success: false };
  }
};

/**
 * Launch Razorpay Checkout bound to an internal order.
 *
 * Flow:
 *   1. Backend creates a Razorpay order using the server-side order total
 *   2. Razorpay Checkout opens (UPI is surfaced first)
 *   3. On success the signature is verified on the backend, which captures the order
 *   4. Only a verified backend response calls onSuccess
 *   5. Cancellation/failure/dismissal calls onFailure and reports the state server-side
 */
export const launchRazorpayCheckout = async ({
  orderId,
  orderNumber,
  customer = {},
  onSuccess = () => {},
  onFailure = () => {},
}) => {
  const isScriptLoaded = await loadRazorpayScript();

  if (!isScriptLoaded) {
    onFailure('Failed to load Razorpay. Check your internet connection and try again.');
    return;
  }

  let settled = false;
  const succeed = (payload) => {
    if (settled) return;
    settled = true;
    onSuccess(payload);
  };
  const fail = async (message) => {
    if (settled) return;
    settled = true;
    if (orderId) await markBackendPaymentFailed(orderId, message);
    onFailure(message);
  };

  try {
    const orderRes = await createBackendPaymentOrder(orderId);

    if (!orderRes.success || !orderRes.data?.razorpayOrderId || !orderRes.data?.keyId) {
      throw new Error(orderRes.message || 'Could not initiate Razorpay payment');
    }

    const { razorpayOrderId, keyId, amount, currency, orderNumber: serverOrderNumber } = orderRes.data;
    const contact = String(customer.phone || '').replace(/\D/g, '').slice(-10);

    const options = {
      key: keyId,
      amount,
      currency: currency || 'INR',
      name: 'THREADCRAFT STUDIO',
      description: `Order ${serverOrderNumber || orderNumber || ''}`,
      order_id: razorpayOrderId,
      // Surface UPI first — GPay, PhonePe, Paytm and UPI ID all route through Razorpay
      prefill: {
        name: customer.name || '',
        email: customer.email && customer.email.includes('@') ? customer.email : '',
        contact: contact.length === 10 ? contact : '',
        method: 'upi',
      },
      notes: {
        internal_order_id: orderId,
        order_number: serverOrderNumber || orderNumber || '',
      },
      theme: { color: '#1e1c19' },
      handler: async (response) => {
        try {
          const verification = await verifyBackendPaymentSignature({
            orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verification.success) {
            succeed({
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              orderNumber: verification.data?.orderNumber || serverOrderNumber,
              totalAmount: verification.data?.totalAmount,
              alreadyVerified: !!verification.data?.alreadyVerified,
              verifiedAt: verification.data?.verifiedAt || new Date().toISOString(),
            });
          } else {
            fail(verification.message || 'Payment verification failed');
          }
        } catch (err) {
          fail(err.message || 'Error verifying payment signature');
        }
      },
      modal: {
        ondismiss: () => {
          fail('Payment was cancelled before completion. Your order is saved as pending.');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (failedRes) => {
      fail(failedRes.error?.description || failedRes.error?.reason || 'Payment transaction failed');
    });
    rzp.open();
  } catch (error) {
    fail(error.message || 'Payment checkout initialization failed');
  }
};
