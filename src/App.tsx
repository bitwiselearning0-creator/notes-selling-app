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
import { Profile } from './pages/Profile';
import { dbService } from './lib/supabase';
import type { UserProfile, Note } from './lib/supabase';
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
  const childBackHandlerRef = useRef<(() => boolean) | null>(null);

  // Ref that always holds the LATEST back navigation handler (avoids stale closures)
  const backHandlerRef = useRef<() => boolean>(() => false);

  // Network offline listener for App Mode
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

  // Keep backHandlerRef always in sync with latest React state (no stale closures)
  useEffect(() => {
    backHandlerRef.current = () => {
      // 1. If Exit Modal is currently open, close modal
      if (showExitModal) {
        setShowExitModal(false);
        return true;
      }

      // 2. If PDF viewer is open, exit reader mode
      if (currentPage === 'viewer' || readingNote !== null) {
        setReadingNote(null);
        setCurrentPage(previousPage || 'dashboard');
        return true;
      }

      // 3. Check child component back handler (e.g. Dashboard subject/search/sem detail view)
      if (childBackHandlerRef.current && childBackHandlerRef.current()) {
        return true;
      }

      // 4. If on Library, Profile, Policies, or Admin tab, return to Dashboard Catalog Root
      if (currentPage === 'library' || currentPage === 'profile' || currentPage === 'admin' || currentPage.startsWith('policy-')) {
        setCurrentPage('dashboard');
        window.location.hash = '#catalog';
        return true;
      }

      // 5. If already at Dashboard Root — show Exit Confirmation Modal
      if (currentPage === 'dashboard' || currentPage === 'landing') {
        setShowExitModal(true);
        return true;
      }

      return false;
    };
  }, [currentPage, readingNote, previousPage, showExitModal]);

  // Hardware back button — registered ONCE, calls through ref (never stale)
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

        // Store cleanup
        if (!cancelled) {
          return listener;
        } else {
          listener.remove();
        }
      } catch (_e) {
        // Not in Capacitor environment
      }
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
  }, []); // Empty deps — registered exactly ONCE

  // Check user session on mount & handle hash routing (e.g. #admin)
  useEffect(() => {
    // 0. Cache buster for App Mode to clear stale cached state from yesterday
    const BUILD_VERSION = 'v2_2026_08_07';
    if (localStorage.getItem('bw_build_ver') !== BUILD_VERSION) {
      localStorage.setItem('bw_build_ver', BUILD_VERSION);
      localStorage.removeItem('bw_mock_bundles');
    }

    // 1. Session check
    const user = dbService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }

    // 2. Platform detection check (URL parameter/hash or native platform)
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isNativeCapacitor = !!(window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform();
    const hasAppParam = searchParams.get('platform') === 'app' || hash.includes('platform=app');
    const isApp = isNativeCapacitor || hasAppParam;
    setIsAppMode(isApp);

    // 3. Enforce authentication gateway for app-mode on startup
    if (isApp && !user) {
      setCurrentPage('auth');
    }

    // 3. Hash routing check for admin/student access
    const handleHashRouting = () => {
      const activeHash = window.location.hash.split('?')[0];
      const activeUser = currentUser || dbService.getCurrentUser();

      // Strict protection for App Mode: redirect to login if not authenticated
      if (isApp && !activeUser) {
        if (activeHash !== '#login' && activeHash !== '#admin-login' && activeHash !== '#admin') {
          window.location.hash = '#login';
          return;
        }
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
      } else if (activeHash === '#home' || activeHash === '') {
        if (isApp) {
          setCurrentPage('dashboard');
          window.location.hash = '#catalog';
        } else {
          setCurrentPage('landing');
        }
      }
    };

    // Global right-click blocker
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Global key intercepts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Copy / Cut / Source View shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        alert('Copying content is disabled.');
      }

      // Prevent Print
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        alert('Printing content is disabled.');
      }

      // Prevent Inspect Console
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J'))) {
        e.preventDefault();
      }

      // Detect screenshot shortcuts and blackout screen instantly
      const isScreenshotKey =
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S')) || // Win+Shift+S
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac capture
        e.key === 'Snapshot' ||
        e.key === 'MediaRecord';

      if (isScreenshotKey) {
        setBlackout(true);
        e.preventDefault();
        alert('Screenshots are disabled for security reasons.');
        setTimeout(() => {
          setBlackout(false);
        }, 3000);
      }
    };

    // Global select start block
    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
    window.addEventListener('contextmenu', preventRightClick);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', preventSelection);

    return () => {
      window.removeEventListener('hashchange', handleHashRouting);
      window.removeEventListener('contextmenu', preventRightClick);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', preventSelection);
    };
  }, []);

  // Periodic & Event-driven Single Device Concurrent Session Enforcement
  useEffect(() => {
    if (!currentUser) return;

    let isTerminated = false;

    const checkSingleDeviceSession = async () => {
      if (isTerminated) return;
      // Skip network check if device is offline to keep UI blazing fast & 0ms responsive
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const { valid } = await dbService.verifyDeviceSession(currentUser.id);
      if (!valid) {
        isTerminated = true;
        await dbService.signOut();
        setCurrentUser(null);
        setCurrentPage('auth');
        window.location.hash = '#login';
        alert('⚠️ Session Terminated: Your account was logged in on another device. Only 1 active device is allowed at a time.');
      }
    };

    checkSingleDeviceSession();
    const interval = setInterval(checkSingleDeviceSession, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const [tabSlideDir, setTabSlideDir] = useState<'right' | 'left'>('right');

  const getTabRank = (page: string) => {
    if (page === 'dashboard' || page === 'landing') return 0;
    if (page === 'library') return 1;
    if (page === 'profile' || page === 'auth') return 2;
    if (page === 'admin') return 3;
    return 0;
  };

  // Custom navigate wrapper to sync hash and views synchronously with horizontal slide direction
  const navigate = (page: string) => {
    const currentRank = getTabRank(currentPage);
    const nextRank = getTabRank(page);
    if (nextRank >= currentRank) {
      setTabSlideDir('right');
    } else {
      setTabSlideDir('left');
    }
    setPreviousPage(currentPage);
    setCurrentPage(page);

    if (page === 'landing') {
      window.location.hash = '#home';
    } else if (page === 'dashboard') {
      window.location.hash = '#catalog';
    } else if (page === 'auth') {
      window.location.hash = '#login';
    } else if (page === 'admin-login') {
      window.location.hash = '#admin-login';
    } else if (page === 'admin') {
      window.location.hash = '#admin';
    } else if (page === 'library') {
      window.location.hash = '#library';
    } else if (page === 'profile') {
      window.location.hash = '#profile';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#catalog';
    }
  };

  const handleLogout = async () => {
    await dbService.signOut();
    setCurrentUser(null);
    setCurrentPage('dashboard');
    window.location.hash = '#catalog';
  };

  // Navigates to PDF viewer securely checking if the notes are purchased
  const handleReadNote = async (note: Note) => {
    setPreviousPage(currentPage);
    
    // Check local device storage first for 0ms instant loading with ZERO server pings
    const cached = dbService.getOfflineNote(note.id);
    if (cached && cached.previewUrl) {
      setReadingNote(cached);
      setReadingNoteUnlocked(true);
      setCurrentPage('viewer');
      return;
    }

    setReadingNote(note);
    const isFromLibrary = currentPage === 'library';
    const unlocked = isFromLibrary || (await dbService.checkNoteAccess(note.id));
    setReadingNoteUnlocked(unlocked || note.price === 0);
    setCurrentPage('viewer');

    // Fetch full note payload (with previewUrl) in background & auto-cache locally for permanent 0ms offline reading
    dbService.getNoteById(note.id).then(({ data: fullNote }) => {
      if (fullNote) {
        setReadingNote(fullNote);
        if (unlocked || note.price === 0) {
          dbService.saveNoteForOffline(fullNote);
        }
      }
    });
  };

  // Unlock Note from inside Viewer
  const handleUnlockInViewer = async () => {
    if (!readingNote || !currentUser) {
      window.location.hash = '#login';
      return;
    }
    // Set readingNoteUnlocked to true (simulating successful Razorpay webhook trigger)
    const { success } = await dbService.purchaseNotes(readingNote.id);
    if (success) {
      setReadingNoteUnlocked(true);
    }
  };

  // Dynamically toggle body class for app-mode specific styles
  useEffect(() => {
    if (isAppMode) {
      document.body.classList.add('app-mode');
    } else {
      document.body.classList.remove('app-mode');
    }
  }, [isAppMode]);

  // Helper for rendering policies pages easily
  const handlePolicyNav = (type: 'terms' | 'refund' | 'privacy' | 'contact') => {
    navigate(`policy-${type}`);
  };

  return (
    <>
      {/* Offline Mode Banner for App Mode */}
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
      {/* Navigation Header (Hidden in App Mode or Viewer Mode) */}
      {!isAppMode && currentPage !== 'viewer' && (
        <Navbar 
          user={currentUser} 
          onLogout={handleLogout} 
          navigate={navigate} 
          currentPage={currentPage}
          isAppMode={isAppMode}
        />
      )}

      {/* Main Pages Content Router with Horizontal Tab Slide Animations */}
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
            />
          )}

          {currentPage === 'viewer' && readingNote && (
            <PDFViewer 
              note={readingNote} 
              isUnlocked={readingNoteUnlocked}
              onBack={() => {
                setReadingNote(null);
                navigate(previousPage || 'dashboard');
              }}
              onUnlock={handleUnlockInViewer}
            />
          )}

          {currentPage.startsWith('policy-') && (
            <Policies 
              policyType={currentPage.replace('policy-', '') as any} 
            />
          )}
        </div>

        {/* App Mode Glowing Card Footer (Hidden in Profile or Viewer Mode) */}
        {isAppMode && currentPage !== 'viewer' && currentPage !== 'profile' && (
          <div className="app-glowing-footer" style={{ padding: '0 16px 16px 16px', marginTop: 'auto', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
            <div className="glass-card" style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(13, 22, 47, 0.35)',
              border: '1px solid rgba(96, 165, 250, 0.15)',
              boxShadow: '0 0 10px rgba(37, 99, 235, 0.1)',
              fontSize: '10px',
              color: 'var(--color-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '3px',
              margin: '12px auto 0 auto',
              opacity: 0.85
            }}>
              <span>Designed with ❤️ by</span>
              <a 
                href="https://www.instagram.com/hackwithsaket/" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'var(--color-yellow)', fontWeight: '600', textDecoration: 'none' }}
              >
                Saket Choudhary
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer Section (Hidden in App Mode, Profile Mode, or Viewer Mode) */}
      {!isAppMode && currentPage !== 'viewer' && currentPage !== 'profile' && (
        <footer className="footer">
          <div className="container">
            <div className="footer-row">
              {/* Branding Column */}
              <div className="footer-brand">
                <div className="footer-logo">
                  <div className="logo-img-wrapper" style={{ width: '32px', height: '32px' }}>
                    <img src="/logo.jpg" alt="Bitwise Learning" className="logo-img" />
                  </div>
                  <span className="logo-text" style={{ fontSize: '16px' }}>BITWISE LEARNING</span>
                </div>
                <p className="footer-desc">
                  Simplifying BTech syllabus examinations with concise, high-quality, hand-written study notes and video solutions.
                </p>
              </div>

              {/* Quick Links Column */}
              <div className="footer-links-group">
                <div className="footer-col">
                  <h4>Legal Info</h4>
                  <ul className="footer-links-list">
                    <li>
                      <button className="footer-link-item" onClick={() => handlePolicyNav('terms')}>
                        Terms & Conditions
                      </button>
                    </li>
                    <li>
                      <button className="footer-link-item" onClick={() => handlePolicyNav('refund')}>
                        Refund & Cancellation
                      </button>
                    </li>
                    <li>
                      <button className="footer-link-item" onClick={() => handlePolicyNav('privacy')}>
                        Privacy Policy
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Social Channels Column */}
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
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <p>&copy; {new Date().getFullYear()} Bitwise Learning. All rights reserved. Created for BTech Learners.</p>
              <p style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', opacity: 0.85 }}>
                <span>Designed with ❤️ by</span>
                <a 
                  href="https://www.instagram.com/hackwithsaket/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--color-yellow)', fontWeight: '600', textDecoration: 'none' }}
                >
                  Saket Choudhary
                </a>
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* Bottom Navigation Tabs (App Mode Only, Hidden in Viewer Mode) */}
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
          {/* Catalog Tab */}
          <button 
            onClick={() => navigate('dashboard')} 
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: currentPage === 'dashboard' ? 'var(--color-yellow)' : 'var(--color-muted)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1
            }}
          >
            <BookOpen size={20} />
            <span>Catalog</span>
          </button>

          {/* Library Tab (Only if logged in) */}
          {currentUser && (
            <button 
              onClick={() => navigate('library')} 
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: currentPage === 'library' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <Library size={20} />
              <span>Library</span>
            </button>
          )}

          {/* Profile OR Sign In Tab */}
          {currentUser ? (
            <button 
              onClick={() => navigate('profile')} 
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: currentPage === 'profile' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <User size={20} />
              <span>Profile</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('auth')} 
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: currentPage === 'auth' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <User size={20} />
              <span>Sign In</span>
            </button>
          )}

          {/* Admin Panel Tab (Only if admin) */}
          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => navigate('admin')} 
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: currentPage === 'admin' ? 'var(--color-yellow)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <ShieldCheck size={20} />
              <span>Admin</span>
            </button>
          )}
        </div>
      )}

      {/* Premium Exit App Confirmation Modal */}
      {showExitModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999999,
            background: 'rgba(5, 10, 25, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#f59e0b'
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
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
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
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
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
