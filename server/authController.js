const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'bitwise_jwt_super_secret_key_2026_vps';

// Configure Nodemailer for Direct OTP Email Delivery
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'bitwiselearning0@gmail.com',
    pass: process.env.SMTP_PASS || ''
  }
});

const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const signUp = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').trim().replace(/\D/g, '');

    // Check if user already exists
    const existing = await db.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const role = cleanEmail === 'bitwiselearning0@gmail.com' ? 'admin' : 'student';

    const insertRes = await db.query(
      `INSERT INTO profiles (id, name, email, phone, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, created_at`,
      [userId, name.trim(), cleanEmail, cleanPhone, role, passwordHash]
    );

    const user = insertRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ data: user, token, error: null });
  } catch (err) {
    console.error('SignUp Error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const result = await db.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email. Please sign up.' });
    }

    const user = result.rows[0];
    if (user.password_hash) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid password. Please try again.' });
      }
    }

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    };

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ data: profile, token, error: null });
  } catch (err) {
    console.error('SignIn Error:', err);
    return res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
};

const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const result = await db.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found registered with this email address.' });
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await db.query('INSERT INTO otps (email, code, expires_at) VALUES ($1, $2, $3)', [cleanEmail, otpCode, expiresAt]);

    // Send direct OTP Email via Nodemailer if SMTP configured, or log fallback
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: '"Bitwise Learning" <bitwiselearning0@gmail.com>',
        to: cleanEmail,
        subject: 'Your 6-Digit Password Reset Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #ffffff; border-radius: 12px;">
            <h2 style="color: #60a5fa;">Bitwise Learning</h2>
            <p>Your 6-digit password reset verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #facc15; padding: 16px 0;">
              ${otpCode}
            </div>
            <p style="color: #94a3b8; font-size: 13px;">This code will expire in 15 minutes. Do not share it with anyone.</p>
          </div>
        `
      });
    }

    return res.json({ success: true, message: `OTP code generated and sent to ${cleanEmail}`, error: null });
  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({ error: 'Failed to send OTP code. Please try again.' });
  }
};

const verifyOtpAndUpdatePassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    const otpResult = await db.query(
      'SELECT * FROM otps WHERE LOWER(email) = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [cleanEmail, cleanCode]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit verification code. Please request a new code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updateRes = await db.query(
      'UPDATE profiles SET password_hash = $1 WHERE LOWER(email) = $2 RETURNING id, name, email, phone, role, created_at',
      [passwordHash, cleanEmail]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Clear used OTPs
    await db.query('DELETE FROM otps WHERE LOWER(email) = $1', [cleanEmail]);

    const user = updateRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ data: user, token, error: null });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
};

const registerDeviceSession = async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    await db.query(
      `INSERT INTO active_sessions (user_id, session_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
      [userId, sessionId]
    );

    return res.json({ sessionId, error: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  signUp,
  signIn,
  sendPasswordResetOtp,
  verifyOtpAndUpdatePassword,
  registerDeviceSession,
};
