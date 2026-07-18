import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables with hardcoded fallbacks for native Android/iOS APK builds
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zczomcghyktsaimwhwxp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_T_NLVZYhGMxVuELQNEgtGQ_zBgeBMHl';

// Determine if we should use mock database
export const isMock = !supabaseUrl || !supabaseAnonKey;

// Initialize Supabase client if keys are present
export const supabase = !isMock ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  semester: number;
  notesIds: string[]; // IDs of notes included in this bundle
}

export interface Purchase {
  id: string;
  userId: string;
  itemId: string; // notesId or bundleId
  itemType: 'notes' | 'bundle';
  purchasedAt: string;
  expiresAt: string;
}

export const INITIAL_NOTES: Note[] = [];
export const INITIAL_PLAYLISTS: Playlist[] = [];
export const INITIAL_BUNDLES: Bundle[] = [];

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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
}

// Global Auth & DB state in Mock Mode
let mockUsers = getStoredData<UserProfile[]>('bw_mock_users', []);
let mockPurchasesV2 = getStoredData<Purchase[]>('bw_mock_purchases_v2', []);
let mockBundles = getStoredData<Bundle[]>('bw_mock_bundles', INITIAL_BUNDLES);
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
        return { data: profile, error: null };
      }
      return { data: null, error: 'Login failed. Invalid credentials.' };
    } else {
      // Mock Login
      // For testing purposes, we automatically login if name/email matches. In real development, we just check email
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        // If it's a first time login and it's the admin email, auto-create the admin!
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
          return { data: adminUser, error: null };
        }
        return { data: null, error: 'User not registered. Please register first.' };
      }
      currentUser = user;
      setStoredData('bw_mock_current_user', currentUser);
      
      // Load user purchases
      const storedPurchasesV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      mockPurchasesV2 = storedPurchasesV2[user.id] || [];
      setStoredData('bw_mock_purchases_v2', mockPurchasesV2);
      
      return { data: user, error: null };
    }
  },

  signOut: async (): Promise<{ error: string | null }> => {
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

  getCurrentUser: (): UserProfile | null => {
    return currentUser;
  },

  // --- NOTES SERVICE ---
  getNotes: async (year?: string): Promise<{ data: Note[]; error: string | null }> => {
    if (!isMock && supabase) {
      let query = supabase.from('notes').select('*');
      if (year) query = query.eq('year', year);
      const { data, error } = await query;
      return { data: data || [], error: error ? error.message : null };
    } else {
      const notes = year ? mockNotes.filter(n => n.year === year) : mockNotes;
      return { data: notes, error: null };
    }
  },

  getNoteById: async (id: string): Promise<{ data: Note | null; error: string | null }> => {
    if (!isMock && supabase) {
      const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
      return { data, error: error ? error.message : null };
    } else {
      const note = mockNotes.find(n => n.id === id) || null;
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
            if (bundle && bundle.notesIds.includes(notesId)) {
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

  purchaseNotes: async (notesId: string): Promise<{ success: boolean; error: string | null }> => {
    if (!currentUser) return { success: false, error: 'You must be logged in to buy notes.' };
    
    const purchasedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(purchasedAt.getMonth() + 6); // Exactly 6-month validity

    if (!isMock && supabase) {
      const { error } = await supabase.from('purchases').insert([{
        userId: currentUser.id,
        itemId: notesId,
        itemType: 'notes',
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      }]);
      return { success: !error, error: error ? error.message : null };
    } else {
      const newPurchase: Purchase = {
        id: 'purch_' + Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        itemId: notesId,
        itemType: 'notes',
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      };

      mockPurchasesV2 = mockPurchasesV2.filter(p => !(p.itemId === notesId && p.itemType === 'notes'));
      mockPurchasesV2.push(newPurchase);
      setStoredData('bw_mock_purchases_v2', mockPurchasesV2);

      const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      storedMapV2[currentUser.id] = mockPurchasesV2;
      setStoredData('bw_mock_purchases_map_v2', storedMapV2);

      return { success: true, error: null };
    }
  },

  getPurchasedNotes: async (): Promise<{ data: Note[]; error: string | null }> => {
    if (!currentUser) return { data: [], error: 'User session not active.' };

    if (!isMock && supabase) {
      const { data: allNotes, error: notesError } = await supabase.from('notes').select('*');
      if (notesError) return { data: [], error: notesError.message };
      if (currentUser.role === 'admin') return { data: allNotes || [], error: null };

      const purchasedList: Note[] = [];
      if (allNotes) {
        for (const note of allNotes) {
          const active = await dbService.isNotesPurchased(note.id);
          if (active) {
            purchasedList.push(note);
          }
        }
      }
      return { data: purchasedList, error: null };
    } else {
      if (currentUser.role === 'admin') return { data: mockNotes, error: null };

      const purchasedList: Note[] = [];
      for (const note of mockNotes) {
        const active = await dbService.isNotesPurchased(note.id);
        if (active) {
          purchasedList.push(note);
        }
      }
      return { data: purchasedList, error: null };
    }
  },

  // --- BUNDLES SERVICE ---
  getBundles: async (year?: string): Promise<{ data: Bundle[]; error: string | null }> => {
    if (!isMock && supabase) {
      let query = supabase.from('bundles').select('*');
      if (year) query = query.eq('year', year);
      const { data, error } = await query;
      return { data: data || [], error: error ? error.message : null };
    } else {
      const bundles = year ? mockBundles.filter(b => b.year === year) : mockBundles;
      return { data: bundles, error: null };
    }
  },

  addBundle: async (bundle: Omit<Bundle, 'id'>): Promise<{ data: Bundle | null; error: string | null }> => {
    const newBundle = { ...bundle, id: 'bundle_' + Math.random().toString(36).substr(2, 9) };
    if (!isMock && supabase) {
      const { data, error } = await supabase.from('bundles').insert([newBundle]).select().single();
      return { data, error: error ? error.message : null };
    } else {
      mockBundles.unshift(newBundle);
      setStoredData('bw_mock_bundles', mockBundles);
      return { data: newBundle, error: null };
    }
  },

  purchaseBundle: async (bundleId: string): Promise<{ success: boolean; error: string | null }> => {
    if (!currentUser) return { success: false, error: 'You must be logged in to buy bundles.' };

    const purchasedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(purchasedAt.getMonth() + 6); // 6-month validity

    if (!isMock && supabase) {
      const { error } = await supabase.from('purchases').insert([{
        userId: currentUser.id,
        itemId: bundleId,
        itemType: 'bundle',
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      }]);
      return { success: !error, error: error ? error.message : null };
    } else {
      const newPurchase: Purchase = {
        id: 'purch_' + Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        itemId: bundleId,
        itemType: 'bundle',
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      };

      mockPurchasesV2 = mockPurchasesV2.filter(p => !(p.itemId === bundleId && p.itemType === 'bundle'));
      mockPurchasesV2.push(newPurchase);
      setStoredData('bw_mock_purchases_v2', mockPurchasesV2);

      const storedMapV2 = getStoredData<Record<string, Purchase[]>>('bw_mock_purchases_map_v2', {});
      storedMapV2[currentUser.id] = mockPurchasesV2;
      setStoredData('bw_mock_purchases_map_v2', storedMapV2);

      return { success: true, error: null };
    }
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
    if (!isMock && supabase) {
      const { error } = await supabase.from('bundles').update(bundle).eq('id', id);
      return { success: !error, error: error ? error.message : null };
    } else {
      mockBundles = mockBundles.map(b => b.id === id ? { ...b, ...bundle } : b);
      setStoredData('bw_mock_bundles', mockBundles);
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
      id: 'purch_' + Math.random().toString(36).substr(2, 9),
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
      return { data: data || [], error: null };
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
