// Secure IndexedDB-backed Offline Storage for Bitwise Learning
// Enables 100% offline access to purchased study notes and binary PDF documents.

import { isNativeApp } from './vpsApi';

const DB_NAME = 'bitwise_offline_db';
const DB_VERSION = 1;
const STORE_PDFS = 'pdf_blobs';
const STORE_META = 'offline_meta';

export interface OfflinePdfMeta {
  noteId: string;
  title: string;
  size: number;
  savedAt: number;
}

let dbInstance: IDBDatabase | null = null;

// Initialize and upgrade IndexedDB schema
export const initOfflineDb = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this platform.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_PDFS)) {
        db.createObjectStore(STORE_PDFS, { keyPath: 'noteId' });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event: Event) => {
      console.warn('Failed to open IndexedDB for offline storage:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Save a binary PDF document ArrayBuffer into IndexedDB
export const saveOfflinePdf = async (
  noteId: string,
  data: ArrayBuffer,
  title: string = 'Study Notes'
): Promise<boolean> => {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_PDFS);

      const record = {
        noteId,
        data,
        title,
        size: data.byteLength,
        savedAt: Date.now()
      };

      const req = store.put(record);

      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bw_offline_storage_changed', { detail: { noteId, action: 'save' } }));
        }
        resolve(true);
      };

      req.onerror = () => {
        console.error(`Failed to save offline PDF for note ${noteId}:`, req.error);
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Error saving PDF to IndexedDB:', err);
    return false;
  }
};

// Retrieve a binary PDF document ArrayBuffer from IndexedDB
export const getOfflinePdf = async (noteId: string): Promise<ArrayBuffer | null> => {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PDFS, 'readonly');
      const store = tx.objectStore(STORE_PDFS);
      const req = store.get(noteId);

      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as ArrayBuffer);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => {
        console.warn(`Could not read offline PDF for note ${noteId}:`, req.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
    return null;
  }
};

// Check if a PDF is saved offline
export const isPdfSavedOffline = async (noteId: string): Promise<boolean> => {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PDFS, 'readonly');
      const store = tx.objectStore(STORE_PDFS);
      const req = store.count(noteId);

      req.onsuccess = () => {
        resolve(req.result > 0);
      };

      req.onerror = () => {
        resolve(false);
      };
    });
  } catch {
    return false;
  }
};

// Delete an offline PDF copy
export const deleteOfflinePdf = async (noteId: string): Promise<boolean> => {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_PDFS);
      const req = store.delete(noteId);

      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bw_offline_storage_changed', { detail: { noteId, action: 'delete' } }));
        }
        resolve(true);
      };

      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Error deleting offline PDF:', err);
    return false;
  }
};

// Get list of all offline note IDs
export const getAllOfflinePdfIds = async (): Promise<string[]> => {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PDFS, 'readonly');
      const store = tx.objectStore(STORE_PDFS);
      const req = store.getAllKeys();

      req.onsuccess = () => {
        resolve((req.result as string[]) || []);
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
};

// Get metadata for all offline PDFs (without loading the full binary ArrayBuffers)
export const getAllOfflinePdfsMetadata = async (): Promise<OfflinePdfMeta[]> => {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PDFS, 'readonly');
      const store = tx.objectStore(STORE_PDFS);
      const req = store.openCursor();
      const list: OfflinePdfMeta[] = [];

      req.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          const val = cursor.value;
          list.push({
            noteId: val.noteId,
            title: val.title || 'Study Notes',
            size: val.size || 0,
            savedAt: val.savedAt || 0
          });
          cursor.continue();
        } else {
          resolve(list);
        }
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
};

// Get total size of all offline downloaded files (in bytes)
export const getTotalOfflineStorageSize = async (): Promise<number> => {
  try {
    const list = await getAllOfflinePdfsMetadata();
    return list.reduce((acc, curr) => acc + (curr.size || 0), 0);
  } catch {
    return 0;
  }
};

// Format bytes into human-readable string (e.g. "14.2 MB")
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// Clear all offline stored PDFs
export const clearAllOfflinePdfs = async (): Promise<boolean> => {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_PDFS);
      const req = store.clear();

      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bw_offline_storage_changed', { detail: { action: 'clear' } }));
        }
        resolve(true);
      };

      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
};

// ─── LocalStorage Caching Helpers for Offline Metadata ──────────────────────

export const saveOfflinePurchases = (userId: string, data: any): void => {
  if (typeof localStorage === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`bw_offline_purchases_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache offline purchases:', e);
  }
};

export const getOfflinePurchases = (userId: string): any | null => {
  if (typeof localStorage === 'undefined' || !userId) return null;
  try {
    const raw = localStorage.getItem(`bw_offline_purchases_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Download a note binary directly into offline IndexedDB storage
export const downloadNoteForOffline = async (
  note: { id: string; title: string; previewUrl?: string; pdfUrl?: string },
  user?: { id?: string; email?: string } | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('bw_auth_token') || localStorage.getItem('bw_token') || '')
      : '';
    const userId = user?.id || '';
    const userEmail = user?.email || '';

    const toAbsolute = (u: string) => {
      if (!u || typeof u !== 'string') return '';
      if (u.startsWith('blob:') || u.startsWith('data:') || u.startsWith('http://') || u.startsWith('https://')) return u;
      const cleanPath = u.startsWith('/') ? u : `/${u}`;
      return isNativeApp ? `https://bitwiselearning.online${cleanPath}` : cleanPath;
    };

    const candidateUrls: string[] = [];
    if (note.previewUrl) candidateUrls.push(toAbsolute(note.previewUrl));
    if (note.pdfUrl) candidateUrls.push(toAbsolute(note.pdfUrl));
    if (note.id) {
      const streamUrl = toAbsolute(`/api/notes/${encodeURIComponent(note.id)}/pdf`);
      if (!candidateUrls.includes(streamUrl)) {
        candidateUrls.push(streamUrl);
      }
    }

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['x-user-id'] = userId;
    if (userEmail) headers['x-user-email'] = userEmail;

    let arrayBuffer: ArrayBuffer | null = null;
    let lastErr = 'Could not download note';

    for (const url of candidateUrls) {
      try {
        const params = new URLSearchParams();
        if (token) params.set('token', token);
        if (userId) params.set('userId', userId);
        if (userEmail) params.set('email', userEmail);
        const qs = params.toString();
        const sep = url.includes('?') ? '&' : '?';
        const fetchUrl = (url.includes('/api/') && qs) ? `${url}${sep}${qs}` : url;

        const res = await fetch(fetchUrl, {
          headers,
          credentials: 'omit'
        });

        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf && buf.byteLength > 100) {
            arrayBuffer = buf;
            break;
          }
        } else {
          lastErr = `Server returned ${res.status}`;
        }
      } catch (e: any) {
        lastErr = e?.message || 'Network request failed';
      }
    }

    if (!arrayBuffer) {
      return { success: false, error: lastErr };
    }

    const saved = await saveOfflinePdf(note.id, arrayBuffer, note.title);
    return { success: saved, error: saved ? undefined : 'Failed to save to local device storage' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
};
