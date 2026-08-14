const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authController = require('./authController');
const catalogController = require('./catalogController');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), server: 'Bluehost VPS' });
});

// Authentication Routes
app.post('/api/auth/signup', authController.signUp);
app.post('/api/auth/signin', authController.signIn);
app.post('/api/auth/send-otp', authController.sendPasswordResetOtp);
app.post('/api/auth/verify-otp-reset', authController.verifyOtpAndUpdatePassword);
app.post('/api/auth/device-session', authController.registerDeviceSession);

// Catalog & Purchases Routes
app.get('/api/notes', catalogController.getNotes);
app.get('/api/bundles', catalogController.getBundles);
app.get('/api/playlists', catalogController.getPlaylists);
app.get('/api/purchases/user/:userId', catalogController.getUserPurchases);
app.get('/api/purchases/all', catalogController.getAllPurchases);
app.post('/api/purchases/grant', catalogController.grantPurchase);
app.post('/api/purchases/revoke', catalogController.revokePurchase);
app.get('/api/profiles/all', catalogController.getAllProfiles);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bitwise Learning Backend API running on port ${PORT}`);
});
