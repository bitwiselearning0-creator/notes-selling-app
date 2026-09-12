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
 * Verifies Razorpay payment signature, auto-captures phone number, and grants purchase in database.
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, itemId, itemType, amount, phone } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({ success: false, data: null, error: 'User ID and Item ID are required.' });
    }

    if (!razorpayPaymentId || !razorpayPaymentId.startsWith('pay_')) {
      return res.status(400).json({ success: false, data: null, error: 'Valid Razorpay Payment ID (pay_...) is required.' });
    }

    // 1. Replay / Idempotency Check: If already recorded, return success smoothly
    const existingPurchase = await db.query(
      "SELECT * FROM purchases WHERE razorpay_payment_id = $1 AND status = 'active' LIMIT 1",
      [razorpayPaymentId.trim()]
    );
    if (existingPurchase.rows.length > 0) {
      // Find user profile to return
      const userRes = await db.query(
        'SELECT id, name, email, phone, role, created_at FROM profiles WHERE id = $1 OR LOWER(email) = LOWER($1)',
        [userId]
      );
      return res.json({
        success: true,
        data: existingPurchase.rows[0],
        user: userRes.rows[0] || null,
        message: 'Payment already verified and active.',
        error: null
      });
    }

    // 2. Cryptographic HMAC SHA-256 Signature Verification (if orderId and signature provided)
    if (razorpayOrderId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        console.error('Razorpay signature mismatch:', { generatedSignature, razorpaySignature });
        return res.status(400).json({ 
          success: false, 
          data: null, 
          error: 'Payment verification failed: Invalid transaction signature.' 
        });
      }
    }

    // 3. Verify payment status with Razorpay API
    let paymentData = null;
    try {
      const verifyResp = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId.trim()}`, {
        method: 'GET',
        headers: { 'Authorization': getAuthHeader() }
      });
      paymentData = await verifyResp.json();
      if (!verifyResp.ok || (paymentData.status !== 'captured' && paymentData.status !== 'authorized')) {
        return res.status(400).json({
          success: false,
          data: null,
          error: `Payment verification failed: Transaction status is '${paymentData?.status || 'unauthorized'}'.`
        });
      }
    } catch (verifyErr) {
      console.error('Payment verification error with gateway:', verifyErr);
      return res.status(500).json({
        success: false,
        data: null,
        error: 'Failed to verify transaction with payment gateway.'
      });
    }

    // Auto-capture contact phone number directly from Razorpay payment details
    let contactPhone = phone || (paymentData && paymentData.contact) || '';

    // Find profile
    let resolvedUserId = userId;
    let userProfile = null;
    try {
      const pRes = await db.query(
        'SELECT id, name, email, phone, role FROM profiles WHERE id = $1 OR LOWER(email) = LOWER($1) LIMIT 1',
        [userId]
      );
      if (pRes.rows.length > 0) {
        userProfile = pRes.rows[0];
        resolvedUserId = userProfile.id;
      }
    } catch (e) {}

    // Update user's profile with their verified checkout phone number
    if (contactPhone) {
      const cleanPhone = contactPhone.replace(/[^\d+]/g, '').replace(/^\+91/, '');
      if (cleanPhone) {
        try {
          await db.query(
            `UPDATE profiles 
             SET phone = $1, updated_at = NOW() 
             WHERE id = $2 OR LOWER(email) = LOWER($2)`,
            [cleanPhone, userId]
          );
          if (userProfile) userProfile.phone = cleanPhone;
        } catch (updErr) {
          console.warn('Could not update profile phone from payment:', updErr);
        }
      }
    }

    const paidRupees = paymentData?.amount ? (paymentData.amount / 100) : (amount || 0);

    // Grant purchase in PostgreSQL DB (with 180-day expiry)
    const result = await db.query(
      `INSERT INTO purchases (user_id, item_id, item_type, amount, razorpay_payment_id, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW() + INTERVAL '180 days')
       RETURNING *`,
      [resolvedUserId, itemId, itemType || 'note', paidRupees, razorpayPaymentId.trim()]
    );

    // Fetch updated user profile
    const userRes = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM profiles WHERE id = $1 OR LOWER(email) = LOWER($1)',
      [resolvedUserId]
    );

    return res.json({ success: true, data: result.rows[0], user: userRes.rows[0] || userProfile, error: null });
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
      // Auto-capture and update phone number from Razorpay contact
      if (paymentData.contact && userId) {
        const cleanPhone = paymentData.contact.replace(/[^\d+]/g, '').replace(/^\+91/, '');
        if (cleanPhone) {
          try {
            await db.query(
              `UPDATE profiles 
               SET phone = $1, updated_at = NOW() 
               WHERE id = $2 OR LOWER(email) = LOWER($2)`,
              [cleanPhone, userId]
            );
          } catch (updErr) {
            console.warn('Could not update profile phone from manual payment:', updErr);
          }
        }
      }

      // Grant purchase in PostgreSQL DB
      const result = await db.query(
        `INSERT INTO purchases (user_id, item_id, item_type, amount, razorpay_payment_id, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING *`,
        [userId, itemId, itemType || 'note', (paymentData.amount / 100) || 0, paymentId]
      );

      const userRes = await db.query(
        'SELECT id, name, email, phone, role, created_at FROM profiles WHERE id = $1 OR LOWER(email) = LOWER($1)',
        [userId]
      );

      return res.json({ success: true, message: 'Payment verified successfully! Access granted.', data: result.rows[0], user: userRes.rows[0] || null, error: null });
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
