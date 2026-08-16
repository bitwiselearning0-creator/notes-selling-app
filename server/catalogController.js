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
    const emailParam = req.query.email ? req.query.email.trim().toLowerCase() : '';
    let cleanEmail = emailParam || (userId && userId.includes('@') ? userId.trim().toLowerCase() : '');
    
    if (!cleanEmail && userId) {
      const pRes = await db.query('SELECT LOWER(email) as email FROM profiles WHERE id = $1', [userId]);
      if (pRes.rows.length > 0) cleanEmail = pRes.rows[0].email;
    }

    const result = await db.query(
      `SELECT DISTINCT p.* FROM purchases p
       LEFT JOIN profiles pr ON (LOWER(pr.email) = $2 AND pr.email != '')
       WHERE (
         LOWER(p.user_id) = LOWER($1)
         OR ($2 != '' AND LOWER(p.user_id) = $2)
         OR (pr.id IS NOT NULL AND LOWER(p.user_id) = LOWER(pr.id))
       )
         AND p.status = 'active'
         AND (p.expires_at IS NULL OR p.expires_at > NOW())`,
      [userId, cleanEmail]
    );
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

const getAllPurchases = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        COALESCE(pr.email, p.user_id) AS user_email,
        pr.name AS user_name,
        COALESCE(n.title, b.title, p.item_id) AS item_name,
        COALESCE(n.subject, b.subject, p.item_id) AS item_subject
      FROM purchases p
      LEFT JOIN profiles pr ON (LOWER(pr.email) = LOWER(p.user_id) OR pr.id::text = p.user_id)
      LEFT JOIN notes n ON n.id = p.item_id
      LEFT JOIN bundles b ON b.id = p.item_id
      WHERE p.status = 'active'
      ORDER BY p.granted_at DESC
    `);
    return res.json({ data: result.rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: [], error: err.message });
  }
};

const grantPurchase = async (req, res) => {
  try {
    const { userId, itemId, itemType, amount, razorpayPaymentId } = req.body;
    const cleanUserId = userId ? userId.trim().toLowerCase() : '';

    const result = await db.query(
      `INSERT INTO purchases (user_id, item_id, item_type, amount, razorpay_payment_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [cleanUserId, itemId, itemType || 'note', amount || 0, razorpayPaymentId || null]
    );

    return res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('Grant Purchase Error:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

const revokePurchase = async (req, res) => {
  try {
    const { userId, itemId, purchaseId } = req.body;

    if (purchaseId) {
      await db.query(`UPDATE purchases SET status = 'revoked' WHERE id = $1`, [purchaseId]);
    } else if (userId && itemId) {
      await db.query(
        `UPDATE purchases SET status = 'revoked' WHERE (user_id = $1 OR user_id IN (SELECT id FROM profiles WHERE LOWER(email) = LOWER($1))) AND item_id = $2`,
        [userId, itemId]
      );
    } else {
      return res.status(400).json({ success: false, error: 'purchaseId or userId+itemId required' });
    }

    return res.json({ success: true, error: null });
  } catch (err) {
    console.error('Revoke Purchase Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const revokeAllPurchases = async (req, res) => {
  try {
    await db.query(`UPDATE purchases SET status = 'revoked'`);
    return res.json({ success: true, error: null });
  } catch (err) {
    console.error('Revoke All Purchases Error:', err);
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

const processPdfUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (rawUrl.startsWith('data:')) {
    try {
      const uploadsDir = '/var/www/bitwise-learning/uploads';
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const base64Data = rawUrl.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/${fileName}`;
    } catch (e) {
      console.error('Failed to save base64 PDF to disk:', e);
    }
  }
  return rawUrl;
};

const addNote = async (req, res) => {
  try {
    const { title, subject, branch, year, semester, price, originalPrice, description, previewUrl, pdfUrl, pagesCount, topics, type } = req.body;
    const prefix = type === 'pyqs' ? 'pyq_' : 'note_';
    const id = prefix + Math.random().toString(36).substring(2, 11);
    const finalUrl = processPdfUrl(previewUrl || pdfUrl || '');

    // Ensure columns exist gracefully
    await db.query(`
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS preview_url TEXT;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS pages_count INTEGER DEFAULT 0;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS topics TEXT;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'notes';
    `).catch(() => {});

    const result = await db.query(
      `INSERT INTO notes (id, title, subject, branch, year, semester, price, original_price, description, pdf_url, preview_url, pages_count, topics, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13)
       RETURNING *`,
      [id, title, subject, branch || 'CSE/IT', year || '1st Year', semester || 1, price || 0, originalPrice || 0, description || '', finalUrl, pagesCount || 0, Array.isArray(topics) ? JSON.stringify(topics) : (topics || ''), type || 'notes']
    );

    return res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('Add Note Error:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, branch, year, semester, price, originalPrice, description, previewUrl, pdfUrl, pagesCount, topics, type } = req.body;
    const finalUrl = processPdfUrl(previewUrl || pdfUrl || '');

    const result = await db.query(
      `UPDATE notes 
       SET title = $1, subject = $2, branch = $3, year = $4, semester = $5, price = $6, original_price = $7, description = $8, pdf_url = $9, preview_url = $9, pages_count = $10, topics = $11, type = $12
       WHERE id = $13
       RETURNING *`,
      [title, subject, branch || 'CSE/IT', year, semester || 1, price || 0, originalPrice || 0, description || '', finalUrl, pagesCount || 0, Array.isArray(topics) ? JSON.stringify(topics) : (topics || ''), type || 'notes', id]
    );

    return res.json({ data: result.rows[0] || null, error: null });
  } catch (err) {
    console.error('Update Note Error:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM purchases WHERE item_id = $1', [id]);
    await db.query('DELETE FROM notes WHERE id = $1', [id]);
    return res.json({ success: true, error: null });
  } catch (err) {
    console.error('Delete Note Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const fs = require('fs');
const path = require('path');

const uploadFile = async (req, res) => {
  try {
    const { fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ url: null, error: 'No file data provided' });
    }

    if (typeof fileData === 'string' && (fileData.startsWith('http://') || fileData.startsWith('https://'))) {
      return res.json({ url: fileData, error: null });
    }

    const uploadsDir = '/var/www/bitwise-learning/uploads';
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (e) {}
    }

    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;
    return res.json({ url: publicUrl, error: null });
  } catch (err) {
    console.error('File Upload Error:', err);
    return res.status(500).json({ url: null, error: err.message });
  }
};

const addBundle = async (req, res) => {
  try {
    const { title, description, price, originalPrice, year, semester, note_ids, notesIds, subject, type } = req.body;
    const isSubjectBundle = type === 'subject' || (subject && subject.trim() !== '' && !subject.toLowerCase().includes('semester combo'));
    const prefix = isSubjectBundle ? 'subject_pack_' : 'bundle_sem_';
    const id = prefix + Math.random().toString(36).substring(2, 11);
    const nIds = notesIds || note_ids || [];

    const result = await db.query(
      `INSERT INTO bundles (id, title, description, price, original_price, year, subject, note_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, title, description || '', price || 0, originalPrice || price || 0, year || '1st Year', subject || '', nIds]
    );

    return res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('Add Bundle Error:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

const updateBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, originalPrice, year, subject, note_ids, notesIds } = req.body;
    const nIds = notesIds || note_ids || [];

    const result = await db.query(
      `UPDATE bundles
       SET title = $1, description = $2, price = $3, original_price = $4, year = $5, subject = $6, note_ids = $7
       WHERE id = $8
       RETURNING *`,
      [title, description || '', price || 0, originalPrice || price || 0, year || '1st Year', subject || '', nIds, id]
    );

    return res.json({ data: result.rows[0] || null, error: null });
  } catch (err) {
    console.error('Update Bundle Error:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

const deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM bundles WHERE id = $1', [id]);
    return res.json({ success: true, error: null });
  } catch (err) {
    console.error('Delete Bundle Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const addPlaylist = async (req, res) => {
  try {
    const { title, subject, year, videoCount, video_count, youtubeUrl, youtube_url, playlistId, thumbnail, thumbnailUrl } = req.body;
    const id = 'play_' + Math.random().toString(36).substring(2, 11);
    const yUrl = youtubeUrl || youtube_url || playlistId || '';
    const thumb = thumbnailUrl || thumbnail || '';

    const result = await db.query(
      `INSERT INTO playlists (id, title, subject, year, video_count, youtube_url, thumbnail)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, title, subject, year || '1st Year', videoCount || video_count || 0, yUrl, thumb]
    );

    return res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('Add Playlist Error:', err);
    return res.status(500).json({ data: null, error: err.message });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM playlists WHERE id = $1', [id]);
    return res.json({ success: true, error: null });
  } catch (err) {
    console.error('Delete Playlist Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  uploadFile,
  getBundles,
  addBundle,
  updateBundle,
  deleteBundle,
  getPlaylists,
  addPlaylist,
  deletePlaylist,
  getUserPurchases,
  getAllPurchases,
  grantPurchase,
  revokePurchase,
  revokeAllPurchases,
  getAllProfiles,
};
