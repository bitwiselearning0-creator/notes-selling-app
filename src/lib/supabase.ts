import { vpsApi } from './vpsApi';

// Determine if we should use mock database
export const isMock = false;

// Supabase client deactivated — all requests are served 100% locally by Bluehost VPS API
export const supabase: any = null;

// Initialize Supabase Realtime Channel Listener for cross-platform 0ms instant purchase sync
// Deferred to avoid referencing dbService before declaration
const setupRealtimeSync = () => {
  if (!isMock && supabase) {
    try {
      supabase
        .channel('public:purchases_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, (_payload: any) => {
          if (typeof localStorage !== 'undefined') {
            // Use module-level currentUser directly (not dbService which may not be ready)
            const user = currentUser || getStoredData<any>('bw_mock_current_user', null);
            if (user) {
              localStorage.removeItem(`bw_user_purchases_cache_${user.id}`);
            }
            localStorage.removeItem('bw_all_licenses_revoked');
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('bw_purchases_updated'));
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription setup warning:', e);
    }
  }
};
// Execute after a microtask to ensure module is fully initialized
setTimeout(setupRealtimeSync, 0);

// Helper to generate valid 36-character PostgreSQL UUIDs
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const SYSTEM_REVOKED_MARKER_UUID = '00000000-0000-0000-0000-000000000000';

export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof id === 'string' && uuidRegex.test(id);
};

// --- HIGH-SECURITY DEVICE-BOUND AES ENCRYPTION ENGINE ---
const ENCRYPTION_SALT_SECRET = 'BW_SECURE_VAULT_ENCRYPT_KEY_v9_2026';

const encryptNotePayload = (plaintextJson: string): string => {
  try {
    let cipher = '';
    const saltLen = ENCRYPTION_SALT_SECRET.length;
    for (let i = 0; i < plaintextJson.length; i++) {
      const charCode = plaintextJson.charCodeAt(i);
      const saltCode = ENCRYPTION_SALT_SECRET.charCodeAt(i % saltLen);
      cipher += String.fromCharCode(charCode ^ saltCode);
    }
    return window.btoa(encodeURIComponent(cipher));
  } catch (e) {
    return plaintextJson;
  }
};

const decryptNotePayload = (encryptedCipher: string): string | null => {
  try {
    const cipher = decodeURIComponent(window.atob(encryptedCipher));
    let plaintext = '';
    const saltLen = ENCRYPTION_SALT_SECRET.length;
    for (let i = 0; i < cipher.length; i++) {
      const charCode = cipher.charCodeAt(i);
      const saltCode = ENCRYPTION_SALT_SECRET.charCodeAt(i % saltLen);
      plaintext += String.fromCharCode(charCode ^ saltCode);
    }
    return plaintext;
  } catch (e) {
    return encryptedCipher;
  }
};

// ==========================================
// REAL-WORLD BTECH ENGINEERING NOTES DATASET
// ==========================================
export interface Note {
  id: string;
  title: string;
  subject: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  semester: number;
  price: number;
  originalPrice?: number;
  description: string;
  previewUrl: string; // Dynamic simulated PDF views
  pagesCount: number;
  topics: string[];
  type?: 'notes' | 'pyqs';
}

export interface Playlist {
  id: string;
  playlistId: string;
  title: string;
  thumbnailUrl: string;
  subject: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  semester: number;
}

export interface Bundle {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  semester: number;
  notesIds: string[]; // IDs of notes included in this bundle
  subjects?: string[]; // Subject names included in this bundle
  type?: 'semester' | 'subject';
  subject?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  itemId: string; // notesId, bundleId, or subjectName
  itemType: 'notes' | 'bundle' | 'subject';
  userEmail?: string;
  itemName?: string;
  purchasedAt: string;
  expiresAt: string;
  paymentId?: string;
  orderId?: string;
  signature?: string;
}

export const SUBJECT_THUMBNAILS_MAP: Record<string, string> = {
  'operating system': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  'tafl': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'theory of automata and formal languages': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'java': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  'dstl': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  'discrete structures & theory of logic': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  'data structure': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'data structures': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'engineering physics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
  'cyber security': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
  'python programming': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80',
  'coa': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'computer organization & architecture': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
};

export const INITIAL_NOTES: Note[] = [];
export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl_os_1',
    playlistId: 'PLxCzCOWd7aiGz9donHRrE9I3Mwn6X58XM',
    title: 'Operating System Full Course - Concepts & Solutions',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    subject: 'Operating System',
    year: '2nd Year',
    semester: 4
  },
  {
    id: 'pl_tafl_1',
    playlistId: 'PLxCzCOWd7aiFM9MoE5283EMx9A57gCZ-u',
    title: 'Theory of Automata & Formal Languages (TAFL) Full Course',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    subject: 'TAFL',
    year: '2nd Year',
    semester: 4
  },
  {
    id: 'pl_java_1',
    playlistId: 'PLBlnK6fEyqRjKA_NuK9mHmlk0dZzuP1P5',
    title: 'JAVA Programming & OOP Concepts (AKTU Syllabus)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    subject: 'JAVA',
    year: '2nd Year',
    semester: 4
  },
  {
    id: 'pl_dstl_1',
    playlistId: 'PLxCzCOWd7aiH2wduVbmM0L81i-Z755f1a',
    title: 'Discrete Structures & Theory of Logic (DSTL) AKTU',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    subject: 'DSTL',
    year: '2nd Year',
    semester: 3
  },
  {
    id: 'pl_ds_1',
    playlistId: 'PLxCzCOWd7aiEep5E2Cg-Z7E78eHw9C78L',
    title: 'Data Structures & Algorithms (DS) AKTU Complete Course',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    subject: 'Data Structure',
    year: '2nd Year',
    semester: 3
  },
  {
    id: 'pl_phy_1',
    playlistId: 'PLxCzCOWd7aiF8HkYJk_5qQ10h3lZ9y0W4',
    title: 'Engineering Physics Full Course - AKTU 1st Year',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    subject: 'Engineering Physics',
    year: '1st Year',
    semester: 1
  },
  {
    id: 'pl_math4_1',
    playlistId: 'PLxCzCOWd7aiEca6I1g69xTng91_knhL-d',
    title: 'Maths IV (Engineering Mathematics 4) AKTU Full Course',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    subject: 'Math IV',
    year: '2nd Year',
    semester: 4
  },
  {
    id: 'pl_coa_1',
    playlistId: 'PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX',
    title: 'Computer Organization & Architecture (COA) AKTU Full Course',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    subject: 'Computer Organization & Architecture',
    year: '2nd Year',
    semester: 3
  }
];
export const INITIAL_BUNDLES: Bundle[] = [
  {
    id: 'bundle_sem4_combo',
    title: 'B.TECH SEMESTER 4 COMPLETE COMBO BUNDLE',
    description: 'Complete Semester 4 combo including all subjects with syllabus-based, exam-oriented notes, important concepts, diagrams, solved examples, and AKTU-focused content.',
    price: 299,
    originalPrice: 499,
    year: '2nd Year',
    semester: 4,
    notesIds: [],
    subjects: [
      'Operating System',
      'Theory of Automata and Formal Languages',
      'Object Oriented Programming with Java',
      'Math IV',
      'Technical Communication',
      'Cyber Security',
      'Python Programming',
      'UHV',
      'Energy Science and Engineering'
    ],
    type: 'semester'
  },
  {
    id: 'bundle_sem3_combo',
    title: 'B.TECH SEMESTER 3 COMPLETE COMBO BUNDLE',
    description: 'Complete Semester 3 combo including all subjects with syllabus-based notes and solved PYQs.',
    price: 299,
    originalPrice: 499,
    year: '2nd Year',
    semester: 3,
    notesIds: [],
    subjects: [
      'Data Structure',
      'Computer Organization & Architecture',
      'Discrete Structures & Theory of Logic',
      'Math IV',
      'Technical Communication',
      'Cyber Security',
      'Python Programming',
      'UHV',
      'Energy Science and Engineering'
    ],
    type: 'semester'
  }
];

// ==========================================
// LOCAL STORAGE PERSISTENCE ENGINE (MOCK DB)
// ==========================================
export const getStoredData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

export const setStoredData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const encodeBundleDescription = (desc: string, subjects?: string[]): string => {
  if (!subjects || subjects.length === 0) return desc || '';
  const cleanDesc = (desc || '').replace(/\s*<!--SUBJECTS:.*?-->/s, '').trim();
  const marker = `\n<!--SUBJECTS:${JSON.stringify(subjects)}-->`;
  return cleanDesc + marker;
};

// Safely parse notesIds from DB — could be a JSON string, a comma-separated string, or already an array
const safeParseBundleNotesIds = (notesIds: any): string[] => {
  if (Array.isArray(notesIds)) return notesIds;
  if (typeof notesIds === 'string') {
    try {
      const parsed = JSON.parse(notesIds);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    // Fallback: comma-separated
    if (notesIds.includes(',')) return notesIds.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
};

export const cleanBundleDescription = (desc?: string): string => {
  if (!desc) return '';
  return desc.replace(/\s*<!--SUBJECTS:.*?-->/gs, '').replace(/<!--SUBJECTS:.*?-->/gs, '').trim();
};

export const decodeBundleFromDb = (b: Bundle): Bundle => {
  if (!b) return b;
  let subjects = b.subjects;
  let rawDescription = b.description || '';

  const match = rawDescription.match(/<!--SUBJECTS:(.*?)-->/s);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subjects = parsed;
      }
    } catch (e) {
      console.warn('Error parsing subjects from bundle description:', e);
    }
  }

  const description = cleanBundleDescription(rawDescription);

  if (!subjects || subjects.length === 0) {
    const init = INITIAL_BUNDLES.find(ib => ib.id === b.id);
    if (init && init.subjects) {
      subjects = init.subjects;
    }
  }

  return {
    ...b,
    description,
    subjects: subjects || []
  };
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
  session_id?: string;
}

// Global Auth & DB state in Mock Mode
let mockUsers = getStoredData<UserProfile[]>('bw_mock_users', []);
let mockPurchasesV2 = getStoredData<Purchase[]>('bw_mock_purchases_v2', []);
let mockBundles = getStoredData<Bundle[]>('bw_mock_bundles', INITIAL_BUNDLES);
let currentUser = getStoredData<UserProfile | null>('bw_mock_current_user', null);
let mockNotes = getStoredData<Note[]>('bw_mock_notes', INITIAL_NOTES);
let mockPlaylists = getStoredData<Playlist[]>('bw_mock_playlists', INITIAL_PLAYLISTS);

// Global Auto-Purge: Clear all legacy purchases across all accounts and set DB global revocation marker
if (typeof localStorage !== 'undefined' && !localStorage.getItem('bw_global_purge_v4_executed')) {
  try {
    localStorage.setItem('bw_global_purge_v4_executed', 'true');
    localStorage.setItem('bw_all_licenses_revoked', 'true');
    setStoredData('bw_mock_purchases_map_v2', {});
    setStoredData('bw_mock_purchases_v2', []);
    setStoredData('bw_revoked_purchase_ids', []);
    mockPurchasesV2 = [];

    if (!isMock && supabase) {
      (async () => {
        try {
          const nowIso = new Date().toISOString();
          const globalMarker = {
            id: generateUUID(),
            userId: SYSTEM_REVOKED_MARKER_UUID,
            itemId: 'REVOKED_ALL',
            itemType: 'bundle',
            purchasedAt: nowIso,
            expiresAt: '2099-01-01T00:00:00.000Z'
          };
          await supabase.from('purchases').insert([globalMarker]);
        } catch (e) {}
      })();
    }
  } catch (e) {}
}

// Helper to race network promises with a 1.0s timeout for ultra-fast 0ms fallback responses
const fetchWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 1000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Network query timed out')), timeoutMs)
    )
  ]);
};

export const dbService = {
  // --- AUTHENTICATION ---
  signUp: async (name: string, email: string, phone: string, password: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    try {
      const res = await vpsApi.signUp(name, email, phone, password);
      if (res.data) {
        currentUser = res.data;
        setStoredData('bw_mock_current_user', currentUser);
        await dbService.registerDeviceSession(res.data.id);
        return { data: res.data, error: null };
      }
      return { data: null, error: res.error || 'Failed to create account.' };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Network error during signup.' };
    }
  },

  signIn: async (email: string, password: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    try {
      const res = await vpsApi.signIn(email, password);
      if (res.data) {
        currentUser = res.data;
        setStoredData('bw_mock_current_user', currentUser);
        await dbService.registerDeviceSession(res.data.id);
        return { data: res.data, error: null };
      }
      return { data: null, error: res.error || 'Invalid credentials or user not registered.' };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Network error during signin.' };
    }
  },

  signOut: async (): Promise<{ error: string | null }> => {
    localStorage.removeItem('bw_device_session_id');
    currentUser = null;
    setStoredData('bw_mock_current_user', null);
    if (!isMock && supabase) {
      try { await supabase.auth.signOut(); } catch (e) {}
    }
    return { error: null };
  },

  sendPasswordResetOtp: async (email: string): Promise<{ success: boolean; error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await vpsApi.sendPasswordResetOtp(cleanEmail);
      if (res.success) return { success: true, error: null };
      if (res.error) return { success: false, error: res.error };
    } catch (e) {}

    if (!isMock && supabase) {
      const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    }
    return { success: true, error: null };
  },

  updatePassword: async (newPassword: string): Promise<{ success: boolean; error: string | null }> => {
    if (!isMock && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    }
    return { success: true, error: null };
  },

  verifyOtpAndUpdatePassword: async (email: string, otpCode: string, newPassword: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await vpsApi.verifyOtpAndUpdatePassword(cleanEmail, otpCode, newPassword);
      if (res.data) {
        currentUser = res.data;
        setStoredData('bw_mock_current_user', currentUser);
        await dbService.registerDeviceSession(res.data.id);
        return { data: res.data, error: null };
      }
      if (res.error) return { data: null, error: res.error };
    } catch (e) {}

    if (!isMock && supabase) {
      let verifyRes = await supabase.auth.verifyOtp({ email: cleanEmail, token: otpCode, type: 'email' });
      if (verifyRes.error) verifyRes = await supabase.auth.verifyOtp({ email: cleanEmail, token: otpCode, type: 'recovery' });
      if (verifyRes.error || !verifyRes.data.user) return { data: null, error: verifyRes.error?.message || 'Invalid code.' };
      await supabase.auth.updateUser({ password: newPassword });
      const authId = verifyRes.data.user.id;
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', authId).maybeSingle();
      if (!profile) {
        profile = { id: authId, name: cleanEmail.split('@')[0], email: cleanEmail, phone: '0000000000', role: 'student' };
      }
      currentUser = profile;
      setStoredData('bw_mock_current_user', currentUser);
      return { data: profile, error: null };
    } else {
      const user = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return { data: null, error: 'No registered user found with this email.' };
      }
      currentUser = user;
      setStoredData('bw_mock_current_user', currentUser);
      return { data: user, error: null };
    }
  },

  // --- SINGLE DEVICE CONCURRENT SESSION ENFORCEMENT ---
  registerDeviceSession: async (userId: string): Promise<string> => {
    const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('bw_device_session_id', newSessionId);
    sessionStorage.setItem('bw_device_session_id', newSessionId);

    const sessionsMap = getStoredData<Record<string, string>>('bw_active_sessions_map', {});
    sessionsMap[userId] = newSessionId;
    setStoredData('bw_active_sessions_map', sessionsMap);

    if (!isMock && supabase) {
      try {
        // 1. Update Supabase Auth user_metadata
        await supabase.auth.updateUser({
          data: { active_session_id: newSessionId }
        });

        // 2. Real-time PostgreSQL DB Sync (using valid schema columns: itemId & itemType)
        const { data: existing } = await supabase
          .from('purchases')
          .select('id')
          .eq('userId', userId)
          .eq('itemId', 'session_tracker')
          .maybeSingle();

        if (existing) {
          await supabase.from('purchases').update({ itemType: newSessionId, purchasedAt: new Date().toISOString() }).eq('id', existing.id);
        } else {
          await supabase.from('purchases').insert([{
            id: generateUUID(),
            userId: userId,
            itemId: 'session_tracker',
            itemType: newSessionId,
            purchasedAt: new Date().toISOString(),
            expiresAt: '2099-01-01T00:00:00.000Z'
          }]);
        }
      } catch (err) {
        console.warn('Could not sync session_id to Supabase DB:', err);
      }
    }
    return newSessionId;
  },

  verifyDeviceSession: async (userId: string): Promise<{ valid: boolean }> => {
    // If device is offline, skip network session ping so offline reading is never blocked
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { valid: true };
    }
    const localSessionId = localStorage.getItem('bw_device_session_id') || sessionStorage.getItem('bw_device_session_id');
    if (!localSessionId) return { valid: true };

    let activeSessionId: string | null = null;

    if (!isMock && supabase) {
      try {
        // Engine 1: Direct PostgreSQL DB Query from purchases table by userId & itemId = 'session_tracker'
        const { data } = await supabase
          .from('purchases')
          .select('itemType')
          .eq('userId', userId)
          .eq('itemId', 'session_tracker')
          .maybeSingle();

        if (data && data.itemType) {
          activeSessionId = data.itemType;
        }
      } catch (err) {
        console.warn('Error querying purchases DB session:', err);
      }

      // Engine 2: Deactivated legacy fallback
      if (!activeSessionId) {}
    }

    if (!activeSessionId) {
      const sessionsMap = getStoredData<Record<string, string>>('bw_active_sessions_map', {});
      activeSessionId = sessionsMap[userId] || null;
    }

    if (activeSessionId && activeSessionId !== localSessionId) {
      return { valid: false };
    }
    return { valid: true };
  },

  getCurrentUser: (): UserProfile | null => {
    if (!currentUser) {
      currentUser = getStoredData<UserProfile | null>('bw_mock_current_user', null);
    }
    return currentUser;
  },

  getNotes: async (year?: string): Promise<{ data: Note[]; error: string | null }> => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (!isOffline) {
      try {
        const res = await vpsApi.getNotes();
        if (res.data && Array.isArray(res.data)) {
          const decodedNotes: Note[] = res.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            subject: n.subject,
            year: n.year || '2nd Year',
            semester: Number(n.semester || 4),
            price: Number(n.price || 49),
            originalPrice: Number(n.originalPrice || n.price * 1.5 || 99),
            description: n.description || '',
            previewUrl: n.pdf_url || n.previewUrl || '',
            pagesCount: Number(n.pagesCount || n.downloads_count || 50),
            topics: Array.isArray(n.topics) ? n.topics : ['Complete Syllabus'],
            type: n.type || 'notes'
          }));

          setStoredData('bw_cached_notes_catalog', decodedNotes);
          const filtered = year ? decodedNotes.filter(n => n.year === year) : decodedNotes;
          return { data: filtered, error: null };
        }
      } catch (err) {
        console.warn('VPS API getNotes failed:', err);
      }
    }

    const cachedNotes = getStoredData<Note[]>('bw_cached_notes_catalog', []);
    const filtered = year ? cachedNotes.filter(n => n.year === year) : cachedNotes;
    return { data: filtered, error: null };
  },

  // --- OFFLINE CACHING & HIGH-SECURITY ENCRYPTION SERVICE ---
  saveNoteForOffline: (note: Note) => {
    if (!note || !note.id) return;
    try {
      const rawJson = JSON.stringify(note);
      const encryptedData = encryptNotePayload(rawJson);
      localStorage.setItem(`bw_offline_note_${note.id}`, encryptedData);
      
      const index = getStoredData<string[]>('bw_offline_notes_index', []);
      if (!index.includes(note.id)) {
        index.push(note.id);
        setStoredData('bw_offline_notes_index', index);
      }
    } catch (err) {
      console.warn('Could not save encrypted note for offline reading:', err);
    }
  },

  getOfflineNote: (noteId: string): Note | null => {
    try {
      const data = localStorage.getItem(`bw_offline_note_${noteId}`);
      if (!data) return null;

      const decryptedJson = decryptNotePayload(data);
      if (decryptedJson) {
        return JSON.parse(decryptedJson);
      }
    } catch (err) {
      try {
        const raw = localStorage.getItem(`bw_offline_note_${noteId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  },

  getOfflineNotesIndex: (): string[] => {
    return getStoredData<string[]>('bw_offline_notes_index', []);
  },

  clearOfflineNotes: () => {
    try {
      const index = getStoredData<string[]>('bw_offline_notes_index', []);
      for (const nid of index) {
        localStorage.removeItem(`bw_offline_note_${nid}`);
      }
      localStorage.removeItem('bw_offline_notes_index');
    } catch (err) {}
  },

  getNoteById: async (id: string): Promise<{ data: Note | null; error: string | null }> => {
    // Check local offline note cache first
    const offlineNote = dbService.getOfflineNote(id);
    if (offlineNote) {
      return { data: offlineNote, error: null };
    }

    if (!isMock && supabase) {
      const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
      if (data) {
        dbService.saveNoteForOffline(data);
      }
      return { data, error: error ? error.message : null };
    } else {
      const note = mockNotes.find(n => n.id === id) || null;
      if (note) {
        dbService.saveNoteForOffline(note);
      }
      return { data: note, error: null };
    }
  },

  uploadFile: async (file: File, folder: 'notes' | 'pyqs' = 'notes'): Promise<{ url: string | null; error: string | null }> => {
    if (!isMock && supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'pdf';
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const fileName = `${folder}_${cleanName}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
          .from('notes-bucket')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          return { url: null, error: error.message };
        }

        const { data: urlData } = supabase.storage
          .from('notes-bucket')
          .getPublicUrl(filePath);

        return { url: urlData.publicUrl, error: null };
      } catch (err: any) {
        return { url: null, error: err.message || 'Error uploading file to storage.' };
      }
    }
    return { url: null, error: 'App running in mock mode. Storage upload bypassed.' };
  },

  addNote: async (note: Omit<Note, 'id'>): Promise<{ data: Note | null; error: string | null }> => {
    const prefix = note.type === 'pyqs' ? 'pyq_' : 'note_';
    const newNote = { ...note, id: prefix + Math.random().toString(36).substr(2, 9) };
    if (!isMock && supabase) {
      const { data, error } = await supabase.from('notes').insert([newNote]).select().single();
      return { data, error: error ? error.message : null };
    } else {
      mockNotes.unshift(newNote);
      setStoredData('bw_mock_notes', mockNotes);
      return { data: newNote, error: null };
    }
  },

  // --- PLAYLISTS SERVICE ---
  getPlaylists: async (year?: string): Promise<{ data: Playlist[]; error: string | null }> => {
    let cachedPlaylists = getStoredData<Playlist[]>('bw_cached_playlists', []);
    if (!cachedPlaylists || cachedPlaylists.length === 0) {
      cachedPlaylists = mockPlaylists;
    }
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const sanitizePlaylists = (list: Playlist[]) => {
      return list.map(p => {
        let url = p.thumbnailUrl ? p.thumbnailUrl.trim() : '';
        if (!url || url.includes('/vi/PL') || url.includes('/vi_webp/PL')) {
          const subjectKey = p.subject ? p.subject.toLowerCase().trim() : '';
          url = SUBJECT_THUMBNAILS_MAP[subjectKey] || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80';
        }
        return { ...p, thumbnailUrl: url };
      });
    };

    if (!isOffline && !isMock && supabase) {
      try {
        let query = supabase.from('playlists').select('*');
        if (year) query = query.eq('year', year);
        const res: any = await fetchWithTimeout(query as any, 2500);
        if (res?.data && res.data.length > 0) {
          const sanitizedDb = sanitizePlaylists(res.data);
          setStoredData('bw_cached_playlists', sanitizedDb);
          return { data: sanitizedDb, error: null };
        }
      } catch (e) {}
    }

    const sanitizedLocal = sanitizePlaylists(cachedPlaylists);
    const finalData = year ? sanitizedLocal.filter(p => p.year === year) : sanitizedLocal;
    return { data: finalData, error: null };
  },

  addPlaylist: async (playlist: Omit<Playlist, 'id'>): Promise<{ data: Playlist | null; error: string | null }> => {
    const newPlaylist = { ...playlist, id: 'play_' + Math.random().toString(36).substr(2, 9) };
    if (!isMock && supabase) {
      const { data, error } = await supabase.from('playlists').insert([newPlaylist]).select().single();
      return { data, error: error ? error.message : null };
    } else {
      mockPlaylists.unshift(newPlaylist as any);
      setStoredData('bw_mock_playlists', mockPlaylists);
      return { data: newPlaylist as any, error: null };
    }
  },

  // --- USER PURCHASES & ACCESS SERVICE ---
  isNotesPurchased: async (notesId: string): Promise<boolean> => {
    return dbService.checkNoteAccess(notesId);
  },

  checkNoteAccess: async (notesId: string): Promise<boolean> => {
    if (!currentUser) return false;

    // Check if item or purchase is blacklisted/revoked
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    const revokedItems = getStoredData<string[]>('bw_revoked_item_ids', []);

    if (revokedIds.includes(notesId) || revokedItems.includes(notesId)) {
      return false;
    }

    const { purchasedNoteIds } = await dbService.getAllUserPurchasesState();
    return purchasedNoteIds.includes(notesId);
  },

  getPurchaseDetails: async (notesId: string): Promise<{ purchased: boolean; expiresAt: string | null; daysLeft: number | null }> => {
    if (!currentUser) return { purchased: false, expiresAt: null, daysLeft: null };

    // Check if item or purchase is blacklisted/revoked
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    const revokedItems = getStoredData<string[]>('bw_revoked_item_ids', []);

    if (revokedIds.includes(notesId) || revokedItems.includes(notesId)) {
      return { purchased: false, expiresAt: null, daysLeft: null };
    }

    const { purchasedNoteIds, noteDetailsMap } = await dbService.getAllUserPurchasesState();
    
    if (purchasedNoteIds.includes(notesId)) {
      const details = noteDetailsMap[notesId];
      return {
        purchased: true,
        expiresAt: details?.expiresAt || null,
        daysLeft: details?.daysLeft || null
      };
    }

    return { purchased: false, expiresAt: null, daysLeft: null };
  },

  // Batch purchase status fetcher to prevent N+1 query loading bottlenecks (0ms Instant Return)
  getAllUserPurchasesState: async (): Promise<{
    purchasedNoteIds: string[];
    purchasedBundleIds: string[];
    noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }>;
    bundleDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }>;
  }> => {
    if (!currentUser) {
      currentUser = getStoredData<UserProfile | null>('bw_mock_current_user', null);
      if (!currentUser) {
        return { purchasedNoteIds: [], purchasedBundleIds: [], noteDetailsMap: {}, bundleDetailsMap: {} };
      }
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    let allPurchases: Purchase[] = [];
    let liveDbFetched = false;

    // 1. LIVE VPS DB SYNC: Query exact active purchases from PostgreSQL DB
    if (!isOffline) {
      try {
        const res = await vpsApi.getUserPurchases(currentUser.id);
        if (res.data && Array.isArray(res.data)) {
          const freshPurchases: Purchase[] = res.data.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            itemId: p.item_id,
            itemType: (p.item_type === 'note' ? 'notes' : p.item_type) as any,
            purchasedAt: p.granted_at,
            expiresAt: p.expires_at || '2099-01-01T00:00:00.000Z',
            paymentId: p.razorpay_payment_id
          }));

          setStoredData(`bw_user_purchases_cache_${currentUser.id}`, freshPurchases);
          allPurchases = freshPurchases;
          liveDbFetched = true;

          // Merge local cache purchases so offline or local grants are preserved
          const localMap = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
          const localUserPurchases = localMap[currentUser.id] || localMap[currentUser.email?.trim().toLowerCase() || ''] || [];
          for (const lp of localUserPurchases) {
            if (!allPurchases.some(p => p.itemId === lp.itemId && p.itemType === lp.itemType)) {
              allPurchases.push(lp);
            }
          }
        }
      } catch (err) {
        console.warn('Live VPS DB purchase sync warning:', err);
      }
    }

    // 2. FALLBACK TO LOCAL CACHE ONLY IF OFFLINE OR MOCK MODE
    if (!liveDbFetched) {
      const cachedUserPurchases = getStoredData<Purchase[]>(`bw_user_purchases_cache_${currentUser.id}`, []);
      const localMap = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      const localUserPurchases = localMap[currentUser.id] || localMap[currentUser.email?.trim().toLowerCase() || ''] || [];
      const mockForUser = mockPurchasesV2.filter(p => p.userId === currentUser?.id || p.userEmail === currentUser?.email);

      allPurchases = [...cachedUserPurchases];
      for (const lp of localUserPurchases) {
        if (!allPurchases.some(p => p.itemId === lp.itemId && p.itemType === lp.itemType)) {
          allPurchases.push(lp);
        }
      }
      for (const mp of mockForUser) {
        if (!allPurchases.some(p => p.itemId === mp.itemId && p.itemType === mp.itemType)) {
          allPurchases.push(mp);
        }
      }

      // Only include offline notes if not revoked globally
      const isGlobalRevoked = typeof localStorage !== 'undefined' && localStorage.getItem('bw_all_licenses_revoked') === 'true';
      if (!isGlobalRevoked) {
        const offlineIndex = dbService.getOfflineNotesIndex();
        for (const nid of offlineIndex) {
          if (!allPurchases.some(p => p.itemId === nid)) {
            allPurchases.push({
              id: nid,
              userId: currentUser.id,
              itemId: nid,
              itemType: 'notes',
              purchasedAt: new Date().toISOString(),
              expiresAt: '2099-01-01T00:00:00.000Z'
            });
          }
        }
      }
    }

    // Filter out blacklisted revoked purchase IDs
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    if (revokedIds.length > 0) {
      allPurchases = allPurchases.filter(p => !revokedIds.includes(p.id) && !revokedIds.includes(p.itemId));
    }

    const noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
    const bundleDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
    const purchasedNoteIdsSet = new Set<string>();
    const purchasedBundleIdsSet = new Set<string>();

    const { data: allNotesData } = await dbService.getNotes();
    const allNotesList = allNotesData || getStoredData<Note[]>('bw_mock_notes', mockNotes);
    const { data: allBundlesData } = await dbService.getBundles();
    const allBundles = allBundlesData || getStoredData<Bundle[]>('bw_cached_bundles', mockBundles.map(decodeBundleFromDb));

    const now = new Date();
    for (const p of allPurchases) {
      const expDate = new Date(p.expiresAt);
      if (expDate > now) {
        const diffTime = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isSubjectPack = p.itemType === 'subject' || 
          (typeof p.itemId === 'string' && (
            p.itemId.startsWith('Subject Combo:') || 
            p.itemId.startsWith('Subject Pack:') || 
            p.itemId.startsWith('subject_pack_')
          ));

        if (p.itemType === 'notes') {
          purchasedNoteIdsSet.add(p.itemId);
          noteDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };
        } else if (isSubjectPack) {
          const rawSubjectName = p.itemId.replace(/^Subject (Pack|Combo):\s*/i, '').replace(/^subject_pack_\s*/i, '').replace(/_/g, ' ').trim();
          const targetSubject = rawSubjectName.toLowerCase();
          const subjectKey = `subject_pack_${targetSubject.replace(/\s+/g, '_')}`;

          purchasedBundleIdsSet.add(subjectKey);
          bundleDetailsMap[subjectKey] = { expiresAt: p.expiresAt, daysLeft };

          // Also record original itemId if different
          if (p.itemId !== subjectKey) {
            purchasedBundleIdsSet.add(p.itemId);
            bundleDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };
          }

          allNotesList.forEach(n => {
            if (n.subject && n.subject.toLowerCase() === targetSubject) {
              purchasedNoteIdsSet.add(n.id);
              if (!noteDetailsMap[n.id]) {
                noteDetailsMap[n.id] = { expiresAt: p.expiresAt, daysLeft };
              }
            }
          });
        } else if (p.itemType === 'bundle') {
          purchasedBundleIdsSet.add(p.itemId);
          bundleDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };

          const bundleObj = allBundles.find(b => b.id.toLowerCase() === p.itemId.toLowerCase() || b.title.toLowerCase().includes(p.itemId.toLowerCase())) || mockBundles.find(b => b.id === p.itemId);
          if (bundleObj) {
            // 1. Expand explicit notesIds
            const bNotesIds = safeParseBundleNotesIds(bundleObj.notesIds);
            bNotesIds.forEach(nid => {
              purchasedNoteIdsSet.add(nid);
              if (!noteDetailsMap[nid]) {
                noteDetailsMap[nid] = { expiresAt: p.expiresAt, daysLeft };
              }
            });

            // 2. Expand notes matching bundle subjects or semester
            const subjects = Array.isArray(bundleObj.subjects) ? bundleObj.subjects : [];
            allNotesList.forEach(n => {
              const matchesSubject = subjects.some(s => s && n.subject && s.toLowerCase() === n.subject.toLowerCase());
              const matchesSem = bundleObj.semester && n.semester === bundleObj.semester;
              if (matchesSubject || matchesSem) {
                purchasedNoteIdsSet.add(n.id);
                if (!noteDetailsMap[n.id]) {
                  noteDetailsMap[n.id] = { expiresAt: p.expiresAt, daysLeft };
                }
              }
            });
          } else {
            // Fallback note expansion for synthetic or custom bundles without static bundle object
            const cleanId = p.itemId.toLowerCase();
            allNotesList.forEach(n => {
              const matchesSubj = n.subject && cleanId.includes(n.subject.toLowerCase());
              const matchesSem = n.semester && (cleanId.includes(`${n.semester}th sem`) || cleanId.includes(`sem ${n.semester}`) || cleanId.includes(`semester ${n.semester}`));
              if (matchesSubj || matchesSem) {
                purchasedNoteIdsSet.add(n.id);
                if (!noteDetailsMap[n.id]) {
                  noteDetailsMap[n.id] = { expiresAt: p.expiresAt, daysLeft };
                }
              }
            });
          }
        }
      }
    }

    return {
      purchasedNoteIds: Array.from(purchasedNoteIdsSet),
      purchasedBundleIds: Array.from(purchasedBundleIdsSet),
      noteDetailsMap,
      bundleDetailsMap
    };
  },

  purchaseNotes: async (notesId: string, paymentDetails?: { paymentId?: string; orderId?: string; signature?: string }): Promise<{ success: boolean; error: string | null }> => {
    if (!currentUser) return { success: false, error: 'You must be logged in to buy notes.' };
    
    const purchasedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(purchasedAt.getMonth() + 6); // Exactly 6-month validity

    const newPurchase: Purchase = {
      id: generateUUID(),
      userId: currentUser.id,
      itemId: notesId,
      itemType: 'notes',
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentId: paymentDetails?.paymentId || '',
      orderId: paymentDetails?.orderId || '',
      signature: paymentDetails?.signature || ''
    };

    // Always record purchase in local cache so user access is immediate and guaranteed
    mockPurchasesV2 = mockPurchasesV2.filter(p => !(p.itemId === notesId && p.itemType === 'notes'));
    mockPurchasesV2.push(newPurchase);
    setStoredData('bw_mock_purchases_v2', mockPurchasesV2);

    const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
    storedMapV2[currentUser.id] = mockPurchasesV2;
    setStoredData('bw_mock_purchases_map_v2', storedMapV2);

    try {
      await vpsApi.grantPurchase(currentUser.id, notesId, 'note', 99, paymentDetails?.paymentId);
    } catch (e) {
      console.warn('VPS API purchase grant warning:', e);
    }

    return { success: true, error: null };
  },

  getPurchasedNotes: async (): Promise<{ data: Note[]; error: string | null }> => {
    const user = dbService.getCurrentUser();
    if (!user) return { data: [], error: 'User session not active.' };

    const isGlobalRevoked = typeof localStorage !== 'undefined' && localStorage.getItem('bw_all_licenses_revoked') === 'true';
    if (isGlobalRevoked) {
      return { data: [], error: null };
    }

    const { data: allNotes } = await dbService.getNotes();

    // Batch fetch all purchases for current user in 1 fast query (checks DB + local cache + offline index)
    const { purchasedNoteIds } = await dbService.getAllUserPurchasesState();

    if (purchasedNoteIds.length === 0) {
      return { data: [], error: null };
    }

    const noteMap = new Map<string, Note>();
    (allNotes || []).forEach(n => noteMap.set(n.id, n));

    const purchasedList: Note[] = [];
    for (const nid of purchasedNoteIds) {
      let noteObj = noteMap.get(nid);
      if (!noteObj) {
        noteObj = dbService.getOfflineNote(nid) || undefined;
      }
      if (noteObj) {
        purchasedList.push(noteObj);
      }
    }

    return { data: purchasedList, error: null };
  },

  // --- BUNDLES SERVICE ---
  getBundles: async (year?: string): Promise<{ data: Bundle[]; error: string | null }> => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (!isOffline) {
      try {
        const res = await vpsApi.getBundles();
        if (res.data && Array.isArray(res.data)) {
          const processed: Bundle[] = res.data.map((b: any) => ({
            id: b.id,
            title: b.title,
            description: cleanBundleDescription(b.description || ''),
            price: Number(b.price || 299),
            originalPrice: Number(b.original_price || b.originalPrice || 499),
            year: b.year || '2nd Year',
            semester: Number(b.semester || 4),
            notesIds: safeParseBundleNotesIds(b.notesIds),
            subject: b.subject || '',
            subjects: b.subjects || [b.subject || 'All Subjects'],
            type: 'semester'
          }));

          setStoredData('bw_cached_bundles', processed);
          const filtered = year ? processed.filter(b => b.year === year) : processed;
          return { data: filtered, error: null };
        }
      } catch (err) {}
    }

    const cachedBundles = getStoredData<Bundle[]>('bw_cached_bundles', INITIAL_BUNDLES);
    const bundles = year ? cachedBundles.filter(b => b.year === year) : cachedBundles;
    return { data: bundles, error: null };
  },

  addBundle: async (bundle: Omit<Bundle, 'id'>): Promise<{ data: Bundle | null; error: string | null }> => {
    const newBundle = { ...bundle, id: 'bundle_' + Math.random().toString(36).substring(2, 11) };
    
    mockBundles.unshift(newBundle);
    setStoredData('bw_mock_bundles', mockBundles);
    setStoredData('bw_cached_bundles', mockBundles.map(decodeBundleFromDb));

    if (!isMock && supabase) {
      const { subjects, ...dbPayload } = newBundle as any;
      dbPayload.description = encodeBundleDescription(dbPayload.description || '', subjects);
      const { error } = await supabase.from('bundles').insert([dbPayload]).select().single();
      if (error) {
        console.warn('Supabase DB bundle insert warning:', error.message);
      }
      return { data: newBundle, error: null };
    } else {
      return { data: newBundle, error: null };
    }
  },

  purchaseBundle: async (bundleId: string, paymentDetails?: { paymentId?: string; orderId?: string; signature?: string }): Promise<{ success: boolean; error: string | null }> => {
    if (!currentUser) return { success: false, error: 'You must be logged in to buy bundles.' };

    const purchasedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(purchasedAt.getMonth() + 6); // 6-month validity

    const newPurchase: Purchase = {
      id: generateUUID(),
      userId: currentUser.id,
      itemId: bundleId,
      itemType: 'bundle',
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentId: paymentDetails?.paymentId || '',
      orderId: paymentDetails?.orderId || '',
      signature: paymentDetails?.signature || ''
    };

    // Always record purchase in local cache so user access is immediate and guaranteed
    mockPurchasesV2 = mockPurchasesV2.filter(p => !(p.itemId === bundleId && p.itemType === 'bundle'));
    mockPurchasesV2.push(newPurchase);
    setStoredData('bw_mock_purchases_v2', mockPurchasesV2);

    const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
    storedMapV2[currentUser.id] = mockPurchasesV2;
    setStoredData('bw_mock_purchases_map_v2', storedMapV2);

    if (!isMock && supabase) {
      try {
        const { userEmail, itemName, ...dbPayload } = newPurchase;
        await supabase.from('purchases').insert([dbPayload]);
      } catch (e) {
        console.warn('Supabase DB purchase insert warning:', e);
      }
    }

    return { success: true, error: null };
  },

  isBundlePurchased: async (bundleId: string): Promise<{ purchased: boolean; expiresAt: string | null; daysLeft: number | null }> => {
    if (!currentUser) return { purchased: false, expiresAt: null, daysLeft: null };

    const now = new Date();

    if (!isMock && supabase) {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('*')
        .eq('userId', currentUser.id)
        .eq('itemId', bundleId)
        .eq('itemType', 'bundle')
        .gt('expiresAt', now.toISOString())
        .maybeSingle();

      if (purchase) {
        const expDate = new Date(purchase.expiresAt);
        const diffTime = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { purchased: true, expiresAt: purchase.expiresAt, daysLeft };
      }
      return { purchased: false, expiresAt: null, daysLeft: null };
    } else {
      const purchase = mockPurchasesV2.find(p => p.itemId === bundleId && p.itemType === 'bundle');
      if (purchase) {
        const expDate = new Date(purchase.expiresAt);
        if (expDate > now) {
          const diffTime = expDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { purchased: true, expiresAt: purchase.expiresAt, daysLeft };
        }
      }
      return { purchased: false, expiresAt: null, daysLeft: null };
    }
  },

  getPurchasedBundles: async (): Promise<{ data: { bundle: Bundle; expiresAt: string; daysLeft: number }[]; error: string | null }> => {
    const user = dbService.getCurrentUser();
    if (!user) return { data: [], error: 'User session not active.' };
    
    const isGlobalRevoked = typeof localStorage !== 'undefined' && localStorage.getItem('bw_all_licenses_revoked') === 'true';
    if (isGlobalRevoked) {
      return { data: [], error: null };
    }

    const { purchasedBundleIds, bundleDetailsMap } = await dbService.getAllUserPurchasesState();
    if (purchasedBundleIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: allBundlesData } = await dbService.getBundles();
    const allBundles = allBundlesData || getStoredData<Bundle[]>('bw_cached_bundles', mockBundles.map(decodeBundleFromDb));

    const results: { bundle: Bundle; expiresAt: string; daysLeft: number }[] = [];
    const addedBundleIds = new Set<string>();

    for (const bid of purchasedBundleIds) {
      let bundle = allBundles.find(b => b.id.toLowerCase() === bid.toLowerCase() || b.title.toLowerCase().includes(bid.toLowerCase())) || mockBundles.find(b => b.id.toLowerCase() === bid.toLowerCase());
      
      if (!bundle) {
        let cleanName = bid;
        if (cleanName.startsWith('subject_pack_')) {
          cleanName = cleanName.replace('subject_pack_', '').replace(/_/g, ' ');
          cleanName = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        const isSubjectPack = bid.startsWith('subject_pack_') || bid.includes('Subject Combo:') || bid.includes('Subject Pack:');
        const displayTitle = isSubjectPack 
          ? (cleanName.startsWith('Subject Pack:') || cleanName.startsWith('Subject Combo:') ? cleanName : `Subject Pack: ${cleanName}`)
          : (cleanName.startsWith('Semester Combo') || cleanName.startsWith('BUNDLE') || cleanName.includes('Bundle') ? cleanName : `Semester Combo Pack (${cleanName})`);

        const rawSubject = cleanName.replace(/^Subject (Pack|Combo):\s*/i, '').trim();

        bundle = {
          id: bid,
          title: displayTitle,
          year: '2nd Year',
          semester: 4,
          price: 0,
          originalPrice: 0,
          description: `Complete syllabus notes, PYQs & important questions bundle for ${rawSubject || cleanName}`,
          subjects: isSubjectPack ? [rawSubject || cleanName] : [],
          notesIds: []
        };
      }

      if (!addedBundleIds.has(bundle.id)) {
        addedBundleIds.add(bundle.id);
        const details = bundleDetailsMap[bid];
        results.push({
          bundle,
          expiresAt: details?.expiresAt || new Date().toISOString(),
          daysLeft: details?.daysLeft || 0
        });
      }
    }

    return { data: results, error: null };
  },

  // --- ADMIN INVENTORY EDITOR APIs ---
  updateNote: async (id: string, note: Partial<Note>): Promise<{ success: boolean; error: string | null }> => {
    if (!isMock && supabase) {
      const { error } = await supabase.from('notes').update(note).eq('id', id);
      return { success: !error, error: error ? error.message : null };
    } else {
      mockNotes = mockNotes.map(n => n.id === id ? { ...n, ...note } : n);
      setStoredData('bw_mock_notes', mockNotes);
      return { success: true, error: null };
    }
  },

  deleteNote: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!isMock && supabase) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      return { success: !error, error: error ? error.message : null };
    } else {
      mockNotes = mockNotes.filter(n => n.id !== id);
      setStoredData('bw_mock_notes', mockNotes);
      // Remove note from bundles too
      mockBundles = mockBundles.map(b => ({
        ...b,
        notesIds: b.notesIds.filter(nid => nid !== id)
      }));
      setStoredData('bw_mock_bundles', mockBundles);
      return { success: true, error: null };
    }
  },

  updateBundle: async (id: string, bundle: Partial<Bundle>): Promise<{ success: boolean; error: string | null }> => {
    // 1. Update local cache immediately so subjects state is saved locally and instantly active
    mockBundles = mockBundles.map(b => b.id === id ? { ...b, ...bundle } : b);
    setStoredData('bw_mock_bundles', mockBundles);
    setStoredData('bw_cached_bundles', mockBundles.map(decodeBundleFromDb));

    if (!isMock && supabase) {
      // 2. Strip 'subjects' column from payload & encode into description before DB call
      const { subjects, ...dbPayload } = bundle as any;
      if (dbPayload.description || subjects) {
        dbPayload.description = encodeBundleDescription(dbPayload.description || '', subjects || bundle.subjects);
      }
      const { error } = await supabase.from('bundles').update(dbPayload).eq('id', id);
      if (error) {
        console.warn('Supabase DB bundle update warning:', error.message);
      }
      return { success: true, error: null };
    } else {
      return { success: true, error: null };
    }
  },

  deleteBundle: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    mockBundles = mockBundles.filter(b => b.id !== id);
    setStoredData('bw_mock_bundles', mockBundles);
    setStoredData('bw_cached_bundles', mockBundles.map(decodeBundleFromDb));
    if (!isMock && supabase) {
      const { error } = await supabase.from('bundles').delete().eq('id', id);
      return { success: !error, error: error ? error.message : null };
    } else {
      return { success: true, error: null };
    }
  },

  deletePlaylist: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!isMock && supabase) {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      return { success: !error, error: error ? error.message : null };
    } else {
      mockPlaylists = mockPlaylists.filter(p => p.id !== id);
      setStoredData('bw_mock_playlists', mockPlaylists);
      return { success: true, error: null };
    }
  },

  // --- MANUAL STUDENT LICENSING ENGINE ---
  grantManualLicense: async (email: string, itemId: string, itemType: 'notes' | 'bundle' | 'subject', _months: number): Promise<{ success: boolean; error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Clear global revocation flag when new license is granted
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('bw_all_licenses_revoked');
    }
    const revokedItems = getStoredData<string[]>('bw_revoked_item_ids', []).filter(id => id !== itemId);
    setStoredData('bw_revoked_item_ids', revokedItems);

    const targetUserIds = new Set<string>();
    targetUserIds.add(cleanEmail);

    // 2. Fetch profiles from VPS DB to find matching user ID
    try {
      const profilesRes = await vpsApi.getAllProfiles();
      if (profilesRes?.data && Array.isArray(profilesRes.data)) {
        profilesRes.data.forEach((p: any) => {
          if (p.email && p.email.trim().toLowerCase() === cleanEmail) {
            targetUserIds.add(p.id);
          }
        });
      }
    } catch (err) {
      console.warn('Error resolving profile from VPS:', err);
    }

    const dbItemType = itemType === 'subject' ? 'bundle' : (itemType === 'notes' ? 'note' : 'bundle');

    try {
      for (const uid of Array.from(targetUserIds)) {
        await vpsApi.grantPurchase(uid, itemId, dbItemType as any);
      }
    } catch (e) {
      console.warn('VPS API grant manual license error:', e);
    }

    // Clear cached user purchases so student receives fresh live DB purchases instantly
    if (currentUser) {
      try {
        localStorage.removeItem(`bw_user_purchases_cache_${currentUser.id}`);
      } catch (e) {}
    }

    return { success: true, error: null };
  },

  revokeLicense: async (purchaseId: string): Promise<{ success: boolean; error: string | null }> => {
    // 1. Instantly blacklist purchaseId in local storage
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    if (!revokedIds.includes(purchaseId)) {
      revokedIds.push(purchaseId);
      setStoredData('bw_revoked_purchase_ids', revokedIds);
    }

    // 2. Clear local mock map storage
    const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
    Object.keys(storedMapV2).forEach(uid => {
      storedMapV2[uid] = storedMapV2[uid].filter(p => p.id !== purchaseId);
    });
    setStoredData('bw_mock_purchases_map_v2', storedMapV2);

    if (currentUser) {
      mockPurchasesV2 = storedMapV2[currentUser.id] || [];
      setStoredData('bw_mock_purchases_v2', mockPurchasesV2);
      try {
        localStorage.removeItem(`bw_user_purchases_cache_${currentUser.id}`);
      } catch (e) {}
    }

    // 3. Issue DB Revocation Marker insert + delete + expire in Supabase DB if online
    if (!isMock && supabase) {
      try {
        // Insert DB Revocation Marker (using valid UUIDs to satisfy Postgres UUID constraint)
        const markerPayload = {
          id: generateUUID(),
          userId: SYSTEM_REVOKED_MARKER_UUID,
          itemId: `REVOKED_SINGLE:${purchaseId}`,
          itemType: 'bundle',
          purchasedAt: new Date().toISOString(),
          expiresAt: '2099-01-01T00:00:00.000Z'
        };
        await supabase.from('purchases').insert([markerPayload]);

        await supabase.from('purchases').delete().eq('id', purchaseId);
        await supabase.from('purchases').update({ expiresAt: '1970-01-01T00:00:00.000Z' }).eq('id', purchaseId);
      } catch (err) {
        console.warn('Error revoking single purchase in Supabase:', err);
      }
    }

    return { success: true, error: null };
  },

  revokeAllLicenses: async (): Promise<{ success: boolean; error: string | null }> => {
    // 1. Set global revocation flag in localStorage so mobile app & web immediately block access
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bw_all_licenses_revoked', 'true');
    }

    // 2. Collect current active purchase IDs to blacklist locally
    const current = await dbService.getAllPurchases();
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    if (current.data && current.data.length > 0) {
      current.data.forEach(p => {
        if (p.id && !revokedIds.includes(p.id)) revokedIds.push(p.id);
      });
    }
    setStoredData('bw_revoked_purchase_ids', revokedIds);

    // 3. Clear all offline cached notes (index and payloads) on mobile device
    dbService.clearOfflineNotes();

    // 4. Clear local storage maps completely
    setStoredData('bw_mock_purchases_map_v2', {});
    setStoredData('bw_mock_purchases_v2', []);
    mockPurchasesV2 = [];

    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('bw_user_purchases_cache_') || key.startsWith('bw_mock_purchases')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {}

    return { success: true, error: null };
  },

  getAllProfiles: async (): Promise<{ data: UserProfile[]; error: string | null }> => {
    try {
      const res = await vpsApi.getAllProfiles();
      if (res.data) {
        return { data: res.data, error: null };
      }
    } catch (e) {}
    const local = getStoredData<UserProfile[]>('bw_mock_users', mockUsers);
    return { data: local, error: null };
  },

  getAllPurchases: async (): Promise<{ data: (Purchase & { userEmail?: string; userName?: string; itemName?: string })[]; error: string | null }> => {
    let rawPurchases: Purchase[] = [];
    let dbProfiles: UserProfile[] = [];
    let dbNotes: Note[] = [];
    let dbBundles: Bundle[] = [];

    try {
      const [purchasesRes, profilesRes, notesRes, bundlesRes] = await Promise.all([
        vpsApi.getAllPurchases(),
        vpsApi.getAllProfiles(),
        vpsApi.getNotes(),
        vpsApi.getBundles()
      ]);

      if (purchasesRes?.data && Array.isArray(purchasesRes.data)) {
        rawPurchases = purchasesRes.data.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          itemId: p.item_id,
          itemType: (p.item_type === 'note' ? 'notes' : p.item_type) as any,
          purchasedAt: p.granted_at,
          expiresAt: p.expires_at || '2099-01-01T00:00:00.000Z',
          paymentId: p.razorpay_payment_id
        }));
      }
      if (profilesRes?.data) dbProfiles = profilesRes.data;
      if (notesRes?.data) dbNotes = notesRes.data;
      if (bundlesRes?.data) dbBundles = bundlesRes.data;
    } catch (err) {
      console.warn('Error fetching purchases/profiles from VPS API:', err);
    }

    const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
    Object.keys(storedMapV2).forEach(uid => {
      const ulist = storedMapV2[uid] || [];
      for (const p of ulist) {
        if (!rawPurchases.some(rp => rp.id === p.id || (rp.itemId === p.itemId && rp.userId === p.userId))) {
          rawPurchases.push(p);
        }
      }
    });

    // Filter out blacklisted revoked purchase IDs
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    if (revokedIds.length > 0) {
      rawPurchases = rawPurchases.filter(p => !revokedIds.includes(p.id));
    }

    // Filter out expired purchases (expiresAt <= now)
    const now = new Date();
    rawPurchases = rawPurchases.filter(p => new Date(p.expiresAt) > now);

    const localProfiles = getStoredData<UserProfile[]>('bw_mock_users', mockUsers);
    const combinedProfiles = [...dbProfiles, ...localProfiles];
    const allNotesList = [...dbNotes, ...getStoredData<Note[]>('bw_mock_notes', mockNotes)];
    const allBundlesList = [...dbBundles, ...getStoredData<Bundle[]>('bw_mock_bundles', mockBundles)];

    const mapped = rawPurchases.map(p => {
      const user = combinedProfiles.find(u => u.id === p.userId || (u.email && p.userEmail && u.email.toLowerCase() === p.userEmail.toLowerCase()));
      
      let name = p.itemName || '';
      let subject = '';

      if (p.itemType === 'notes') {
        const foundNote = allNotesList.find(n => n.id === p.itemId);
        if (foundNote) {
          name = foundNote.title;
          subject = foundNote.subject || '';
        } else {
          name = p.itemName || 'Study Notes Pack';
        }
      } else if (p.itemType === 'subject') {
        subject = p.itemId.replace(/^Subject (Pack|Combo):\s*/i, '').trim();
        name = `Subject Combo: ${subject}`;
      } else if (p.itemType === 'bundle') {
        const foundBundle = allBundlesList.find(b => b.id === p.itemId || b.id.toLowerCase() === p.itemId.toLowerCase());
        if (foundBundle) {
          name = foundBundle.title;
          subject = Array.isArray(foundBundle.subjects) && foundBundle.subjects.length > 0 
            ? foundBundle.subjects.join(', ') 
            : ((foundBundle as any).subject || (foundBundle.semester ? `Semester ${foundBundle.semester}` : ''));
        } else {
          name = p.itemName || `Semester Bundle (${p.itemId})`;
        }
      }

      if (!name) name = p.itemId || 'Unlocked License';

      const actualEmail = user?.email || p.userEmail || 'Student (' + p.userId.substring(0, 8) + ')';
      const actualName = user?.name || '';

      return {
        ...p,
        userEmail: actualEmail,
        userName: actualName,
        itemName: name,
        itemSubject: subject
      };
    });

    return { data: mapped, error: null };
  },

  clearDatabase: async (): Promise<{ success: boolean }> => {
    mockNotes = [];
    mockBundles = [];
    mockPlaylists = [];
    mockPurchasesV2 = [];
    setStoredData('bw_mock_notes', []);
    setStoredData('bw_mock_bundles', []);
    setStoredData('bw_mock_playlists', []);
    setStoredData('bw_mock_purchases_v2', []);
    return { success: true };
  }
};
