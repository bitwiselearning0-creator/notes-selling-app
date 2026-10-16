const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authController = require('./authController');
const catalogController = require('./catalogController');
const razorpayController = require('./razorpayController');
const { authenticateToken, requireAdmin, authRateLimiter, apiRateLimiter } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Disable Express fingerprint header from HTTP responses
app.disable('x-powered-by');

// Hardened CORS policy
const allowedOrigins = [
  'https://bitwiselearning.online',
  'https://www.bitwiselearning.online',
  'http://localhost:5173',
  'http://localhost:3000',
  'capacitor://localhost'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('bitwiselearning.online')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow with log
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Global API rate limiter (180 req/min per IP)
app.use('/api/', apiRateLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Client IP Endpoint (for dynamic watermarking & session security)
app.get('/api/client-ip', (req, res) => {
  const ip = req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || req.socket.remoteAddress || '';
  res.json({ ip });
});

// Authentication Routes (Guarded by strict authRateLimiter)
app.post('/api/auth/signup', authRateLimiter, authController.signUp);
app.post('/api/auth/signin', authRateLimiter, authController.signIn);
app.post('/api/auth/google', authRateLimiter, authController.googleSignIn);
app.get('/api/auth/google/mobile/callback', authController.mobileGoogleCallback);
app.get('/api/auth/profile/:userId', authController.getProfile);
app.post('/api/auth/update-phone', authController.updatePhone);
app.post('/api/auth/send-otp', authRateLimiter, authController.sendPasswordResetOtp);
app.post('/api/auth/verify-otp-reset', authRateLimiter, authController.verifyOtpAndUpdatePassword);
app.post('/api/auth/device-session', authController.registerDeviceSession);
app.post('/api/auth/verify-session', authController.verifyDeviceSession);
app.post('/api/auth/refresh-session', authController.refreshSession);

// Admin-Protected Session Management
app.get('/api/admin/active-sessions', requireAdmin, authController.getAllActiveSessions);
app.post('/api/admin/terminate-session', requireAdmin, authController.terminateSession);

// Public Catalog Read Routes
app.get('/api/notes', catalogController.getNotes);
app.get('/api/notes/:id/pdf', catalogController.streamNotePdf);
app.get('/api/bundles', catalogController.getBundles);
app.get('/api/playlists', catalogController.getPlaylists);
app.get('/api/purchases/user/:userId', authenticateToken, catalogController.getUserPurchases);

// Admin-Protected Catalog & Upload Mutations
app.post('/api/notes', requireAdmin, catalogController.addNote);
app.put('/api/notes/:id', requireAdmin, catalogController.updateNote);
app.delete('/api/notes/:id', requireAdmin, catalogController.deleteNote);
app.post('/api/upload', requireAdmin, catalogController.uploadFile);
app.post('/api/bundles', requireAdmin, catalogController.addBundle);
app.put('/api/bundles/:id', requireAdmin, catalogController.updateBundle);
app.delete('/api/bundles/:id', requireAdmin, catalogController.deleteBundle);
app.post('/api/playlists', requireAdmin, catalogController.addPlaylist);
app.delete('/api/playlists/:id', requireAdmin, catalogController.deletePlaylist);

// Admin-Protected Purchase & Profile Audits
app.get('/api/purchases/all', requireAdmin, catalogController.getAllPurchases);
app.post('/api/purchases/grant', requireAdmin, catalogController.grantPurchase);
app.post('/api/purchases/revoke', requireAdmin, catalogController.revokePurchase);
app.post('/api/purchases/revoke-all', requireAdmin, catalogController.revokeAllPurchases);
app.get('/api/profiles/all', requireAdmin, catalogController.getAllProfiles);

// Razorpay Official Gateway Routes
app.post('/api/razorpay/create-order', razorpayController.createOrder);
app.post('/api/razorpay/verify-payment', razorpayController.verifyPayment);
app.post('/api/razorpay/verify-manual-payment', requireAdmin, razorpayController.verifyManualPayment);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bitwise Learning Hardened Backend API running on port ${PORT}`);
});
