// VPS API Client Service for Bitwise Learning (Self-Hosted on Bluehost VPS)

const API_BASE_URL = typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.protocol === 'file:' || window.location.origin.includes('capacitor'))
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

const safeFetchJson = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.warn(`Non-JSON response from ${url}:`, text);
      return { data: null, error: `Server response error (${res.status}). Please try again.` };
    }
    return await res.json();
  } catch (err: any) {
    console.error(`Fetch error from ${url}:`, err);
    return { data: null, error: err?.message || 'Network request failed.' };
  }
};

export const vpsApi = {
  // Auth Methods
  signUp: async (name: string, email: string, phone: string, password: string) => {
    return safeFetchJson(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
  },

  signIn: async (email: string, password: string) => {
    return safeFetchJson(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  },

  sendPasswordResetOtp: async (email: string) => {
    return safeFetchJson(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  verifyOtpAndUpdatePassword: async (email: string, otpCode: string, newPassword: string) => {
    return safeFetchJson(`${API_BASE_URL}/auth/verify-otp-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode, newPassword })
    });
  },

  registerDeviceSession: async (userId: string) => {
    return safeFetchJson(`${API_BASE_URL}/auth/device-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  },

  // Catalog Methods
  getNotes: async () => {
    return safeFetchJson(`${API_BASE_URL}/notes`);
  },

  getBundles: async () => {
    return safeFetchJson(`${API_BASE_URL}/bundles`);
  },

  getPlaylists: async () => {
    return safeFetchJson(`${API_BASE_URL}/playlists`);
  },

  // Purchase & Access Methods
  getUserPurchases: async (userId: string) => {
    return safeFetchJson(`${API_BASE_URL}/purchases/user/${userId}`);
  },

  getAllPurchases: async () => {
    return safeFetchJson(`${API_BASE_URL}/purchases/all`);
  },

  grantPurchase: async (userId: string, itemId: string, itemType: 'note' | 'bundle' = 'note', amount = 0, razorpayPaymentId?: string) => {
    return safeFetchJson(`${API_BASE_URL}/purchases/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId, itemType, amount, razorpayPaymentId })
    });
  },

  revokePurchase: async (userId: string, itemId: string) => {
    return safeFetchJson(`${API_BASE_URL}/purchases/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId })
    });
  },

  getAllProfiles: async () => {
    return safeFetchJson(`${API_BASE_URL}/profiles/all`);
  }
};
