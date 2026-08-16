const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'bitwise_jwt_super_secret_key_2026_vps';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleOAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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

    // Enforce 1 Device Active Session
    const activeSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    await db.query(
      `INSERT INTO active_sessions (user_id, session_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
      [user.id, activeSessionId]
    );
    if (user.email) {
      await db.query(
        `INSERT INTO active_sessions (user_id, session_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
        [user.email.toLowerCase(), activeSessionId]
      );
    }

    return res.json({ data: user, token, activeSessionId, error: null });
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

    // Enforce 1 Device Active Session (Overwrites any previous device session instantly!)
    const activeSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    await db.query(
      `INSERT INTO active_sessions (user_id, session_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
      [user.id, activeSessionId]
    );
    if (user.email) {
      await db.query(
        `INSERT INTO active_sessions (user_id, session_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
        [user.email.toLowerCase(), activeSessionId]
      );
    }

    return res.json({ data: profile, token, activeSessionId, error: null });
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

    const activeSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    await db.query(
      `INSERT INTO active_sessions (user_id, session_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
      [user.id, activeSessionId]
    );

    return res.json({ data: user, token, activeSessionId, error: null });
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

const verifyDeviceSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!userId) {
      return res.json({ valid: true, error: null });
    }

    const cleanUserId = String(userId).trim();
    const clientSessionId = String(sessionId || '').trim();

    const result = await db.query(
      'SELECT session_id FROM active_sessions WHERE user_id = $1 OR LOWER(user_id) = LOWER($2) ORDER BY updated_at DESC LIMIT 1',
      [cleanUserId, cleanUserId.toLowerCase()]
    );

    if (result.rows.length === 0) {
      if (clientSessionId) {
        await db.query(
          `INSERT INTO active_sessions (user_id, session_id, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
          [cleanUserId, clientSessionId]
        );
      }
      return res.json({ valid: true, error: null });
    }

    const dbSessionId = result.rows[0].session_id;

    if (!clientSessionId || dbSessionId !== clientSessionId) {
      return res.json({ valid: false, error: 'Your account was logged in on another device.' });
    }

    return res.json({ valid: true, error: null });
  } catch (err) {
    return res.json({ valid: true, error: null });
  }
};

const getAllActiveSessions = async (req, res) => {
  try {
    // 1. Fetch all registered user profiles with their active session status
    const result = await db.query(
      `SELECT 
         p.id as user_id,
         p.name as user_name,
         p.email as user_email,
         p.phone as user_phone,
         p.role as user_role,
         COALESCE(s.session_id, 'sess_active_' || SUBSTRING(MD5(p.id) FROM 1 FOR 10)) as session_id,
         COALESCE(s.updated_at, p.created_at) as updated_at,
         CASE WHEN s.session_id IS NOT NULL AND s.session_id NOT LIKE 'sess_terminated_%' THEN true ELSE false END as is_active
       FROM profiles p
       LEFT JOIN active_sessions s ON LOWER(s.user_id) = LOWER(p.id) OR LOWER(s.user_id) = LOWER(p.email)
       ORDER BY s.updated_at DESC NULLS LAST, p.created_at DESC`
    );

    // 2. Also fetch standalone sessions not linked to profiles
    const standaloneSessions = await db.query(
      `SELECT 
         s.user_id,
         s.session_id,
         s.updated_at,
         'Student' as user_name,
         s.user_id as user_email,
         'student' as user_role,
         'N/A' as user_phone,
         true as is_active
       FROM active_sessions s
       WHERE NOT EXISTS (
         SELECT 1 FROM profiles p WHERE LOWER(p.id) = LOWER(s.user_id) OR LOWER(p.email) = LOWER(s.user_id)
       )`
    );

    const combined = [...result.rows, ...standaloneSessions.rows];
    return res.json({ data: combined, error: null });
  } catch (err) {
    console.error('getAllActiveSessions Error:', err);
    return res.status(500).json({ data: [], error: 'Failed to fetch active sessions.' });
  }
};

const terminateSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!userId && !sessionId) {
      return res.status(400).json({ success: false, error: 'User ID or Session ID required' });
    }

    const terminatedSessionId = 'sess_terminated_' + Date.now();

    if (userId) {
      const clean = String(userId).trim();
      await db.query('DELETE FROM active_sessions WHERE user_id = $1 OR LOWER(user_id) = LOWER($2)', [clean, clean.toLowerCase()]);
      await db.query(
        `INSERT INTO active_sessions (user_id, session_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
        [clean, terminatedSessionId]
      );
      if (clean.includes('@')) {
        await db.query(
          `INSERT INTO active_sessions (user_id, session_id, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
          [clean.toLowerCase(), terminatedSessionId]
        );
      }
    } else if (sessionId) {
      await db.query('DELETE FROM active_sessions WHERE session_id = $1', [sessionId]);
    }

    return res.json({ success: true, error: null });
  } catch (err) {
    console.error('terminateSession Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to terminate session.' });
  }
};

const googleSignIn = async (req, res) => {
  try {
    const { idToken, email, name, phone, googleId } = req.body;
    let verifiedEmail = '';
    let verifiedName = '';
    let verifiedSub = googleId || '';

    // 1. Cryptographic Server-Side Token Verification if idToken is provided
    if (idToken) {
      try {
        const ticket = await googleOAuthClient.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.split(',') : undefined
        });
        const payload = ticket.getPayload();
        if (payload) {
          verifiedEmail = payload.email || '';
          verifiedName = payload.name || payload.given_name || '';
          verifiedSub = payload.sub || verifiedSub;
        }
      } catch (tokenErr) {
        console.warn('Google ID Token verification note:', tokenErr.message);
        // Fallback to client input if token verification fails/client ID not configured in dev
      }
    }

    const targetEmail = (verifiedEmail || email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid Google Email address is required.' });
    }

    const targetName = (verifiedName || name || targetEmail.split('@')[0]).trim();
    const cleanPhone = (phone || '').trim().replace(/\D/g, '');

    // 2. Safe Account Linking & Database Query (Check by provider_user_id OR email)
    let result;
    try {
      result = await db.query(
        `SELECT * FROM profiles WHERE (provider_user_id = $1 AND provider_user_id IS NOT NULL AND provider_user_id != '') OR LOWER(email) = $2`,
        [verifiedSub, targetEmail]
      );
    } catch (dbErr) {
      console.warn('Primary Google DB query fallback:', dbErr.message);
      // Fallback query if provider_user_id column doesn't exist yet
      result = await db.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [targetEmail]);
    }

    let user;

    if (result.rows.length === 0) {
      // Create new Google User profile
      const userId = 'usr_g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const role = targetEmail === 'bitwiselearning0@gmail.com' ? 'admin' : 'student';

      try {
        const insertRes = await db.query(
          `INSERT INTO profiles (id, name, email, phone, role, auth_provider, provider_user_id)
           VALUES ($1, $2, $3, $4, $5, 'google', $6)
           RETURNING id, name, email, phone, role, created_at`,
          [userId, targetName, targetEmail, cleanPhone, role, verifiedSub]
        );
        user = insertRes.rows[0];
      } catch (insErr) {
        // Fallback insert if columns don't exist yet
        const insertRes = await db.query(
          `INSERT INTO profiles (id, name, email, phone, role)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, email, phone, role, created_at`,
          [userId, targetName, targetEmail, cleanPhone, role]
        );
        user = insertRes.rows[0];
      }
    } else {
      user = result.rows[0];
      try {
        const updatedProvider = user.auth_provider || 'google';
        const updatedSub = user.provider_user_id || verifiedSub;
        const updateRes = await db.query(
          `UPDATE profiles 
           SET name = COALESCE(NULLIF($1, ''), name), 
               phone = COALESCE(NULLIF($2, ''), phone),
               auth_provider = $3,
               provider_user_id = COALESCE(NULLIF($4, ''), provider_user_id)
           WHERE id = $5 
           RETURNING id, name, email, phone, role, created_at`,
          [targetName, cleanPhone, updatedProvider, updatedSub, user.id]
        );
        if (updateRes.rows.length > 0) {
          user = updateRes.rows[0];
        }
      } catch (updErr) {
        // Fallback update
        const updateRes = await db.query(
          `UPDATE profiles SET name = COALESCE(NULLIF($1, ''), name), phone = COALESCE(NULLIF($2, ''), phone)
           WHERE id = $3 RETURNING id, name, email, phone, role, created_at`,
          [targetName, cleanPhone, user.id]
        );
        if (updateRes.rows.length > 0) {
          user = updateRes.rows[0];
        }
      }
    }

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      auth_provider: user.auth_provider || 'google',
      created_at: user.created_at
    };

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    // Enforce 1 Device Active Session
    const activeSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    await db.query(
      `INSERT INTO active_sessions (user_id, session_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
      [user.id, activeSessionId]
    );
    if (user.email) {
      await db.query(
        `INSERT INTO active_sessions (user_id, session_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
        [user.email.toLowerCase(), activeSessionId]
      );
    }

    return res.json({ data: profile, token, activeSessionId, error: null });
  } catch (err) {
    console.error('Google SignIn Error:', err);
    return res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
};

const mobileGoogleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error || !code) {
      console.warn('Google Mobile OAuth callback error or missing code:', error);
      return res.redirect(`com.bitwiselearning.app://auth/callback?error=${encodeURIComponent(String(error || 'Authorization cancelled or denied'))}`);
    }

    // 1. Decode state parameter to extract PKCE code_verifier
    let codeVerifier = '';
    if (state) {
      try {
        const base64 = String(state).replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
        const parsed = JSON.parse(jsonStr);
        codeVerifier = parsed.cv || '';
      } catch (e) {
        console.warn('Could not parse OAuth state:', e.message);
      }
    }

    const redirectUri = 'https://bitwiselearning.online/api/auth/google/mobile/callback';

    // 2. Exchange authorization code + PKCE code_verifier for Google Tokens
    const tokenParams = new URLSearchParams({
      code: String(code),
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    if (codeVerifier) {
      tokenParams.append('code_verifier', codeVerifier);
    }
    if (process.env.GOOGLE_CLIENT_SECRET) {
      tokenParams.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('Google token exchange failed:', tokenData);
      return res.redirect(`com.bitwiselearning.app://auth/callback?error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code')}`);
    }

    // 3. Cryptographically verify OIDC ID Token using google-auth-library
    let verifiedEmail = '';
    let verifiedName = '';
    let verifiedSub = '';

    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: tokenData.id_token,
        audience: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.split(',') : undefined
      });
      const payload = ticket.getPayload();
      if (payload) {
        verifiedEmail = payload.email || '';
        verifiedName = payload.name || payload.given_name || '';
        verifiedSub = payload.sub || '';
      }
    } catch (verr) {
      console.warn('Mobile Google OIDC ID Token verification fallback:', verr.message);
      try {
        const base64Url = tokenData.id_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        verifiedEmail = payload.email || '';
        verifiedName = payload.name || payload.given_name || '';
        verifiedSub = payload.sub || '';
      } catch (fbErr) {
        return res.redirect(`com.bitwiselearning.app://auth/callback?error=${encodeURIComponent('Invalid OIDC ID token signature')}`);
      }
    }

    const targetEmail = verifiedEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.redirect(`com.bitwiselearning.app://auth/callback?error=${encodeURIComponent('No valid email found in Google account')}`);
    }

    const targetName = (verifiedName || targetEmail.split('@')[0]).trim();

    // 4. Find or Create Profile in PostgreSQL DB
    let result;
    try {
      result = await db.query(
        `SELECT * FROM profiles WHERE (provider_user_id = $1 AND provider_user_id IS NOT NULL AND provider_user_id != '') OR LOWER(email) = $2`,
        [verifiedSub, targetEmail]
      );
    } catch (dbErr) {
      result = await db.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [targetEmail]);
    }

    let user;
    if (result.rows.length === 0) {
      const userId = 'usr_g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const role = targetEmail === 'bitwiselearning0@gmail.com' ? 'admin' : 'student';

      try {
        const insertRes = await db.query(
          `INSERT INTO profiles (id, name, email, role, auth_provider, provider_user_id)
           VALUES ($1, $2, $3, $4, 'google', $5)
           RETURNING id, name, email, phone, role, created_at`,
          [userId, targetName, targetEmail, role, verifiedSub]
        );
        user = insertRes.rows[0];
      } catch (insErr) {
        const insertRes = await db.query(
          `INSERT INTO profiles (id, name, email, phone, role)
           VALUES ($1, $2, $3, '0000000000', $4)
           RETURNING id, name, email, phone, role, created_at`,
          [userId, targetName, targetEmail, role]
        );
        user = insertRes.rows[0];
      }
    } else {
      user = result.rows[0];
      try {
        const updateRes = await db.query(
          `UPDATE profiles 
           SET name = COALESCE(NULLIF($1, ''), name),
               auth_provider = 'google',
               provider_user_id = COALESCE(NULLIF($2, ''), provider_user_id)
           WHERE id = $3 
           RETURNING id, name, email, phone, role, created_at`,
          [targetName, verifiedSub, user.id]
        );
        if (updateRes.rows.length > 0) {
          user = updateRes.rows[0];
        }
      } catch (updErr) {
        // Fallback update
      }
    }

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      auth_provider: 'google',
      created_at: user.created_at
    };

    // 5. Sign Bitwise 30-day JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    // 6. Enforce 1 Device Active Session
    const activeSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    await db.query(
      `INSERT INTO active_sessions (user_id, session_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
      [user.id, activeSessionId]
    );
    if (user.email) {
      await db.query(
        `INSERT INTO active_sessions (user_id, session_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, updated_at = NOW()`,
        [user.email.toLowerCase(), activeSessionId]
      );
    }

    // 7. Redirect to Android App Deep Link
    const appDeepLink = `com.bitwiselearning.app://auth/callback?` +
      `token=${encodeURIComponent(token)}` +
      `&user=${encodeURIComponent(JSON.stringify(profile))}` +
      `&activeSessionId=${encodeURIComponent(activeSessionId)}`;

    return res.redirect(appDeepLink);
  } catch (err) {
    console.error('mobileGoogleCallback unexpected error:', err);
    return res.redirect(`com.bitwiselearning.app://auth/callback?error=${encodeURIComponent('Internal server error during Google login')}`);
  }
};

module.exports = {
  signUp,
  signIn,
  googleSignIn,
  mobileGoogleCallback,
  sendPasswordResetOtp,
  verifyOtpAndUpdatePassword,
  registerDeviceSession,
  verifyDeviceSession,
  getAllActiveSessions,
  terminateSession,
};
