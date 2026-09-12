const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bitwise_jwt_super_secret_key_2026_vps';

/**
 * Middleware to authenticate any valid JWT or registered user
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token || null);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ data: null, error: 'Access Denied: Invalid or expired token.' });
    }
  }

  // Fallback requires valid active device session ID
  const userEmail = (req.headers['x-user-email'] || '').trim().toLowerCase();
  const userId = (req.headers['x-user-id'] || '').trim();
  const sessionId = (req.headers['x-session-id'] || '').trim();

  if ((userEmail || userId) && sessionId) {
    try {
      const db = require('./db');
      const sessRes = await db.query(
        "SELECT session_id FROM active_sessions WHERE (LOWER(user_id) = $1 OR user_id = $2) AND session_id = $3 LIMIT 1",
        [userEmail, userId, sessionId]
      );
      if (sessRes.rows.length > 0) {
        const profile = await db.query(
          "SELECT id, name, email, role FROM profiles WHERE LOWER(email) = $1 OR id = $2 LIMIT 1",
          [userEmail, userId]
        );
        if (profile.rows.length > 0) {
          req.user = profile.rows[0];
          return next();
        }
      }
    } catch (e) {}
  }

  return res.status(401).json({ data: null, error: 'Access Denied: Authentication required.' });
};

/**
 * Middleware to require Administrator privileges
 */
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token || null);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const isAdmin = decoded.role === 'admin' || (decoded.email && decoded.email.toLowerCase() === 'bitwiselearning0@gmail.com');
      if (isAdmin) {
        req.user = decoded;
        return next();
      }
    } catch (err) {
      return res.status(401).json({ data: null, error: 'Unauthorized: Invalid or expired admin token.' });
    }
  }

  const userEmail = (req.headers['x-user-email'] || req.body?.adminEmail || '').trim().toLowerCase();
  const userId = (req.headers['x-user-id'] || '').trim();
  const sessionId = (req.headers['x-session-id'] || '').trim();

  if ((userEmail === 'bitwiselearning0@gmail.com' || userEmail.includes('bitwiselearning0') || userId) && sessionId) {
    try {
      const db = require('./db');
      const sessRes = await db.query(
        "SELECT session_id FROM active_sessions WHERE (LOWER(user_id) = $1 OR user_id = $2) AND session_id = $3 LIMIT 1",
        [userEmail, userId, sessionId]
      );
      if (sessRes.rows.length > 0) {
        const adminProfile = await db.query(
          "SELECT id, name, email, role FROM profiles WHERE (LOWER(email) = $1 OR id = $2) AND (role = 'admin' OR LOWER(email) = 'bitwiselearning0@gmail.com') LIMIT 1",
          [userEmail, userId]
        );
        if (adminProfile.rows.length > 0) {
          req.user = adminProfile.rows[0];
          return next();
        }
      }
    } catch (dbErr) {
      console.warn('DB admin verification error:', dbErr);
    }
  }

  return res.status(401).json({ data: null, error: 'Unauthorized: Admin authentication token required.' });
};

/**
 * In-Memory Sliding Window Rate Limiter Factory
 */
const createRateLimiter = ({ windowMs = 60000, maxRequests = 100, message = 'Too many requests. Please try again later.' }) => {
  const ipHits = new Map();

  // Periodic garbage collection every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipHits.entries()) {
      if (now - data.startTime > windowMs) {
        ipHits.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  return (req, res, next) => {
    const ip = req.headers['cf-connecting-ip'] || 
               (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
               req.ip || 
               req.socket.remoteAddress || 
               'unknown';

    const now = Date.now();
    let clientRecord = ipHits.get(ip);

    if (!clientRecord || (now - clientRecord.startTime > windowMs)) {
      clientRecord = { count: 1, startTime: now };
      ipHits.set(ip, clientRecord);
    } else {
      clientRecord.count++;
    }

    const remaining = Math.max(0, maxRequests - clientRecord.count);
    const resetTime = Math.ceil((clientRecord.startTime + windowMs - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (clientRecord.count > maxRequests) {
      return res.status(429).json({
        data: null,
        error: message,
        retryAfterSeconds: resetTime
      });
    }

    next();
  };
};

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  maxRequests: 30,          // 30 auth/OTP attempts max per IP
  message: 'Too many authentication or OTP requests from this IP. Please wait 15 minutes before trying again.'
});

const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute window
  maxRequests: 180,         // 180 requests per minute
  message: 'Rate limit exceeded. Please slow down your requests.'
});

module.exports = {
  authenticateToken,
  requireAdmin,
  authRateLimiter,
  apiRateLimiter
};
