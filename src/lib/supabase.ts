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

export const decodeBundleFromDb = (b: Bundle): Bundle => {
  if (!b) return b;
  let subjects = b.subjects;
  let description = b.description || '';

  const match = description.match(/<!--SUBJECTS:(.*?)-->/s);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subjects = parsed;
      }
    } catch (e) {
      console.warn('Error parsing subjects from bundle description:', e);
    }
    description = description.replace(/\s*<!--SUBJECTS:.*?-->/s, '').trim();
  }

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
let mockBundles = getStoredData<Bundle[]>('bw_mock_bundles', INITIAL_BUNDLES).map(b => {
  const init = INITIAL_BUNDLES.find(ib => ib.id === b.id);
  if (init && init.subjects && (!b.subjects || b.subjects.length < init.subjects.length)) {
    return { ...b, subjects: init.subjects };
  }
  return b;
});
let currentUser = getStoredData<UserProfile | null>('bw_mock_current_user', null);
let mockNotes = getStoredData<Note[]>('bw_mock_notes', INITIAL_NOTES);
let mockPlaylists = getStoredData<Playlist[]>('bw_mock_playlists', INITIAL_PLAYLISTS);

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
    return currentUser;
  },

  // --- NOTES SERVICE ---
  getNotes: async (year?: string): Promise<{ data: Note[]; error: string | null }> => {
    if (!isMock && supabase) {
      let query = supabase.from('notes').select('id, title, subject, year, semester, price, originalPrice, description, pagesCount, type, topics');
      if (year) query = query.eq('year', year);
      const { data, error } = await query;
      return { data: (data as any) || [], error: error ? error.message : null };
    } else {
      const notes = year ? mockNotes.filter(n => n.year === year) : mockNotes;
      return { data: notes, error: null };
    }
  },

  // --- OFFLINE CACHING SERVICE (APP MODE ONLY) ---
  saveNoteForOffline: (note: Note) => {
    if (!note || !note.id) return;
    try {
      localStorage.setItem(`bw_offline_note_${note.id}`, JSON.stringify(note));
      const index = getStoredData<string[]>('bw_offline_notes_index', []);
      if (!index.includes(note.id)) {
        index.push(note.id);
        setStoredData('bw_offline_notes_index', index);
      }
    } catch (err) {
      console.warn('Could not save note for offline reading:', err);
    }
  },

  getOfflineNote: (noteId: string): Note | null => {
    try {
      const data = localStorage.getItem(`bw_offline_note_${noteId}`);
      if (data) return JSON.parse(data);
    } catch (err) {}
    return null;
  },

  getOfflineNotesIndex: (): string[] => {
    return getStoredData<string[]>('bw_offline_notes_index', []);
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
    if (!isMock && supabase) {
      let query = supabase.from('playlists').select('*');
      if (year) query = query.eq('year', year);
      const { data, error } = await query;
      return { data: data || [], error: error ? error.message : null };
    } else {
      const list = year ? mockPlaylists.filter(p => p.year === year) : mockPlaylists;
      return { data: list, error: null };
    }
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

  // --- PURCHASES (UNLOCKED STUDY MATERIAL WITH 6-MONTH VALIDITY) ---
  isNotesPurchased: async (notesId: string): Promise<boolean> => {
    const details = await dbService.getPurchaseDetails(notesId);
    return details.purchased;
  },

  getPurchaseDetails: async (notesId: string): Promise<{ purchased: boolean; expiresAt: string | null; daysLeft: number | null }> => {
    if (!currentUser) return { purchased: false, expiresAt: null, daysLeft: null };
    if (currentUser.role === 'admin') return { purchased: true, expiresAt: null, daysLeft: null };

    // Offline check: If device is offline and note is cached locally, report unlocked!
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineIndex = dbService.getOfflineNotesIndex();
      if (offlineIndex.includes(notesId) || dbService.getOfflineNote(notesId)) {
        return { purchased: true, expiresAt: '2099-01-01T00:00:00.000Z', daysLeft: 180 };
      }
    }

    const now = new Date();

    if (!isMock && supabase) {
      // 1. Check direct notes purchase
      const { data: directPurchase } = await supabase
        .from('purchases')
        .select('*')
        .eq('userId', currentUser.id)
        .eq('itemId', notesId)
        .eq('itemType', 'notes')
        .gt('expiresAt', now.toISOString())
        .maybeSingle();

      if (directPurchase) {
        const expDate = new Date(directPurchase.expiresAt);
        const diffTime = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { purchased: true, expiresAt: directPurchase.expiresAt, daysLeft };
      }

      // 2. Check if part of purchased semester combo bundle
      const { data: bundlePurchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('userId', currentUser.id)
        .eq('itemType', 'bundle')
        .gt('expiresAt', now.toISOString());

      if (bundlePurchases && bundlePurchases.length > 0) {
        const { data: dbBundles } = await supabase.from('bundles').select('*');
        if (dbBundles) {
          for (const bp of bundlePurchases) {
            const bundle = dbBundles.find(b => b.id === bp.itemId);
            const bundleNoteIds = bundle ? safeParseBundleNotesIds(bundle.notesIds) : [];
            if (bundle && bundleNoteIds.includes(notesId)) {
              const expDate = new Date(bp.expiresAt);
              const diffTime = expDate.getTime() - now.getTime();
              const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return { purchased: true, expiresAt: bp.expiresAt, daysLeft };
            }
          }
        }
      }
      return { purchased: false, expiresAt: null, daysLeft: null };
    } else {
      // Mock logic
      const direct = mockPurchasesV2.find(p => p.itemId === notesId && p.itemType === 'notes');
      if (direct) {
        const expDate = new Date(direct.expiresAt);
        if (expDate > now) {
          const diffTime = expDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { purchased: true, expiresAt: direct.expiresAt, daysLeft };
        }
      }

      const bundlePurchases = mockPurchasesV2.filter(p => p.itemType === 'bundle');
      for (const bp of bundlePurchases) {
        const expDate = new Date(bp.expiresAt);
        if (expDate > now) {
          const bundle = mockBundles.find(b => b.id === bp.itemId);
          if (bundle && bundle.notesIds.includes(notesId)) {
            const diffTime = expDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { purchased: true, expiresAt: bp.expiresAt, daysLeft };
          }
        }
      }

      return { purchased: false, expiresAt: null, daysLeft: null };
    }
  },

  // Batch purchase status fetcher to prevent N+1 query loading bottlenecks
  getAllUserPurchasesState: async (): Promise<{
    purchasedNoteIds: string[];
    purchasedBundleIds: string[];
    noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }>;
    bundleDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }>;
  }> => {
    if (!currentUser) {
      return { purchasedNoteIds: [], purchasedBundleIds: [], noteDetailsMap: {}, bundleDetailsMap: {} };
    }

    // Offline check: If device is offline, return cached offline note IDs!
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineIndex = dbService.getOfflineNotesIndex();
      const noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
      for (const nid of offlineIndex) {
        noteDetailsMap[nid] = { expiresAt: '2099-01-01T00:00:00.000Z', daysLeft: 180 };
      }
      return {
        purchasedNoteIds: offlineIndex,
        purchasedBundleIds: [],
        noteDetailsMap,
        bundleDetailsMap: {}
      };
    }

    const now = new Date();
    let allPurchases: Purchase[] = [];
    let allBundles: Bundle[] = [];

    if (!isMock && supabase) {
      try {
        const [purchasesRes, bundlesRes] = await Promise.all([
          supabase.from('purchases').select('*').eq('userId', currentUser.id).gt('expiresAt', now.toISOString()),
          supabase.from('bundles').select('*')
        ]);
        allPurchases = (purchasesRes.data || []).filter(p => p.itemId !== 'session_tracker');
        // Decode bundles so notesIds is always a proper array
        allBundles = (bundlesRes.data || []).map(b => ({ ...b, notesIds: safeParseBundleNotesIds(b.notesIds) }));
      } catch (err) {
        console.warn('Error fetching DB purchases in batch:', err);
        allPurchases = mockPurchasesV2.filter(p => p.userId === currentUser?.id);
        allBundles = mockBundles;
      }
    } else {
      allPurchases = mockPurchasesV2.filter(p => p.userId === currentUser?.id);
      allBundles = mockBundles;
    }

    // Combine local cached purchases
    const localMap = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
    const localUserPurchases = localMap[currentUser.id] || [];
    for (const lp of localUserPurchases) {
      if (!allPurchases.some(p => p.itemId === lp.itemId && p.itemType === lp.itemType)) {
        allPurchases.push(lp);
      }
    }

    const noteDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
    const bundleDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
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
        if (bObj && Array.isArray(bObj.notesIds)) {
          for (const nid of bObj.notesIds) {
            purchasedNoteIdsSet.add(nid);
            if (!noteDetailsMap[nid]) {
              noteDetailsMap[nid] = { expiresAt: p.expiresAt, daysLeft };
            }
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
        await supabase.from('purchases').insert([newPurchase]);
      } catch (e) {
        console.warn('Supabase DB purchase insert warning:', e);
      }
    }

    return { success: true, error: null };
  },

  getPurchasedNotes: async (): Promise<{ data: Note[]; error: string | null }> => {
    if (!currentUser) return { data: [], error: 'User session not active.' };

    const { data: allNotes, error: notesError } = await dbService.getNotes();
    if (notesError) return { data: [], error: notesError };
    if (currentUser.role === 'admin') return { data: allNotes || [], error: null };

    // Batch fetch all purchases for current user in 1 fast query to guarantee Website-to-App sync
    const { purchasedNoteIds } = await dbService.getAllUserPurchasesState();
    const purchasedList = (allNotes || []).filter(note => purchasedNoteIds.includes(note.id));
    return { data: purchasedList, error: null };
  },

  // --- BUNDLES SERVICE ---
  getBundles: async (year?: string): Promise<{ data: Bundle[]; error: string | null }> => {
    if (!isMock && supabase) {
      let query = supabase.from('bundles').select('*');
      if (year) query = query.eq('year', year);
      const { data, error } = await query;
      
      const processed = (data || []).map(b => {
        const decoded = decodeBundleFromDb(b);
        const cached = mockBundles.find(mb => mb.id === b.id);
        if (cached && cached.subjects && cached.subjects.length > 0) {
          return { ...decoded, subjects: cached.subjects };
        }
        return decoded;
      });

      return { data: processed, error: error ? error.message : null };
    } else {
      const bundles = year ? mockBundles.filter(b => b.year === year) : mockBundles;
      return { data: bundles.map(decodeBundleFromDb), error: null };
    }
  },

  addBundle: async (bundle: Omit<Bundle, 'id'>): Promise<{ data: Bundle | null; error: string | null }> => {
    const newBundle = { ...bundle, id: 'bundle_' + Math.random().toString(36).substring(2, 11) };
    
    mockBundles.unshift(newBundle);
    setStoredData('bw_mock_bundles', mockBundles);

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
        await supabase.from('purchases').insert([newPurchase]);
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
    if (!currentUser) return { data: [], error: 'User session not active.' };
    
    const now = new Date();

    if (!isMock && supabase) {
      const { data: allBundles, error: bundlesError } = await supabase.from('bundles').select('*');
      if (bundlesError) return { data: [], error: bundlesError.message };

      if (currentUser.role === 'admin') {
        const adminResults = (allBundles || []).map(b => ({
          bundle: b,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
          daysLeft: 9999
        }));
        return { data: adminResults, error: null };
      }

      const { data: dbPurchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('userId', currentUser.id)
        .eq('itemType', 'bundle')
        .gt('expiresAt', now.toISOString());

      if (purchasesError) return { data: [], error: purchasesError.message };

      const results: { bundle: Bundle; expiresAt: string; daysLeft: number }[] = [];
      if (dbPurchases && allBundles) {
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
      }
      return { data: results, error: null };
    } else {
      const results: { bundle: Bundle; expiresAt: string; daysLeft: number }[] = [];

      for (const purchase of mockPurchasesV2) {
        if (purchase.itemType === 'bundle') {
          const expDate = new Date(purchase.expiresAt);
          if (expDate > now || currentUser.role === 'admin') {
            const bundle = mockBundles.find(b => b.id === purchase.itemId);
            if (bundle) {
              const diffTime = expDate.getTime() - now.getTime();
              const daysLeft = currentUser.role === 'admin' ? 9999 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              results.push({
                bundle,
                expiresAt: purchase.expiresAt,
                daysLeft
              });
            }
          }
        }
      }
      return { data: results, error: null };
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
    if (!isMock && supabase) {
      const { error } = await supabase.from('bundles').delete().eq('id', id);
      return { success: !error, error: error ? error.message : null };
    } else {
      mockBundles = mockBundles.filter(b => b.id !== id);
      setStoredData('bw_mock_bundles', mockBundles);
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

    const newPurchase: Purchase = {
      id: generateUUID(),
      userId,
      itemId,
      itemType,
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    if (!isMock && supabase) {
      const { data: realUser } = await supabase.from('profiles').select('id').eq('email', email).single();
      if (realUser) {
        newPurchase.userId = realUser.id;
      }
      const { error } = await supabase.from('purchases').insert([newPurchase]);
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
    if (!isMock && supabase) {
      const { error } = await supabase.from('purchases').delete().eq('id', purchaseId);
      return { success: !error, error: error ? error.message : null };
    } else {
      const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      Object.keys(storedMapV2).forEach(uid => {
        storedMapV2[uid] = storedMapV2[uid].filter(p => p.id !== purchaseId);
      });
      setStoredData('bw_mock_purchases_map_v2', storedMapV2);

      if (currentUser) {
        mockPurchasesV2 = storedMapV2[currentUser.id] || [];
        setStoredData('bw_mock_purchases_v2', mockPurchasesV2);
      }
      return { success: true, error: null };
    }
  },

  getAllPurchases: async (): Promise<{ data: (Purchase & { userEmail?: string; itemName?: string })[]; error: string | null }> => {
    if (!isMock && supabase) {
      const { data, error } = await supabase.from('purchases').select('*');
      if (error) return { data: [], error: error.message };
      const filtered = (data || []).filter(p => p.noteId !== 'session_tracker' && p.itemId !== 'session_tracker');
      return { data: filtered, error: null };
    } else {
      const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      const allPurchs: Purchase[] = [];
      Object.keys(storedMapV2).forEach(uid => {
        allPurchs.push(...storedMapV2[uid]);
      });
      
      const mapped = allPurchs.map(p => {
        const user = mockUsers.find(u => u.id === p.userId);
        let name = '';
        if (p.itemType === 'notes') {
          name = mockNotes.find(n => n.id === p.itemId)?.title || 'Subject Notes';
        } else {
          name = mockBundles.find(b => b.id === p.itemId)?.title || 'Semester Combo';
        }
        return {
          ...p,
          userEmail: user?.email || 'offline_student@gmail.com',
          itemName: name
        };
      });
      return { data: mapped, error: null };
    }
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
    const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
    Object.keys(storedMapV2).forEach(uid => {
      storedMapV2[uid] = [];
    });
    setStoredData('bw_mock_purchases_map_v2', storedMapV2);
    return { success: true };
  }
};
