const db = require('./db');

const SYSTEM_REVOKED_MARKER_UUID = '00000000-0000-0000-0000-000000000000';

const getNotes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notes ORDER BY subject ASC, title ASC');
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

const getBundles = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bundles ORDER BY subject ASC, title ASC');
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

const getPlaylists = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM playlists ORDER BY subject ASC, title ASC');
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

const getUserPurchases = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `SELECT * FROM purchases WHERE user_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

const getAllPurchases = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM purchases ORDER BY granted_at DESC');
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

const grantPurchase = async (req, res) => {
  try {
    const { userId, itemId, itemType, amount, razorpayPaymentId } = req.body;

    const result = await db.query(
      `INSERT INTO purchases (user_id, item_id, item_type, amount, razorpay_payment_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [userId, itemId, itemType || 'note', amount || 0, razorpayPaymentId || null]
    );

    return res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('Grant Purchase Error:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

const revokePurchase = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    await db.query(
      `UPDATE purchases SET status = 'revoked' WHERE user_id = $1 AND item_id = $2`,
      [userId, itemId]
    );

    return res.json({ success: true, error: null });
  } catch (err) {
    console.error('Revoke Purchase Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getAllProfiles = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, phone, role, created_at FROM profiles ORDER BY created_at DESC');
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

module.exports = {
  getNotes,
  getBundles,
  getPlaylists,
  getUserPurchases,
  getAllPurchases,
  grantPurchase,
  revokePurchase,
  getAllProfiles,
};
