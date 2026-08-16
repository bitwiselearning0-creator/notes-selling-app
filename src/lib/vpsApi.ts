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

  googleSignIn: async (email: string, name?: string, phone?: string, googleId?: string, idToken?: string) => {
    return safeFetchJson(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, phone, googleId, idToken })
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

  verifyDeviceSession: async (userId: string, sessionId: string) => {
    return safeFetchJson(`${API_BASE_URL}/auth/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sessionId })
    });
  },

  getAllActiveSessions: async () => {
    return safeFetchJson(`${API_BASE_URL}/admin/active-sessions`);
  },

  terminateSession: async (userId: string) => {
    return safeFetchJson(`${API_BASE_URL}/admin/terminate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  },

  // Catalog Methods
  getNotes: async () => {
    return safeFetchJson(`${API_BASE_URL}/notes`);
  },

  addNote: async (noteData: any) => {
    return safeFetchJson(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });
  },

  updateNote: async (id: string, noteData: any) => {
    return safeFetchJson(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });
  },

  deleteNote: async (id: string) => {
    return safeFetchJson(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE'
    });
  },

  uploadFile: async (fileData: string) => {
    return safeFetchJson(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData })
    });
  },

  getBundles: async () => {
    return safeFetchJson(`${API_BASE_URL}/bundles`);
  },

  addBundle: async (bundleData: any) => {
    return safeFetchJson(`${API_BASE_URL}/bundles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundleData)
    });
  },

  updateBundle: async (id: string, bundleData: any) => {
    return safeFetchJson(`${API_BASE_URL}/bundles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundleData)
    });
  },

  deleteBundle: async (id: string) => {
    return safeFetchJson(`${API_BASE_URL}/bundles/${id}`, {
      method: 'DELETE'
    });
  },

  getPlaylists: async () => {
    return safeFetchJson(`${API_BASE_URL}/playlists`);
  },

  addPlaylist: async (playlistData: any) => {
    return safeFetchJson(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlistData)
    });
  },

  deletePlaylist: async (id: string) => {
    return safeFetchJson(`${API_BASE_URL}/playlists/${id}`, {
      method: 'DELETE'
    });
  },

  // Purchase & Access Methods
  getUserPurchases: async (userId: string, email?: string) => {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    return safeFetchJson(`${API_BASE_URL}/purchases/user/${encodeURIComponent(userId)}${query}`);
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

  revokePurchaseById: async (purchaseId: string) => {
    return safeFetchJson(`${API_BASE_URL}/purchases/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId })
    });
  },

  revokeAllPurchases: async () => {
    return safeFetchJson(`${API_BASE_URL}/purchases/revoke-all`, {
      method: 'POST'
    });
  },

  getAllProfiles: async () => {
    return safeFetchJson(`${API_BASE_URL}/profiles/all`);
  },

  // Razorpay Gateway Integration
  createRazorpayOrder: async (amount: number, notes?: any) => {
    return safeFetchJson(`${API_BASE_URL}/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, notes })
    });
  },

  verifyRazorpayPayment: async (paymentPayload: {
    razorpayOrderId?: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    userId: string;
    itemId: string;
    itemType: string;
    amount: number;
  }) => {
    return safeFetchJson(`${API_BASE_URL}/razorpay/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload)
    });
  },

  verifyManualPayment: async (paymentId: string, userId: string, itemId: string, itemType: string) => {
    return safeFetchJson(`${API_BASE_URL}/razorpay/verify-manual-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, userId, itemId, itemType })
    });
  }
};
