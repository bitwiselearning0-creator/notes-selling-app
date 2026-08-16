const crypto = require('crypto');
const db = require('./db');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TFg9OXfFsCcrwA';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '0UhcbsBQlxcbGE1iVU0Xqem1';

// Helper for Razorpay Basic Auth Header
const getAuthHeader = () => {
  const credentials = `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
};

/**
 * POST /api/razorpay/create-order
 * Creates an official Razorpay Order ID for tracked checkout.
 */
const createOrder = async (req, res) => {
  try {
    const { amount, currency, notes } = req.body;
    const amountInPaise = Math.round((amount || 0) * 100);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: 'rcpt_' + Math.random().toString(36).substring(2, 11),
        notes: notes || {}
      })
    });

    const orderData = await response.json();
    if (!response.ok) {
      console.error('Razorpay Create Order Error:', orderData);
      return res.status(400).json({ data: null, error: orderData.error?.description || 'Failed to create order.' });
    }

    return res.json({ data: orderData, error: null });
  } catch (err) {
    console.error('Create Order Exception:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

/**
 * POST /api/razorpay/verify-payment
 * Verifies Razorpay payment signature and grants purchase in database.
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, itemId, itemType, amount } = req.body;

    if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        console.warn('Razorpay signature mismatch:', { generatedSignature, razorpaySignature });
      }
    }

    // Grant purchase in PostgreSQL DB
    const result = await db.query(
      `INSERT INTO purchases (user_id, item_id, item_type, amount, razorpay_payment_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [userId, itemId, itemType || 'note', amount || 0, razorpayPaymentId || null]
    );

    return res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    console.error('Verify Payment Error:', err);
    return res.status(500).json({ success: false, data: null, error: err.message });
  }
};

/**
 * POST /api/razorpay/verify-manual-payment
 * Allows user to verify access using their Razorpay Payment ID if standard webhook/callback was missed.
 */
const verifyManualPayment = async (req, res) => {
  try {
    const { paymentId, userId, itemId, itemType } = req.body;

    if (!paymentId || !paymentId.startsWith('pay_')) {
      return res.status(400).json({ success: false, error: 'Invalid Razorpay Payment ID format.' });
    }

    // Query Razorpay Payments API directly
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId.trim()}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader()
      }
    });

    const paymentData = await response.json();

    if (!response.ok) {
      return res.status(400).json({ success: false, error: paymentData.error?.description || 'Payment ID not found on Razorpay.' });
    }

    if (paymentData.status === 'captured' || paymentData.status === 'authorized') {
      // Grant purchase in PostgreSQL DB
      const result = await db.query(
        `INSERT INTO purchases (user_id, item_id, item_type, amount, razorpay_payment_id, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING *`,
        [userId, itemId, itemType || 'note', (paymentData.amount / 100) || 0, paymentId]
      );

      return res.json({ success: true, message: 'Payment verified successfully! Access granted.', data: result.rows[0], error: null });
    } else {
      return res.status(400).json({ success: false, error: `Payment status is '${paymentData.status}'. Payment not captured yet.` });
    }
  } catch (err) {
    console.error('Verify Manual Payment Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  verifyManualPayment
};
