import React, { useEffect, useState } from 'react';
import { LogOut, Menu, X, Library, LayoutDashboard, User, Sun, Moon, Smartphone } from 'lucide-react';
import type { UserProfile } from '../lib/dbService';
import { getThemePreference, applyThemePreference } from '../lib/theme';
import type { ThemePreference } from '../lib/theme';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  navigate: (page: string) => void;
  currentPage: string;
  isAppMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, navigate, currentPage, isAppMode = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themePref, setThemePref] = useState<ThemePreference>(() => getThemePreference());

  useEffect(() => {
    const handleThemeEvent = () => {
      setThemePref(getThemePreference());
    };
    window.addEventListener('bw_theme_changed', handleThemeEvent);
    return () => window.removeEventListener('bw_theme_changed', handleThemeEvent);
  }, []);

  const cycleTheme = () => {
    let nextPref: ThemePreference = 'dark';
    if (themePref === 'dark') nextPref = 'light';
    else if (themePref === 'light') nextPref = 'system';
    else nextPref = 'dark';

    setThemePref(nextPref);
    applyThemePreference(nextPref);
  };

  const handleNavClick = (page: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        {/* Logo and Branding */}
        <div className="nav-logo" onClick={(e) => handleNavClick(isAppMode ? 'dashboard' : 'landing', e)}>
          <div className="logo-img-wrapper" style={isAppMode ? { width: '34px', height: '34px' } : undefined}>
            <img src="/logo.jpg" alt="Bitwise Learning Logo" className="logo-img" />
          </div>
          <span className="logo-text" style={isAppMode ? { fontSize: '14px' } : undefined}>
            <span className="brand-bitwise">BITWISE</span>
            <span className="brand-learning">LEARNING</span>
          </span>
        </div>

        {/* Regular Desktop Navigation */}
        {!isAppMode && (
          <div className="nav-links">
            <button 
              className={`nav-link-btn ${currentPage === 'landing' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('landing', e)}
            >
              Home
            </button>
            
            <button 
              className={`nav-link-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('dashboard', e)}
            >
              Notes Catalog
            </button>

            {user && (
              <button 
                className={`nav-link-btn ${currentPage === 'library' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('library', e)}
              >
                <Library size={15} style={{ marginRight: '6px' }} /> My Library
              </button>
            )}

            {user?.role === 'admin' && (
              <button 
                className={`nav-link-btn ${currentPage === 'admin' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('admin', e)}
              >
                <LayoutDashboard size={15} style={{ marginRight: '6px' }} /> Admin Console
              </button>
            )}
          </div>
        )}

        {/* Desktop / App Actions */}
        <div className="nav-actions">
          {isAppMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user ? (
                <button 
                  className="btn-icon" 
                  onClick={() => handleNavClick('profile')}
                  style={{ padding: '6px', borderRadius: '50%', minWidth: 'auto', border: '1px solid rgba(255,255,255,0.06)' }}
                  title="View Profile"
                >
                  <User size={18} className="blue-accent" />
                </button>
              ) : (
                <button 
                  className="btn-primary" 
                  onClick={() => handleNavClick('auth')}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  Sign In
                </button>
              )}
            </div>
          ) : (
            user ? (
              <div className="user-profile-widget" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  className={`nav-link-btn ${currentPage === 'profile' ? 'active' : ''}`}
                  onClick={() => handleNavClick('profile')}
                  title="View My Profile"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <User size={15} className="user-icon" />
                  <span>{user.name}</span>
                </button>
                {!isAppMode && (
                  <button 
                    className="theme-toggle-btn" 
                    onClick={cycleTheme} 
                    title={`Theme: ${themePref === 'system' ? 'Device Default (System)' : themePref === 'light' ? 'Light Mode' : 'Dark Mode'}`}
                    aria-label="Toggle Theme Preference"
                  >
                    {themePref === 'system' ? <Smartphone size={18} /> : themePref === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                )}
                <button className="btn-secondary" onClick={onLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!isAppMode && (
                  <button 
                    className="theme-toggle-btn" 
                    onClick={cycleTheme} 
                    title={`Theme: ${themePref === 'system' ? 'Device Default (System)' : themePref === 'light' ? 'Light Mode' : 'Dark Mode'}`}
                    aria-label="Toggle Theme Preference"
                  >
                    {themePref === 'system' ? <Smartphone size={18} /> : themePref === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                )}
                <button className="btn-primary" onClick={() => handleNavClick('auth')}>
                  Sign In
                </button>
              </div>
            )
          )}
        </div>

        {/* Mobile Hamburger Toggle (hidden in app mode) */}
        {!isAppMode && (
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="mobile-menu-panel fade-in">
          <button 
            className={`mobile-link-btn ${currentPage === 'landing' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('landing', e)}
          >
            Home
          </button>
          <button 
            className={`mobile-link-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('dashboard', e)}
          >
            Notes Catalog
          </button>
          
          {user && (
            <button 
              className={`mobile-link-btn ${currentPage === 'library' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('library', e)}
            >
              <Library size={16} style={{ marginRight: '8px' }} /> My Library
            </button>
          )}

          {user && (
            <button 
              className={`mobile-link-btn ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('profile', e)}
            >
              <User size={16} style={{ marginRight: '8px' }} /> My Profile
            </button>
          )}

          {user?.role === 'admin' && (
            <button 
              className={`mobile-link-btn ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={(e) => handleNavClick('admin', e)}
            >
              <LayoutDashboard size={16} style={{ marginRight: '8px' }} /> Admin Console
            </button>
          )}

          <div className="mobile-action-section">
            {!isAppMode && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '600' }}>
                  Theme ({themePref === 'system' ? 'System' : themePref === 'light' ? 'Light' : 'Dark'})
                </span>
                <button 
                  className="theme-toggle-btn" 
                  onClick={cycleTheme} 
                  title="Cycle Theme Mode"
                  style={{ width: '36px', height: '36px' }}
                >
                  {themePref === 'system' ? <Smartphone size={16} /> : themePref === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            )}
            {user ? (
              <div className="mobile-user-info">
                <span className="mobile-user-name">Signed in as: <strong>{user.name}</strong></span>
                <button className="btn-secondary w-full" onClick={() => { onLogout(); setMobileMenuOpen(false); }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button className="btn-primary w-full" onClick={() => handleNavClick('auth')}>
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
