const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authController = require('./authController');
const catalogController = require('./catalogController');
const razorpayController = require('./razorpayController');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), server: 'Bluehost VPS' });
});

// Authentication Routes
app.post('/api/auth/signup', authController.signUp);
app.post('/api/auth/signin', authController.signIn);
app.post('/api/auth/google', authController.googleSignIn);
app.get('/api/auth/google/mobile/callback', authController.mobileGoogleCallback);
app.post('/api/auth/send-otp', authController.sendPasswordResetOtp);
app.post('/api/auth/verify-otp-reset', authController.verifyOtpAndUpdatePassword);
app.post('/api/auth/device-session', authController.registerDeviceSession);
app.post('/api/auth/verify-session', authController.verifyDeviceSession);
app.get('/api/admin/active-sessions', authController.getAllActiveSessions);
app.post('/api/admin/terminate-session', authController.terminateSession);

// Catalog & Purchases Routes
app.get('/api/notes', catalogController.getNotes);
app.post('/api/notes', catalogController.addNote);
app.put('/api/notes/:id', catalogController.updateNote);
app.delete('/api/notes/:id', catalogController.deleteNote);
app.post('/api/upload', catalogController.uploadFile);
app.get('/api/bundles', catalogController.getBundles);
app.post('/api/bundles', catalogController.addBundle);
app.put('/api/bundles/:id', catalogController.updateBundle);
app.delete('/api/bundles/:id', catalogController.deleteBundle);

app.get('/api/playlists', catalogController.getPlaylists);
app.post('/api/playlists', catalogController.addPlaylist);
app.delete('/api/playlists/:id', catalogController.deletePlaylist);

app.get('/api/purchases/user/:userId', catalogController.getUserPurchases);
app.get('/api/purchases/all', catalogController.getAllPurchases);
app.post('/api/purchases/grant', catalogController.grantPurchase);
app.post('/api/purchases/revoke', catalogController.revokePurchase);
app.post('/api/purchases/revoke-all', catalogController.revokeAllPurchases);
app.get('/api/profiles/all', catalogController.getAllProfiles);

// Razorpay Official Gateway Routes
app.post('/api/razorpay/create-order', razorpayController.createOrder);
app.post('/api/razorpay/verify-payment', razorpayController.verifyPayment);
app.post('/api/razorpay/verify-manual-payment', razorpayController.verifyManualPayment);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bitwise Learning Backend API running on port ${PORT}`);
});
