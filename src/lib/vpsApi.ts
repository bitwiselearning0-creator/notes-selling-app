// VPS API Client Service for Bitwise Learning (Self-Hosted on Bluehost VPS)

const API_BASE_URL = typeof window !== 'undefined' && window.location.origin.includes('localhost') 
  ? 'https://bitwiselearning.online/api' 
  : '/api';

export interface ApiProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'admin';
  created_at?: string;
}

export interface ApiPurchase {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'note' | 'bundle';
  amount: number;
  razorpay_payment_id?: string;
  status: 'active' | 'revoked';
  granted_at: string;
  expires_at?: string;
}

export const vpsApi = {
  // Auth Methods
  signUp: async (name: string, email: string, phone: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    return res.json();
  },

  signIn: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  sendPasswordResetOtp: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  verifyOtpAndUpdatePassword: async (email: string, otpCode: string, newPassword: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode, newPassword })
    });
    return res.json();
  },

  registerDeviceSession: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/device-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  // Catalog Methods
  getNotes: async () => {
    const res = await fetch(`${API_BASE_URL}/notes`);
    return res.json();
  },

  getBundles: async () => {
    const res = await fetch(`${API_BASE_URL}/bundles`);
    return res.json();
  },

  getPlaylists: async () => {
    const res = await fetch(`${API_BASE_URL}/playlists`);
    return res.json();
  },

  // Purchase & Access Methods
  getUserPurchases: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/purchases/user/${userId}`);
    return res.json();
  },

  getAllPurchases: async () => {
    const res = await fetch(`${API_BASE_URL}/purchases/all`);
    return res.json();
  },

  grantPurchase: async (userId: string, itemId: string, itemType: 'note' | 'bundle' = 'note', amount = 0, razorpayPaymentId?: string) => {
    const res = await fetch(`${API_BASE_URL}/purchases/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId, itemType, amount, razorpayPaymentId })
    });
    return res.json();
  },

  revokePurchase: async (userId: string, itemId: string) => {
    const res = await fetch(`${API_BASE_URL}/purchases/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId })
    });
    return res.json();
  },

  getAllProfiles: async () => {
    const res = await fetch(`${API_BASE_URL}/profiles/all`);
    return res.json();
  }
};
