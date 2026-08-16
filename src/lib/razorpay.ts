import { vpsApi } from './vpsApi';

// Razorpay Payment Gateway Helper Module

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TFg9OXfFsCcrwA';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

/**
 * Dynamically loads the Razorpay Web Checkout JS script if not already present.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export interface RazorpayCheckoutParams {
  title: string;
  price: number;
  type: 'notes' | 'bundle';
  user: {
    name: string;
    email: string;
    phone: string;
  } | null;
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}

/**
 * Opens the official Razorpay Checkout modal overlay.
 */
export const openRazorpayCheckout = async ({
  title,
  price,
  type,
  user,
  onSuccess,
  onFailure,
  onDismiss
}: RazorpayCheckoutParams): Promise<boolean> => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    if (onFailure) onFailure('Razorpay SDK failed to load. Please check your internet connection.');
    return false;
  }

  // Attempt to create a trackable Razorpay Order ID via VPS API
  let orderId: string | undefined;
  try {
    const orderRes = await vpsApi.createRazorpayOrder(price, { item_title: title, item_type: type });
    if (orderRes?.data?.id) {
      orderId = orderRes.data.id;
    }
  } catch (e) {
    console.warn('Could not pre-create Razorpay Order ID, falling back to standard checkout:', e);
  }

  const amountInPaise = Math.round(price * 100);

  const options: any = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: 'INR',
    name: 'Bitwise Learning',
    description: `${type === 'bundle' ? 'Semester Combo' : 'Study Notes'}: ${title}`,
    image: '/logo.jpg',
    order_id: orderId,
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || ''
    },
    notes: {
      item_title: title,
      item_type: type
    },
    theme: {
      color: '#3b82f6'
    },
    handler: function (response: RazorpaySuccessResponse) {
      if (response && response.razorpay_payment_id) {
        onSuccess(response);
      } else {
        if (onFailure) onFailure('Payment verification failed.');
      }
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      }
    }
  };

  try {
    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      console.error('Razorpay payment failed:', response.error);
      if (onFailure) onFailure(response.error?.description || 'Payment failed. Please try again.');
    });
    rzp.open();
    return true;
  } catch (err) {
    console.error('Error launching Razorpay modal:', err);
    if (onFailure) onFailure('Could not launch payment gateway.');
    return false;
  }
};
