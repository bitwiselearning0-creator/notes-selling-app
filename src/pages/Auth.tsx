import React, { useState } from 'react';
import { Mail, Lock, Phone, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { dbService } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

interface AuthProps {
  onLoginSuccess: (user: UserProfile) => void;
  navigate: (page: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, navigate }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Error handling
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Strict Phone Input Handling: Allows ONLY digits (0-9)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Replace all non-digit characters immediately
    const cleanValue = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (cleanValue.length <= 10) {
      setPhone(cleanValue);
      // Clear phone error if it starts getting filled correctly
      if (errors.phone) {
        setErrors(prev => {
          const newErr = { ...prev };
          delete newErr.phone;
          return newErr;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (isRegister) {
      // Name validation
      if (!name.trim()) {
        newErrors.name = 'Full name is required.';
      } else if (name.trim().length < 3) {
        newErrors.name = 'Name must be at least 3 characters.';
      }

      // Phone validation
      if (!phone) {
        newErrors.phone = 'Phone number is required.';
      } else if (phone.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isRegister) {
        // SignUp Action
        const { data, error } = await dbService.signUp(name, email, phone, password);
        if (error) {
          setGlobalError(error);
        } else if (data) {
          onLoginSuccess(data);
          navigate('dashboard');
        }
      } else {
        // SignIn Action
        const { data, error } = await dbService.signIn(email, password);
        if (error) {
          setGlobalError(error);
        } else if (data) {
          if (data.role === 'admin') {
            await dbService.signOut();
            setGlobalError('Administrator session detected. Please log in via the secure portal at /#admin.');
            setLoading(false);
            return;
          }
          onLoginSuccess(data);
          navigate('dashboard');
        }
      }
    } catch (err: any) {
      setGlobalError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    setErrors({});
    setGlobalError(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  return (
    <div className="auth-container container">
      {/* Background Decorative Blob overlays */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="auth-card glass-card fade-in">
        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <div className="logo-img-wrapper" style={{ width: '60px', height: '60px' }}>
              <img src="/logo.jpg" alt="Bitwise Learning Logo" className="logo-img" />
            </div>
          </div>
          <h2 className="auth-title">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="auth-subtitle">
            {isRegister 
              ? 'Join Bitwise Learning to unlock premium engineering notes' 
              : 'Sign in to access your unlocked notes catalog'
            }
          </p>
        </div>

        {globalError && (
          <div className="security-banner" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed var(--color-error)', color: 'var(--color-error)', marginBottom: '20px' }}>
            <ShieldAlert size={16} />
            <span>{globalError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} className="search-icon-overlay" style={{ left: '16px' }} />
                <input 
                  type="text" 
                  id="auth-name"
                  placeholder="Enter your full name" 
                  style={{ paddingLeft: '48px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} className="search-icon-overlay" style={{ left: '16px' }} />
              <input 
                type="text" 
                id="auth-email"
                placeholder="Enter your email address" 
                style={{ paddingLeft: '48px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="auth-phone">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} className="search-icon-overlay" style={{ left: '16px' }} />
                <input 
                  type="text" 
                  id="auth-phone"
                  placeholder="Enter 10-digit phone number" 
                  style={{ paddingLeft: '48px' }}
                  value={phone}
                  onChange={handlePhoneChange} // Strict validation hook
                  disabled={loading}
                />
              </div>
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} className="search-icon-overlay" style={{ left: '16px' }} />
              <input 
                type="password" 
                id="auth-password"
                placeholder="Enter password" 
                style={{ paddingLeft: '48px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full" 
            style={{ justifyContent: 'center', padding: '14px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (
              <>
                {isRegister ? 'Sign Up' : 'Sign In'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="form-toggle-link">
          {isRegister ? (
            <>
              Already have an account? <span onClick={toggleAuthMode}>Sign In</span>
            </>
          ) : (
            <>
              New to Bitwise Learning? <span onClick={toggleAuthMode}>Create Account</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
