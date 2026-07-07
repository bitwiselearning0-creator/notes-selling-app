import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, Lock, Mail } from 'lucide-react';
import { dbService } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  navigate: (page: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await dbService.signIn(email.trim(), password);
      
      if (error) {
        setErrorMsg(error);
        setLoading(false);
        return;
      }

      if (data) {
        if (data.role !== 'admin') {
          await dbService.signOut();
          setErrorMsg('ACCESS DENIED: You do not have administrator privileges.');
          setLoading(false);
          return;
        }

        onLoginSuccess(data);
        navigate('admin');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Security authentication failed. Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container container fade-in" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background Decorative Blob overlays */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="auth-card glass-card" style={{ borderColor: 'rgba(251, 191, 36, 0.3)', boxShadow: '0 8px 32px rgba(251, 191, 36, 0.05)' }}>
        <div className="auth-header">
          <div className="auth-logo-wrapper" style={{ borderColor: 'rgba(251, 191, 36, 0.3)', background: 'rgba(251, 191, 36, 0.05)' }}>
            <ShieldCheck size={32} style={{ color: 'var(--color-yellow)' }} />
          </div>
          <h2 className="auth-title" style={{ color: 'var(--color-white)' }}>
            Admin Portal
          </h2>
          <p className="auth-subtitle">
            Secure sign in for content management & student licensing
          </p>
        </div>

        {errorMsg && (
          <div className="security-banner" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed var(--color-error)', color: 'var(--color-error)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminSignIn} className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} className="search-icon-overlay" style={{ left: '16px' }} />
              <input 
                type="email" 
                id="admin-email"
                placeholder="admin@bitwiselearning.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Security Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} className="search-icon-overlay" style={{ left: '16px' }} />
              <input 
                type="password" 
                id="admin-password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full" 
            style={{ justifyContent: 'center', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Authenticating...
              </>
            ) : (
              'Verify & Access Console'
            )}
          </button>
        </form>

        <div className="form-toggle-link" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '24px' }}>
          <span onClick={() => {
            window.location.hash = '';
            navigate('landing');
          }}>
            ← Back to Student Website
          </span>
        </div>
      </div>
    </div>
  );
};
