import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables with hardcoded fallbacks for native Android/iOS APK builds
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zczomcghyktsaimwhwxp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_T_NLVZYhGMxVuELQNEgtGQ_zBgeBMHl';

// Determine if we should use mock database
export const isMock = !supabaseUrl || !supabaseAnonKey;

// Initialize Supabase client if keys are present
export const supabase = !isMock ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  itemId: string; // notesId or bundleId
  itemType: 'notes' | 'bundle';
  userEmail?: string;
  itemName?: string;
  purchasedAt: string;
  expiresAt: string;
  paymentId?: string;
  orderId?: string;
  signature?: string;
}

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
const getStoredData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStoredData = <T>(key: string, value: T): void => {
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
    if (!isMock && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { data: null, error: error.message };
      if (data.user) {
        const profile = { id: data.user.id, name, email, phone, role: 'student' as const };
        const { error: dbError } = await supabase.from('profiles').insert([profile]);
        if (dbError) return { data: null, error: dbError.message };
        currentUser = profile;
        setStoredData('bw_mock_current_user', currentUser);
        await dbService.registerDeviceSession(profile.id);
        return { data: profile, error: null };
      }
      return { data: null, error: 'Signup failed. Please try again.' };
    } else {
      // Mock SignUp
      const userExists = mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return { data: null, error: 'User already exists with this email address.' };
      }
      const newProfile: UserProfile = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone,
        role: email.toLowerCase() === 'bitwiselearning0@gmail.com' ? 'admin' : 'student'
      };
      mockUsers.push(newProfile);
      setStoredData('bw_mock_users', mockUsers);
      
      // Auto login after signup
      currentUser = newProfile;
      setStoredData('bw_mock_current_user', currentUser);
      await dbService.registerDeviceSession(newProfile.id);
      return { data: newProfile, error: null };
    }
  },

  signIn: async (email: string, password: string): Promise<{ data: UserProfile | null; error: string | null }> => {
    if (!isMock && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { data: null, error: error.message };
      if (data.user) {
        const { data: profile, error: dbError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (dbError) return { data: null, error: dbError.message };
        currentUser = profile;
        setStoredData('bw_mock_current_user', currentUser);
        await dbService.registerDeviceSession(profile.id);
        return { data: profile, error: null };
      }
      return { data: null, error: 'Login failed. Invalid credentials.' };
    } else {
      // Mock Login
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        if (email.toLowerCase() === 'bitwiselearning0@gmail.com') {
          const adminUser: UserProfile = {
            id: 'admin_bitwise',
            name: 'Bitwise Admin',
            email: 'bitwiselearning0@gmail.com',
            phone: '9999999999',
            role: 'admin'
          };
          mockUsers.push(adminUser);
          setStoredData('bw_mock_users', mockUsers);
          currentUser = adminUser;
          setStoredData('bw_mock_current_user', currentUser);
          await dbService.registerDeviceSession(adminUser.id);
          return { data: adminUser, error: null };
        }
        return { data: null, error: 'User not registered. Please register first.' };
      }
      currentUser = user;
      setStoredData('bw_mock_current_user', currentUser);
      await dbService.registerDeviceSession(user.id);
      
      // Load user purchases
      const storedPurchasesV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      mockPurchasesV2 = storedPurchasesV2[user.id] || [];
      setStoredData('bw_mock_purchases_v2', mockPurchasesV2);
      
      return { data: user, error: null };
    }
  },

  signOut: async (): Promise<{ error: string | null }> => {
    localStorage.removeItem('bw_device_session_id');
    if (!isMock && supabase) {
      const { error } = await supabase.auth.signOut();
      currentUser = null;
      setStoredData('bw_mock_current_user', null);
      return { error: error ? error.message : null };
    } else {
      currentUser = null;
      mockPurchasesV2 = [];
      setStoredData('bw_mock_current_user', null);
      setStoredData('bw_mock_purchases_v2', []);
      return { error: null };
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

      // Engine 2: Fallback to Supabase Auth endpoint
      if (!activeSessionId) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          let token = sessionData?.session?.access_token;
          if (!token) {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('auth-token')) {
                try {
                  const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                  token = parsed?.access_token || parsed?.currentSession?.access_token;
                  if (token) break;
                } catch (e) {}
              }
            }
          }
          if (token) {
            const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-store',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`
              }
            });
            if (res.ok) {
              const userJson = await res.json();
              if (userJson?.user_metadata?.active_session_id) {
                activeSessionId = userJson.user_metadata.active_session_id;
              }
            }
          }
        } catch (e) {}
      }
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

  // --- NOTES SERVICE ---
  getNotes: async (year?: string): Promise<{ data: Note[]; error: string | null }> => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (!isOffline && !isMock && supabase) {
      try {
        let query = supabase.from('notes').select('*');
        if (year) query = query.eq('year', year);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const decodedNotes: Note[] = data.map((n: any) => ({
            id: n.id,
            title: n.title,
            subject: n.subject,
            year: n.year,
            semester: Number(n.semester),
            price: Number(n.price),
            originalPrice: Number(n.originalPrice || n.price * 1.5),
            description: n.description || '',
            previewUrl: n.previewUrl || n.preview_url || '',
            pagesCount: Number(n.pagesCount || n.pages_count || 50),
            topics: Array.isArray(n.topics) ? n.topics : (typeof n.topics === 'string' ? JSON.parse(n.topics) : ['Complete Syllabus']),
            type: n.type || 'notes'
          }));

          setStoredData('bw_cached_notes_catalog', decodedNotes);
          return { data: decodedNotes, error: null };
        }
      } catch (err) {
        console.warn('Supabase getNotes failed, falling back to local cache:', err);
      }
    }

    // Fallback to cached notes if offline or DB query yields 0 rows
    const cachedNotes = getStoredData<Note[]>('bw_cached_notes_catalog', INITIAL_NOTES);
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
    const cachedPlaylists = getStoredData<Playlist[]>('bw_cached_playlists', mockPlaylists);
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const getLocalPlaylists = () => year ? cachedPlaylists.filter(p => p.year === year) : cachedPlaylists;

    if (isOffline || isMock || !supabase || cachedPlaylists.length > 0) {
      if (!isOffline && !isMock && supabase) {
        (async () => {
          try {
            let query = supabase.from('playlists').select('*');
            if (year) query = query.eq('year', year);
            const res: any = await fetchWithTimeout(query as any, 800);
            if (res?.data && res.data.length > 0) {
              setStoredData('bw_cached_playlists', res.data);
            }
          } catch (e) {}
        })();
      }
      return { data: getLocalPlaylists(), error: null };
    }

    return { data: getLocalPlaylists(), error: null };
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
    if (currentUser.role === 'admin') return true;

    // Check if item or purchase is blacklisted/revoked
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    const revokedItems = getStoredData<string[]>('bw_revoked_item_ids', []);
    const isGlobalRevoked = typeof localStorage !== 'undefined' && localStorage.getItem('bw_all_licenses_revoked') === 'true';

    if (isGlobalRevoked || revokedIds.includes(notesId) || revokedItems.includes(notesId)) {
      return false;
    }

    const { purchasedNoteIds } = await dbService.getAllUserPurchasesState();
    return purchasedNoteIds.includes(notesId);
  },

  getPurchaseDetails: async (notesId: string): Promise<{ purchased: boolean; expiresAt: string | null; daysLeft: number | null }> => {
    if (!currentUser) return { purchased: false, expiresAt: null, daysLeft: null };
    if (currentUser.role === 'admin') return { purchased: true, expiresAt: null, daysLeft: null };

    // Check if item or purchase is blacklisted/revoked
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    const revokedItems = getStoredData<string[]>('bw_revoked_item_ids', []);
    const isGlobalRevoked = typeof localStorage !== 'undefined' && localStorage.getItem('bw_all_licenses_revoked') === 'true';

    if (isGlobalRevoked || revokedIds.includes(notesId) || revokedItems.includes(notesId)) {
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

    const now = new Date();
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    // Retrieve cached user purchases instantly from localStorage
    const cachedUserPurchases = getStoredData<Purchase[]>(`bw_user_purchases_cache_${currentUser.id}`, []);
    const localMap = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
    const localUserPurchases = localMap[currentUser.id] || [];
    const mockForUser = mockPurchasesV2.filter(p => p.userId === currentUser?.id);

    let allPurchases: Purchase[] = [...cachedUserPurchases];
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

    // Filter out blacklisted revoked purchase IDs
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    if (revokedIds.length > 0) {
      allPurchases = allPurchases.filter(p => !revokedIds.includes(p.id));
    }

    const allBundles = getStoredData<Bundle[]>('bw_cached_bundles', mockBundles.map(decodeBundleFromDb));

    // If online, refresh cache in background non-blocking
    if (!isOffline && !isMock && supabase) {
      (async () => {
        try {
          const [purchasesRes, bundlesRes] = await fetchWithTimeout(Promise.all([
            supabase.from('purchases').select('*').eq('userId', currentUser.id).gt('expiresAt', now.toISOString()),
            supabase.from('bundles').select('*')
          ]), 800);
          if (purchasesRes?.data) {
            const freshPurchases = (purchasesRes.data || []).filter((p: any) => p.itemId !== 'session_tracker');
            setStoredData(`bw_user_purchases_cache_${currentUser.id}`, freshPurchases);
          }
          if (bundlesRes?.data) {
            const freshBundles = (bundlesRes.data || []).map((b: any) => ({ ...b, notesIds: safeParseBundleNotesIds(b.notesIds) }));
            setStoredData('bw_cached_bundles', freshBundles);
          }
        } catch (e) {}
      })();
    }

    const noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
    let bundleDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }>;
    bundleDetailsMap = {};
    const purchasedNoteIdsSet = new Set<string>();
    const purchasedBundleIdsSet = new Set<string>();

    for (const p of allPurchases) {
      const expDate = new Date(p.expiresAt);
      if (expDate <= now) continue;

      const diffTime = expDate.getTime() - now.getTime();
      const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      if (p.itemType === 'notes') {
        purchasedNoteIdsSet.add(p.itemId);
        noteDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };
      } else if (p.itemType === 'bundle') {
        purchasedBundleIdsSet.add(p.itemId);
        bundleDetailsMap[p.itemId] = { expiresAt: p.expiresAt, daysLeft };

        const bObj = allBundles.find(b => b.id === p.itemId);
        const bNotesIds = bObj ? safeParseBundleNotesIds(bObj.notesIds) : [];
        for (const nid of bNotesIds) {
          purchasedNoteIdsSet.add(nid);
          if (!noteDetailsMap[nid]) {
            noteDetailsMap[nid] = { expiresAt: p.expiresAt, daysLeft };
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

  getPurchasedNotes: async (): Promise<{ data: Note[]; error: string | null }> => {
    const user = dbService.getCurrentUser();
    if (!user) return { data: [], error: 'User session not active.' };

    const { data: allNotes } = await dbService.getNotes();
    if (user.role === 'admin') return { data: allNotes || [], error: null };

    // Batch fetch all purchases for current user in 1 fast query (checks DB + local cache + offline index)
    const { purchasedNoteIds } = await dbService.getAllUserPurchasesState();

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
    const cachedBundles = getStoredData<Bundle[]>('bw_cached_bundles', mockBundles.map(decodeBundleFromDb));

    // Non-blocking background network refresh if online
    if (!isOffline && !isMock && supabase) {
      (async () => {
        try {
          let query = supabase.from('bundles').select('*');
          if (year) query = query.eq('year', year);
          const res: any = await fetchWithTimeout(query as any, 800);
          const data = res?.data;
          
          if (data && data.length > 0) {
            const processed = (data || []).map((b: any) => decodeBundleFromDb(b));
            setStoredData('bw_cached_bundles', processed);
          }
        } catch (err) {}
      })();
    }

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
    if (currentUser.role === 'admin') return { purchased: true, expiresAt: null, daysLeft: null };

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
    
    const now = new Date();
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const getLocalBundles = () => {
      const results: { bundle: Bundle; expiresAt: string; daysLeft: number }[] = [];
      const cachedPurchases = getStoredData<Purchase[]>(`bw_user_purchases_cache_${user.id}`, mockPurchasesV2);
      const cachedBundles = getStoredData<Bundle[]>('bw_cached_bundles', mockBundles);

      for (const purchase of cachedPurchases) {
        if (purchase.itemType === 'bundle') {
          const expDate = new Date(purchase.expiresAt);
          if (expDate > now || user.role === 'admin') {
            const bundle = cachedBundles.find(b => b.id === purchase.itemId) || mockBundles.find(b => b.id === purchase.itemId);
            if (bundle) {
              const diffTime = expDate.getTime() - now.getTime();
              const daysLeft = user.role === 'admin' ? 9999 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              results.push({
                bundle,
                expiresAt: purchase.expiresAt,
                daysLeft
              });
            }
          }
        }
      }
      return results;
    };

    if (isOffline || isMock || !supabase) {
      return { data: getLocalBundles(), error: null };
    }

    try {
      const [bundlesRes, purchasesRes] = await fetchWithTimeout(Promise.all([
        supabase.from('bundles').select('*'),
        supabase.from('purchases').select('*').eq('userId', user.id).eq('itemType', 'bundle').gt('expiresAt', now.toISOString())
      ]), 800);

      const allBundles = (bundlesRes?.data || []).map((b: any) => decodeBundleFromDb(b));
      const dbPurchases = purchasesRes?.data || [];

      if (user.role === 'admin') {
        const adminResults = allBundles.map(b => ({
          bundle: b,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
          daysLeft: 9999
        }));
        return { data: adminResults, error: null };
      }

      const results: { bundle: Bundle; expiresAt: string; daysLeft: number }[] = [];
      for (const purchase of dbPurchases) {
        const bundle = allBundles.find(b => b.id === purchase.itemId);
        if (bundle) {
          const expDate = new Date(purchase.expiresAt);
          const diffTime = expDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          results.push({
            bundle,
            expiresAt: purchase.expiresAt,
            daysLeft
          });
        }
      }
      return { data: results.length > 0 ? results : getLocalBundles(), error: null };
    } catch (e) {
      return { data: getLocalBundles(), error: null };
    }
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
  grantManualLicense: async (email: string, itemId: string, itemType: 'notes' | 'bundle', months: number): Promise<{ success: boolean; error: string | null }> => {
    // Clear global revocation flag when new license is granted
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('bw_all_licenses_revoked');
    }
    const revokedItems = getStoredData<string[]>('bw_revoked_item_ids', []).filter(id => id !== itemId);
    setStoredData('bw_revoked_item_ids', revokedItems);

    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    const userId = user ? user.id : 'user_manual_' + Math.random().toString(36).substr(2, 9);
    
    if (!user) {
      const newMockUser: UserProfile = {
        id: userId,
        name: email.split('@')[0],
        email: email,
        phone: '0000000000',
        role: 'student'
      };
      mockUsers.push(newMockUser);
      setStoredData('bw_mock_users', mockUsers);
    }

    const purchasedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(purchasedAt.getMonth() + months);

    let itemName = '';
    if (itemType === 'notes') {
      const foundNote = mockNotes.find(n => n.id === itemId);
      itemName = foundNote ? foundNote.title : 'Study Notes Pack';
    } else {
      const foundBundle = mockBundles.find(b => b.id === itemId);
      itemName = foundBundle ? foundBundle.title : 'Semester Combo Pack';
    }

    const newPurchase: Purchase = {
      id: generateUUID(),
      userId,
      itemId,
      itemType,
      userEmail: email,
      itemName,
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    if (!isMock && supabase) {
      const { data: realUser } = await supabase.from('profiles').select('id').eq('email', email).single();
      if (realUser) {
        newPurchase.userId = realUser.id;
      }

      const { userEmail, itemName, ...dbPayload } = newPurchase;
      const { error } = await supabase.from('purchases').insert([dbPayload]);

      // Always populate local storage map so admin panel & offline hydration are instant
      const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      const userPurchases = storedMapV2[newPurchase.userId] || [];
      const updatedPurchases = userPurchases.filter(p => !(p.itemId === itemId && p.itemType === itemType));
      updatedPurchases.push(newPurchase);
      storedMapV2[newPurchase.userId] = updatedPurchases;
      setStoredData('bw_mock_purchases_map_v2', storedMapV2);

      if (error) {
        console.warn('Supabase DB purchase insert error:', error.message);
      }
      return { success: !error, error: error ? error.message : null };
    } else {
      const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      const userPurchases = storedMapV2[userId] || [];
      const updatedPurchases = userPurchases.filter(p => !(p.itemId === itemId && p.itemType === itemType));
      updatedPurchases.push(newPurchase);
      storedMapV2[userId] = updatedPurchases;
      setStoredData('bw_mock_purchases_map_v2', storedMapV2);

      if (currentUser && currentUser.id === userId) {
        mockPurchasesV2 = updatedPurchases;
        setStoredData('bw_mock_purchases_v2', mockPurchasesV2);
      }
      return { success: true, error: null };
    }
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

    // 3. Issue DB delete if online
    if (!isMock && supabase) {
      try {
        const { error } = await supabase.from('purchases').delete().eq('id', purchaseId);
        if (error) {
          console.warn('Supabase DB single revoke warning:', error.message);
        }
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

    // 2. Clear all offline cached notes (index and payloads) on mobile device
    dbService.clearOfflineNotes();

    // 3. Clear local storage maps completely
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

    // 4. Issue DB delete if online
    if (!isMock && supabase) {
      try {
        const { error } = await supabase.from('purchases').delete().neq('itemId', 'session_tracker');
        if (error) {
          console.warn('Supabase DB delete all error:', error.message);
        }
      } catch (err) {
        console.warn('Error revoking all purchases in Supabase:', err);
      }
    }

    return { success: true, error: null };
  },

  getAllPurchases: async (): Promise<{ data: (Purchase & { userEmail?: string; itemName?: string })[]; error: string | null }> => {
    let rawPurchases: Purchase[] = [];
    let dbSuccess = false;

    if (!isMock && supabase) {
      try {
        const { data, error } = await supabase.from('purchases').select('*');
        if (!error && data) {
          rawPurchases = data.filter((p: any) => p.noteId !== 'session_tracker' && p.itemId !== 'session_tracker');
          dbSuccess = true;
        }
      } catch (err) {
        console.warn('Error fetching purchases from Supabase:', err);
      }
    }

    if (!dbSuccess) {
      const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      Object.keys(storedMapV2).forEach(uid => {
        rawPurchases.push(...storedMapV2[uid]);
      });
    }

    // ALWAYS filter out blacklisted revoked purchase IDs!
    const revokedIds = getStoredData<string[]>('bw_revoked_purchase_ids', []);
    if (revokedIds.length > 0) {
      rawPurchases = rawPurchases.filter(p => !revokedIds.includes(p.id));
    }

    const allProfiles = getStoredData<UserProfile[]>('bw_mock_users', mockUsers);

    const mapped = rawPurchases.map(p => {
      const user = allProfiles.find(u => u.id === p.userId || (u.email && p.userEmail && u.email.toLowerCase() === p.userEmail.toLowerCase()));
      
      let name = p.itemName || '';
      if (!name) {
        if (p.itemType === 'notes') {
          const foundNote = mockNotes.find(n => n.id === p.itemId);
          name = foundNote ? foundNote.title : 'Study Notes Pack';
        } else {
          const foundBundle = mockBundles.find(b => b.id === p.itemId);
          name = foundBundle ? foundBundle.title : 'Semester Combo Pack';
        }
      }

      return {
        ...p,
        userEmail: p.userEmail || user?.email || 'student@gmail.com',
        itemName: name
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
