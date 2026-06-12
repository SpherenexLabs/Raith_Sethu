const BACKEND_API = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export const RAZORPAY_TEST_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

export const loadRazorpayCheckout = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
    document.body.appendChild(script);
  });
};

const postJson = async (endpoint, body) => {
  const response = await fetch(`${BACKEND_API}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Razorpay request failed.');
  }

  return result;
};

export const createRazorpayOrder = async ({ amount, receipt, notes }) => {
  return postJson('/razorpay-create-order', {
    amount,
    currency: 'INR',
    receipt,
    notes
  });
};

export const verifyRazorpayPayment = async (paymentResponse) => {
  return postJson('/razorpay-verify-payment', paymentResponse);
};
