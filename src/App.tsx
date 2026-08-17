import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { MyLibrary } from './pages/MyLibrary';
import { Admin } from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { Policies } from './pages/Policies';
import { PDFViewer } from './components/PDFViewer';
import { applyThemePreference } from './lib/theme';
import { Profile } from './pages/Profile';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { dbService } from './lib/dbService';
import type { UserProfile, Note } from './lib/dbService';
import { BookOpen, Library, ShieldCheck, User, LogOut } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Dashboard states shared between Landing and Catalog
  const [selectedYear, setSelectedYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');

  // Reader states
  const [readingNote, setReadingNote] = useState<Note | null>(null);
  const [readingNoteUnlocked, setReadingNoteUnlocked] = useState(false);
  const [isAppMode, setIsAppMode] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [previousPage, setPreviousPage] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const childBackHandlerRef = useRef<(() => boolean) | null>(null);
  const historyStackRef = useRef<string[]>([]);

  // Refs so goBack and hashRouting always see fresh state (no stale closures)
  const backHandlerRef = useRef<() => boolean>(() => false);
  const currentPageRef = useRef(currentPage);
  const currentUserRef = useRef(currentUser);
  const readingNoteRef = useRef(readingNote);
  const isAppModeRef = useRef(isAppMode);
  const showExitModalRef = useRef(showExitModal);
  const showResetModalRef = useRef(showResetModal);

  // Keep all refs in sync every render
  useEffect(() => {
    currentPageRef.current = currentPage;
    currentUserRef.current = currentUser;
    readingNoteRef.current = readingNote;
    isAppModeRef.current = isAppMode;
    showExitModalRef.current = showExitModal;
    showResetModalRef.current = showResetModal;
  });

  // Network offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Hash Routing (uses refs → never stale) ───────────────────────────────
  const handleHashRouting = () => {
    const activeHash = window.location.hash.split('?')[0];
    const activeUser = currentUserRef.current || dbService.getCurrentUser();
    const isApp = isAppModeRef.current;

    // Close PDF viewer if hash no longer points to viewer
    if (activeHash !== '#viewer' && readingNoteRef.current !== null) {
      setReadingNote(null);
    }

    // Strict protection for App Mode: redirect to login if not authenticated
    if (isApp && !activeUser) {
      if (activeHash !== '#login' && activeHash !== '#admin-login' && activeHash !== '#admin') {
        window.location.hash = '#login';
        return;
      }
    }

    if (activeHash === '#reset-password' || window.location.href.includes('type=recovery') || window.location.hash.includes('access_token')) {
      setShowResetModal(true);
    }

    if (activeHash === '#admin') {
      if (activeUser?.role === 'admin') {
        setCurrentPage('admin');
      } else {
        window.location.hash = '#admin-login';
      }
    } else if (activeHash === '#admin-login') {
      if (activeUser?.role === 'admin') {
        window.location.hash = '#admin';
      } else {
        setCurrentPage('admin-login');
      }
    } else if (activeHash === '#login') {
      if (activeUser) {
        setCurrentPage('dashboard');
        window.location.hash = '#catalog';
      } else {
        setCurrentPage('auth');
      }
    } else if (activeHash === '#catalog') {
      setCurrentPage('dashboard');
    } else if (activeHash === '#library') {
      if (activeUser) {
        setCurrentPage('library');
      } else {
        setCurrentPage('auth');
        window.location.hash = '#login';
      }
    } else if (activeHash === '#profile') {
      if (activeUser) {
        setCurrentPage('profile');
      } else {
        setCurrentPage('auth');
        window.location.hash = '#login';
      }
    } else if (activeHash === '#policy-terms') {
      setCurrentPage('policy-terms');
    } else if (activeHash === '#policy-refund') {
      setCurrentPage('policy-refund');
    } else if (activeHash === '#policy-privacy') {
      setCurrentPage('policy-privacy');
    } else if (activeHash === '#policy-contact') {
      setCurrentPage('policy-contact');
    } else if (activeHash === '#home' || activeHash === '') {
      if (isApp) {
        setCurrentPage('dashboard');
        window.location.hash = '#catalog';
      } else {
        setCurrentPage('landing');
      }
    }
  };

  // ─── Centralized Stack-Based Back Navigation Handler ──────────────────────
  const goBack = (): boolean => {
    // 1. If Exit Modal is currently open, close modal
    if (showExitModalRef.current) {
      setShowExitModal(false);
      return true;
    }

    // 2. If Reset Password Modal is open, close modal
    if (showResetModalRef.current) {
      setShowResetModal(false);
      return true;
    }

    // 3. If PDF viewer is open, exit reader mode
    if (currentPageRef.current === 'viewer' || readingNoteRef.current !== null) {
      setReadingNote(null);
      if (window.history.length > 1) {
        window.history.back();
      }
      return true;
    }

    // 4. Check child component back handler (e.g. Dashboard sub-navigation)
    if (childBackHandlerRef.current && childBackHandlerRef.current()) {
      return true;
    }

    // 5. Native Browser & Android History Back
    const fullHash = window.location.hash;
    const baseHash = fullHash.split('?')[0];
    const isRootLocation =
      baseHash === '' ||
      baseHash === '#home' ||
      ((baseHash === '#catalog' || baseHash === '#library') && !fullHash.includes('?'));

    if (window.history.length > 1 && !isRootLocation) {
      window.history.back();
      return true;
    }

    // 6. Root location handling
    if (isRootLocation) {
      if (isAppModeRef.current) {
        setShowExitModal(true);
      } else if (window.history.length > 1) {
        window.history.back();
      }
      return true;
    }

    // 7. Fallback deep-link unwinding for #library
    if (fullHash.startsWith('#library')) {
      if (fullHash.includes('&subject=')) {
        const parentHash = fullHash.split('&subject=')[0];
        window.history.pushState(null, '', parentHash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else if (fullHash.includes('&pack=')) {
        const parentHash = fullHash.split('&pack=')[0];
        window.history.pushState(null, '', parentHash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else if (fullHash.includes('?cat=')) {
        window.history.pushState(null, '', '#library');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else {
        if (isAppModeRef.current) setShowExitModal(true);
      }
      return true;
    }

    // 8. Fallback deep-link unwinding for #catalog
    if (fullHash.startsWith('#catalog')) {
      if (fullHash.includes('&cat=')) {
        const parentHash = fullHash.split('&cat=')[0];
        window.history.pushState(null, '', parentHash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else if (fullHash.includes('&subject=')) {
        const parentHash = fullHash.split('&subject=')[0];
        window.history.pushState(null, '', parentHash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else if (fullHash.includes('&sem=')) {
        const parentHash = fullHash.split('&sem=')[0];
        window.history.pushState(null, '', parentHash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else if (fullHash.includes('?year=')) {
        window.history.pushState(null, '', '#catalog');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else {
        if (isAppModeRef.current) setShowExitModal(true);
      }
      return true;
    }

    if (isAppModeRef.current) {
      setShowExitModal(true);
    }
    return true;
  };

  // Keep backHandlerRef always in sync
  useEffect(() => {
    backHandlerRef.current = goBack;
  });

  // ─── ONE popstate listener — routes through goBack ref ───────────────────
  // NOTE: hashchange is separate and ONLY used for routing (not back nav).
  // This eliminates the double-fire bug where both listeners fired on back.
  useEffect(() => {
    const handlePopState = () => {
      backHandlerRef.current();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ─── hashchange → routing ONLY (no back nav overlap) ─────────────────────
  useEffect(() => {
    window.addEventListener('hashchange', handleHashRouting);
    return () => window.removeEventListener('hashchange', handleHashRouting);
  }, []); // handleHashRouting uses refs, no stale closure risk

  // ─── Hardware back button (Capacitor / Android) ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      try {
        const listener = await CapApp.addListener('backButton', () => {
          if (cancelled) return;
          const handled = backHandlerRef.current();
          if (!handled && (window as any).Capacitor) {
            setShowExitModal(true);
          }
        });
        if (!cancelled) return listener;
        listener.remove();
      } catch (_e) {}
      return null;
    };
    let listenerHandle: any = null;
    setup().then(h => { listenerHandle = h; });
    return () => {
      cancelled = true;
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, []);

  // ─── Session check & initial mount ───────────────────────────────────────
  useEffect(() => {
    // Cache buster
    const BUILD_VERSION = 'v2_2026_08_07';
    if (localStorage.getItem('bw_build_ver') !== BUILD_VERSION) {
      localStorage.setItem('bw_build_ver', BUILD_VERSION);
      localStorage.removeItem('bw_mock_bundles');
    }

    // Platform detection
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isNativeCapacitor =
      !!(window as any).Capacitor &&
      typeof (window as any).Capacitor.isNativePlatform === 'function' &&
      (window as any).Capacitor.isNativePlatform();
    const hasAppParam = searchParams.get('platform') === 'app' || hash.includes('platform=app');
    const isApp = isNativeCapacitor || hasAppParam;
    setIsAppMode(isApp);
    isAppModeRef.current = isApp;

    // Session re-hydration
    const syncCurrentSession = async () => {
      const activeUser = dbService.getCurrentUser();
      if (activeUser) {
        setCurrentUser(activeUser);
        currentUserRef.current = activeUser;
        const check = await dbService.verifyDeviceSession(activeUser.id);
        if (check.valid === false) {
          alert('🔒 LOGOUT NOTICE: Your account was logged in on another device. Only 1 active device is allowed per account.');
          await dbService.signOut();
          setCurrentUser(null);
          currentUserRef.current = null;
          setCurrentPage('auth');
          window.location.hash = '#login';
          return;
        }
      }
      if (isApp && !activeUser) {
        setCurrentPage('auth');
      }
    };
    syncCurrentSession();

    // ── Screenshot Protection ──────────────────────────────────────────────
    const triggerBlackout = (durationMs = 4000) => {
      setBlackout(true);
      setTimeout(() => setBlackout(false), durationMs);
    };

    // KeyDown: catch screenshot combos BEFORE the OS acts on them
    const handleKeyDown = (e: KeyboardEvent) => {
      // DevTools: F12, Ctrl/Cmd+Shift+I/J/C/K — block silently
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey &&
          ['i', 'I', 'j', 'J', 'c', 'C', 'k', 'K'].includes(e.key))
      ) {
        e.preventDefault();
      }

      // Screenshot / recording keyboard shortcuts (all OS variants)
      const isScreenshotKey =
        // All browsers — PrtSc key
        e.key === 'PrintScreen' ||
        e.key === 'Print' ||
        e.key === 'Snapshot' ||
        // Windows Snipping Tool: Win+Shift+S (metaKey = WinKey on Windows)
        (e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S')) ||
        // Windows Game Bar: Win+G, Win+Alt+PrtSc
        (e.metaKey && (e.key === 'g' || e.key === 'G')) ||
        (e.metaKey && e.altKey && e.key === 'PrintScreen') ||
        // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5, Cmd+Ctrl+Shift+3/4
        (e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(e.key)) ||
        (e.metaKey && e.ctrlKey && e.shiftKey && ['3', '4'].includes(e.key)) ||
        // Linux / other
        e.key === 'MediaRecord' ||
        // Ctrl+PrtSc (some browser combos)
        (e.ctrlKey && e.key === 'PrintScreen');

      if (isScreenshotKey) {
        e.preventDefault();
        triggerBlackout();
      }
    };

    // KeyUp: catch PrintScreen — fires AFTER OS captures (best effort)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.key === 'Print' || e.key === 'Snapshot') {
        triggerBlackout();
      }
    };

    // Visibility: blackout when tab/window goes to background
    // Catches: Alt+Tab, Win+PrtSc, task switcher, app switcher, Snipping Tool
    let visibilityTimer: ReturnType<typeof setTimeout> | null = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Immediate blackout — if user alt-tabbed to take screenshot,
        // page is already black when they come back / screencapture tool runs
        setBlackout(true);
        // Auto-remove blackout 5s after they return, to avoid being stuck black
        if (visibilityTimer) clearTimeout(visibilityTimer);
      } else {
        // Page became visible again — keep black for 2s then restore
        visibilityTimer = setTimeout(() => setBlackout(false), 2000);
      }
    };

    // Window blur: catches browser window losing focus
    const handleWindowBlur = () => {
      setBlackout(true);
    };
    const handleWindowFocus = () => {
      setTimeout(() => setBlackout(false), 1500);
    };

    // Block getDisplayMedia (screen sharing / OBS / recording in browser)
    const nav = navigator as any;
    const originalGetDisplayMedia = nav.mediaDevices?.getDisplayMedia?.bind(nav.mediaDevices);
    if (nav.mediaDevices && nav.mediaDevices.getDisplayMedia) {
      nav.mediaDevices.getDisplayMedia = () => {
        return Promise.reject(new DOMException('Screen capture is disabled on this platform.', 'NotAllowedError'));
      };
    }

    // Right-click blocker
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Initial hash routing on mount
    handleHashRouting();

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('contextmenu', preventRightClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      window.removeEventListener('keyup', handleKeyUp, { capture: true } as any);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('contextmenu', preventRightClick);
      // Restore original getDisplayMedia
      if (nav.mediaDevices && originalGetDisplayMedia) {
        nav.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
      if (visibilityTimer) clearTimeout(visibilityTimer);
    };
  }, []);

  // ─── Single Device Session Enforcement (ONE interval, not two) ────────────
  useEffect(() => {
    if (!currentUser) return;

    let isTerminated = false;

    const checkSingleDeviceSession = async () => {
      if (isTerminated) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const { valid } = await dbService.verifyDeviceSession(currentUser.id);
      if (!valid) {
        isTerminated = true;
        await dbService.signOut();
        setCurrentUser(null);
        currentUserRef.current = null;
        setCurrentPage('auth');
        window.location.hash = '#login';
        alert('⚠️ Session Terminated: Your account was logged in on another device. Only 1 active device is allowed at a time.');
      }
    };

    checkSingleDeviceSession();
    const interval = setInterval(checkSingleDeviceSession, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // ─── Auto-sync purchases ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const syncPurchases = async () => {
      try {
        await dbService.getAllUserPurchasesState();
      } catch (e) {}
    };

    syncPurchases();
    const interval = setInterval(syncPurchases, 10000);
    window.addEventListener('focus', syncPurchases);
    window.addEventListener('bw_purchases_updated', syncPurchases);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncPurchases);
      window.removeEventListener('bw_purchases_updated', syncPurchases);
    };
  }, [currentUser]);

  const [tabSlideDir, setTabSlideDir] = useState<'right' | 'left'>('right');

  const getTabRank = (page: string) => {
    if (page === 'dashboard' || page === 'landing') return 0;
    if (page === 'library') return 1;
    if (page === 'profile' || page === 'auth') return 2;
    if (page === 'admin') return 3;
    return 0;
  };

  const navigate = (page: string, isBackNav: boolean = false) => {
    if (page === currentPageRef.current && !isBackNav) return;

    if (!isBackNav) {
      const stack = historyStackRef.current;
      if (stack.length === 0 || stack[stack.length - 1] !== currentPageRef.current) {
        stack.push(currentPageRef.current);
      }
      if (stack.length > 50) stack.shift();
    }

    const currentRank = getTabRank(currentPageRef.current);
    const nextRank = getTabRank(page);
    if (isBackNav || nextRank < currentRank) {
      setTabSlideDir('left');
    } else {
      setTabSlideDir('right');
    }
    setPreviousPage(currentPageRef.current);
    setCurrentPage(page);

    const targetHash =
      page === 'landing' ? '#home'
      : page === 'dashboard' ? '#catalog'
      : page === 'auth' ? '#login'
      : page === 'admin-login' ? '#admin-login'
      : page === 'admin' ? '#admin'
      : page === 'library' ? '#library'
      : page === 'profile' ? '#profile'
      : `#${page}`;

    if (page === 'dashboard' && window.location.hash.startsWith('#catalog?')) {
      // Preserve subject query params when navigating to subject portal
    } else if (window.location.hash !== targetHash) {
      window.history.pushState({ page }, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    currentUserRef.current = user;
    if (user.role === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#catalog';
    }
  };

  const handleLogout = async () => {
    await dbService.signOut();
    setCurrentUser(null);
    currentUserRef.current = null;
    setCurrentPage('dashboard');
    window.location.hash = '#catalog';
  };

  const handleReadNote = async (note: Note) => {
    setPreviousPage(currentPageRef.current);

    const isAccessGranted = await dbService.checkNoteAccess(note.id);
    const unlocked = isAccessGranted || note.price === 0;

    setReadingNote(note);
    setReadingNoteUnlocked(unlocked);
    setCurrentPage('viewer');

    if (window.location.hash !== '#viewer') {
      window.history.pushState({ viewer: true }, '', '#viewer');
    }

    dbService.getNoteById(note.id).then(({ data: fullNote }) => {
      if (fullNote && fullNote.previewUrl) {
        setReadingNote(fullNote);
        if (unlocked || note.price === 0) {
          dbService.saveNoteForOffline(fullNote);
        }
      }
    });
  };

  const handleUnlockInViewer = async () => {
    if (!readingNote || !currentUserRef.current) {
      window.location.hash = '#login';
      return;
    }
    const { success } = await dbService.purchaseNotes(readingNote.id);
    if (success) {
      setReadingNoteUnlocked(true);
    }
  };

  useEffect(() => {
    if (isAppMode) {
      document.body.classList.add('app-mode');
      applyThemePreference('dark');
    } else {
      document.body.classList.remove('app-mode');
    }
  }, [isAppMode]);

  const handlePolicyNav = (type: 'terms' | 'refund' | 'privacy' | 'contact') => {
    navigate(`policy-${type}`);
  };

  return (
    <>
      {/* Offline Mode Banner */}
      {isAppMode && !isOnline && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000002,
          background: 'rgba(245, 158, 11, 0.95)',
          color: '#000',
          padding: '4px 16px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '700',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          <span>⚡ Offline Mode</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>Reading Saved Notes</span>
        </div>
      )}

      {blackout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000000',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2 style={{ color: 'var(--color-yellow)', marginBottom: '10px' }}>Security Protection Active</h2>
            <p style={{ color: 'var(--color-muted)' }}>Screenshots and recordings are strictly disabled to protect intellectual property.</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      {!isAppMode && currentPage !== 'viewer' && (
        <Navbar
          user={currentUser}
          onLogout={handleLogout}
          navigate={navigate}
          currentPage={currentPage}
          isAppMode={isAppMode}
        />
      )}

      {/* Main Pages */}
      <main style={{ flexGrow: 1 }}>
        <div
          key={currentPage}
          className={tabSlideDir === 'right' ? 'tab-transition-right' : 'tab-transition-left'}
        >
          {currentPage === 'landing' && (
            <LandingPage
              navigate={navigate}
              setSelectedYear={setSelectedYear}
            />
          )}

          {currentPage === 'dashboard' && (
            <Dashboard
              user={currentUser}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              onReadNote={handleReadNote}
              navigate={navigate}
              onRegisterBackHandler={(fn) => { childBackHandlerRef.current = fn; }}
            />
          )}

          {currentPage === 'auth' && (
            <Auth
              onLoginSuccess={handleLoginSuccess}
              navigate={navigate}
            />
          )}

          {currentPage === 'library' && (
            <MyLibrary
              user={currentUser}
              onReadNote={handleReadNote}
              navigate={navigate}
            />
          )}

          {currentPage === 'admin-login' && (
            <AdminLogin
              onLoginSuccess={handleLoginSuccess}
              navigate={navigate}
            />
          )}

          {currentPage === 'admin' && (
            <Admin
              user={currentUser}
              navigate={navigate}
            />
          )}

          {currentPage === 'profile' && (
            <Profile
              user={currentUser}
              onLogout={handleLogout}
              navigate={navigate}
              onBack={() => goBack()}
              isAppMode={isAppMode}
            />
          )}

          {currentPage === 'viewer' && readingNote && (
            <PDFViewer
              note={readingNote}
              isUnlocked={readingNoteUnlocked}
              onBack={() => goBack()}
              onUnlock={handleUnlockInViewer}
            />
          )}

          {currentPage.startsWith('policy-') && (
            <Policies
              policyType={currentPage.replace('policy-', '') as any}
              onBack={() => goBack()}
            />
          )}

          <ResetPasswordModal
            isOpen={showResetModal}
            onClose={() => {
              setShowResetModal(false);
              window.location.hash = '#catalog';
            }}
            onSuccess={() => {
              setShowResetModal(false);
              setCurrentPage('dashboard');
              window.location.hash = '#catalog';
            }}
          />
        </div>
      </main>

      {/* Footer */}
      {!isAppMode && currentPage !== 'viewer' && currentPage !== 'profile' && (
        <footer className="footer">
          <div className="container">
            <div className="footer-row">
              <div className="footer-brand">
                <div className="footer-logo">
                  <div className="logo-img-wrapper" style={{ width: '32px', height: '32px' }}>
                    <img src="/logo.jpg" alt="Bitwise Learning" className="logo-img" />
                  </div>
                  <span className="logo-text" style={{ fontSize: '16px' }}>
                    <span className="brand-bitwise">BITWISE</span>
                    <span className="brand-learning">LEARNING</span>
                  </span>
                </div>
                <p className="footer-desc">
                  Simplifying BTech syllabus examinations with concise, high-quality, hand-written study notes and video solutions.
                </p>
              </div>

              <div className="footer-links-group">
                <div className="footer-col">
                  <h4>Legal Info</h4>
                  <ul className="footer-links-list">
                    <li>
                      <button className="footer-link-item" onClick={() => handlePolicyNav('terms')}>
                        Terms &amp; Conditions
                      </button>
                    </li>
                    <li>
                      <button className="footer-link-item" onClick={() => handlePolicyNav('refund')}>
                        Refund &amp; Cancellation
                      </button>
                    </li>
                    <li>
                      <button className="footer-link-item" onClick={() => handlePolicyNav('privacy')}>
                        Privacy Policy
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4>Follow Channels</h4>
                  <div className="social-row">
                    <a
                      href="https://youtube.com/@bitwiselearning25"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-btn"
                      title="YouTube Channel"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                        <path d="m10 15 5-3-5-3z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <p>&copy; {new Date().getFullYear()} Bitwise Learning. All rights reserved. Created for BTech Learners.</p>
            </div>
          </div>
        </footer>
      )}

      {/* Bottom Nav (App Mode Only) */}
      {isAppMode && currentUser && currentPage !== 'viewer' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(7, 12, 27, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 9998,
          boxShadow: '0 -8px 24px rgba(0,0,0,0.5)'
        }}>
          <button
            onClick={() => navigate('dashboard')}
            style={{
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '4px',
              color: currentPage === 'dashboard' ? 'var(--color-yellow)' : 'var(--color-muted)',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer', flex: 1
            }}
          >
            <BookOpen size={20} />
            <span>Catalog</span>
          </button>

          {currentUser && (
            <button
              onClick={() => navigate('library')}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '4px',
                color: currentPage === 'library' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer', flex: 1
              }}
            >
              <Library size={20} />
              <span>Library</span>
            </button>
          )}

          {currentUser ? (
            <button
              onClick={() => navigate('profile')}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '4px',
                color: currentPage === 'profile' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer', flex: 1
              }}
            >
              <User size={20} />
              <span>Profile</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('auth')}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '4px',
                color: currentPage === 'auth' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer', flex: 1
              }}
            >
              <User size={20} />
              <span>Sign In</span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => navigate('admin')}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '4px',
                color: currentPage === 'admin' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer', flex: 1
              }}
            >
              <ShieldCheck size={20} />
              <span>Admin</span>
            </button>
          )}
        </div>
      )}

      {/* Exit App Confirmation Modal */}
      {showExitModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999999,
            background: 'rgba(5, 10, 25, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowExitModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(16, 24, 52, 0.95), rgba(10, 16, 38, 0.98))',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '24px 20px',
              width: '100%',
              maxWidth: '340px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
              animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#f59e0b'
            }}>
              <LogOut size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 8px' }}>
              Exit Bitwise Learning?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Are you sure you want to exit the app? Your reading progress is saved automatically.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowExitModal(false)}
                className="btn-secondary"
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                }}
              >
                Stay in App
              </button>

              <button
                onClick={() => {
                  setShowExitModal(false);
                  if ((window as any).Capacitor) {
                    CapApp.minimizeApp();
                  }
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff', border: 'none',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
