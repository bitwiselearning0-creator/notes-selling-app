import React, { useState } from 'react';
import { LogOut, Menu, X, Library, LayoutDashboard, User } from 'lucide-react';
import type { UserProfile } from '../lib/supabase';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  navigate: (page: string) => void;
  currentPage: string;
  isAppMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, navigate, currentPage, isAppMode = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: string) => {
    navigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar" style={{ padding: isAppMode ? '10px 0' : '14px 0' }}>
      <div className="container nav-container">
        {/* Logo and Branding */}
        <div className="nav-logo" onClick={() => handleNavClick('landing')}>
          <div className="logo-img-wrapper" style={{ width: isAppMode ? '34px' : '42px', height: isAppMode ? '34px' : '42px' }}>
            <img src="/logo.jpg" alt="Bitwise Learning Logo" className="logo-img" />
          </div>
          <span className="logo-text" style={{ fontSize: isAppMode ? '14px' : '16px' }}>BITWISE LEARNING</span>
        </div>

        {/* Regular Desktop Navigation */}
        {!isAppMode && (
          <div className="nav-links">
            <button 
              className={`nav-link-btn ${currentPage === 'landing' ? 'active' : ''}`}
              onClick={() => handleNavClick('landing')}
            >
              Home
            </button>
            
            <button 
              className={`nav-link-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              Notes Catalog
            </button>

            {user && (
              <button 
                className={`nav-link-btn ${currentPage === 'library' ? 'active' : ''}`}
                onClick={() => handleNavClick('library')}
              >
                <Library size={16} /> My Library
              </button>
            )}

            {user?.role === 'admin' && (
              <button 
                className={`nav-link-btn ${currentPage === 'admin' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin')}
              >
                <LayoutDashboard size={16} /> Admin Console
              </button>
            )}
          </div>
        )}

        {/* Desktop / App Actions */}
        <div className="nav-actions">
          {isAppMode ? (
            user ? (
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
            )
          ) : (
            user ? (
              <div className="user-profile-widget">
                <span className="user-name">
                  <User size={14} className="user-icon" /> {user.name}
                </span>
                <button className="btn-secondary" onClick={onLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => handleNavClick('auth')}>
                Sign In
              </button>
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
            onClick={() => handleNavClick('landing')}
          >
            Home
          </button>
          <button 
            className={`mobile-link-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            Notes Catalog
          </button>
          
          {user && (
            <button 
              className={`mobile-link-btn ${currentPage === 'library' ? 'active' : ''}`}
              onClick={() => handleNavClick('library')}
            >
              <Library size={16} style={{ marginRight: '8px' }} /> My Library
            </button>
          )}

          {user?.role === 'admin' && (
            <button 
              className={`mobile-link-btn ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              <LayoutDashboard size={16} style={{ marginRight: '8px' }} /> Admin Console
            </button>
          )}

          <div className="mobile-action-section">
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
