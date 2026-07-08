import { useState, useEffect } from 'react';
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
import { Video, Send, BookOpen, Library, ShieldCheck, User } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Dashboard states shared between Landing and Catalog
  const [selectedYear, setSelectedYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');

  // Reader states
  const [readingNote, setReadingNote] = useState<Note | null>(null);
  const [readingNoteUnlocked, setReadingNoteUnlocked] = useState(false);
  const [isAppMode, setIsAppMode] = useState(false);

  // Check user session on mount & handle hash routing (e.g. #admin)
  useEffect(() => {
    // 1. Session check
    const user = dbService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }

    // 2. Platform detection check (URL parameter/hash or native platform)
    localStorage.removeItem('bw_platform_mode'); // Clear legacy lock-in cache
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hasAppParam = searchParams.get('platform') === 'app' || hash.includes('platform=app') || window.location.href.includes('platform=app') || !!(window as any).Capacitor;
    const isApp = hasAppParam;
    setIsAppMode(isApp);

    // 3. Enforce authentication gateway for app-mode on startup
    if (isApp && !user) {
      setCurrentPage('auth');
    }

    // 3. Hash routing check for admin/student access
    const handleHashRouting = () => {
      const activeHash = window.location.hash.split('?')[0];
      const activeUser = dbService.getCurrentUser();

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
          window.location.hash = '#login';
        }
      } else if (activeHash === '#profile') {
        if (activeUser) {
          setCurrentPage('profile');
        } else {
          window.location.hash = '#login';
        }
      } else if (activeHash === '#home' || activeHash === '') {
        if (isApp) {
          window.location.hash = '#catalog';
        } else {
          setCurrentPage('landing');
        }
      }
    };

    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
    return () => window.removeEventListener('hashchange', handleHashRouting);
  }, []);

  // Custom navigate wrapper to sync hash and views
  const navigate = (page: string) => {
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
    } else {
      setCurrentPage(page);
    }
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
    window.location.hash = '#home';
  };

  // Navigates to PDF viewer securely checking if the notes are purchased
  const handleReadNote = async (note: Note) => {
    setReadingNote(note);
    const unlocked = await dbService.isNotesPurchased(note.id);
    setReadingNoteUnlocked(unlocked || note.price === 0);
    setCurrentPage('viewer');
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
    setCurrentPage(`policy-${type}`);
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* Navigation Header (Hidden in App Mode) */}
      {!isAppMode && (
        <Navbar 
          user={currentUser} 
          onLogout={handleLogout} 
          navigate={navigate} 
          currentPage={currentPage}
          isAppMode={isAppMode}
        />
      )}

      {/* Main Pages Content Router */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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
              setCurrentPage('dashboard');
            }}
            onUnlock={handleUnlockInViewer}
          />
        )}

        {currentPage.startsWith('policy-') && (
          <Policies 
            policyType={currentPage.replace('policy-', '') as any} 
          />
        )}
      </main>

      {/* Footer Section (Hidden in App Mode) */}
      {!isAppMode && (
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
                      href="https://github.com/bitwiselearning0-creator" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-icon-btn"
                      title="GitHub Repository"
                    >
                      <Send size={16} />
                    </a>
                    <a 
                      href="https://www.youtube.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-icon-btn"
                      title="Youtube Channel"
                    >
                      <Video size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} Bitwise Learning. All rights reserved. Created for BTech Learners.</p>
            </div>
          </div>
        </footer>
      )}

      {/* Bottom Navigation Tabs (App Mode Only) */}
      {isAppMode && currentUser && (
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
    </>
  );
}

export default App;
