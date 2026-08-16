import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { dbService } from '../lib/dbService';
import type { UserProfile } from '../lib/dbService';

interface AuthProps {
  onLoginSuccess: (user: UserProfile) => void;
  navigate: (page: string) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '566914961474-cjetid7lk5dim6rpac5s3m8os3ai1l78.apps.googleusercontent.com';

// PKCE Cryptographic Generator Helpers for Native Android OAuth 2.0
function generateRandomString(length: number = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values).map(x => chars[x % chars.length]).join('');
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, navigate }) => {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCustomGoogleBtn, setShowCustomGoogleBtn] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const parseHashAndLogin = (hashString: string) => {
    if (hashString && hashString.includes('access_token=')) {
      const cleanHash = hashString.replace(/^#\/?/, '').replace(/^login\/?\?/, '');
      const params = new URLSearchParams(cleanHash);
      const accessToken = params.get('access_token');
      if (accessToken) {
        setLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then((res) => res.json())
          .then((userInfo) => {
            if (userInfo && userInfo.email) {
              executeGoogleSignIn(userInfo.email, userInfo.name, accessToken);
            } else {
              setGlobalError('Failed to fetch verified Google user profile.');
              setLoading(false);
            }
          })
          .catch(() => {
            setGlobalError('Failed to verify Google login.');
            setLoading(false);
          });
      }
    }
  };

  // Initialize Google Identity Services & App Listeners
  useEffect(() => {
    let rendered = false;

    // 1. Check if returning from Google OAuth Redirect flow in Web Hash
    parseHashAndLogin(window.location.hash);

    // 2. Listen for App Deep Link / URL Callback in Capacitor Native App (OAuth Code PKCE Flow)
    let appUrlListenerHandle: any = null;
    if (Capacitor.isNativePlatform()) {
      appUrlListenerHandle = App.addListener('appUrlOpen', (event: any) => {
        if (event.url && (event.url.includes('com.bitwiselearning.app://auth/callback') || event.url.includes('bitwiselearning://auth/callback') || event.url.includes('token='))) {
          try {
            Browser.close();
          } catch (e) {}

          try {
            const rawUrl = event.url;
            const queryPos = rawUrl.indexOf('?');
            if (queryPos !== -1) {
              const queryString = rawUrl.substring(queryPos + 1);
              const params = new URLSearchParams(queryString);
              const token = params.get('token');
              const userStr = params.get('user');
              const activeSessionId = params.get('activeSessionId');
              const authError = params.get('error');

              if (authError) {
                setGlobalError(decodeURIComponent(authError));
                setLoading(false);
                return;
              }

              if (token && userStr) {
                const userProfile: UserProfile = JSON.parse(decodeURIComponent(userStr));
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('bw_token', token);
                  if (activeSessionId) {
                    localStorage.setItem('bw_active_session_id', activeSessionId);
                  }
                }
                dbService.setCurrentUser(userProfile);
                setSuccessMsg(`Signed in as ${userProfile.email}. Redirecting...`);
                setTimeout(() => {
                  onLoginSuccess(userProfile);
                  navigate('dashboard');
                }, 400);
              }
            }
          } catch (err) {
            console.error('Error handling Android deep link callback:', err);
            setGlobalError('Failed to process Google authentication callback.');
            setLoading(false);
          }
        }
      });
    }

    // 3. Initialize GIS SDK for Web
    const initGsi = () => {
      if ((window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            ux_mode: 'popup'
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 320
            });
            rendered = true;
          }
        } catch (e) {
          console.warn('GIS Init note:', e);
        }
      }
    };

    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGsi();
        setTimeout(() => {
          if (!googleBtnRef.current || googleBtnRef.current.children.length === 0 || Capacitor.isNativePlatform()) {
            setShowCustomGoogleBtn(true);
          }
        }, 800);
      };
      script.onerror = () => {
        setShowCustomGoogleBtn(true);
      };
      document.head.appendChild(script);
    } else {
      initGsi();
    }

    const timer = setTimeout(() => {
      if (!rendered || !googleBtnRef.current || googleBtnRef.current.children.length === 0 || Capacitor.isNativePlatform()) {
        setShowCustomGoogleBtn(true);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (appUrlListenerHandle && typeof appUrlListenerHandle.remove === 'function') {
        appUrlListenerHandle.remove();
      }
    };
  }, []);

  // Handle Google Credential Response from GIS SDK (Web)
  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      setGlobalError(null);
      
      let email = '';
      let name = '';
      let idToken = response?.credential || '';

      if (idToken) {
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        email = payload.email;
        name = payload.name || payload.given_name;
      }

      if (email) {
        executeGoogleSignIn(email, name, idToken);
      } else {
        setGlobalError('Could not retrieve email from Google Account.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google Token error:', err);
      setGlobalError('Failed to process Google login credentials.');
      setLoading(false);
    }
  };

  // Trigger Android (OAuth 2.0 PKCE Flow) & Web Compliant Google Sign In
  const triggerGoogleSignIn = async () => {
    setGlobalError(null);
    setSuccessMsg(null);
    setLoading(true);

    // 1. In Native Android App, use OAuth 2.0 Authorization Code Flow + PKCE (S256) via Chrome Custom Tabs
    if (Capacitor.isNativePlatform()) {
      try {
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await sha256Base64Url(codeVerifier);
        const csrfToken = generateRandomString(32);
        const nonce = generateRandomString(16);

        const stateObj = { csrf: csrfToken, cv: codeVerifier };
        const stateStr = btoa(JSON.stringify(stateObj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const redirectUri = 'https://bitwiselearning.online/api/auth/google/mobile/callback';

        const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent('openid email profile')}` +
          `&state=${encodeURIComponent(stateStr)}` +
          `&nonce=${encodeURIComponent(nonce)}` +
          `&code_challenge=${encodeURIComponent(codeChallenge)}` +
          `&code_challenge_method=S256` +
          `&prompt=select_account`;

        await Browser.open({ url: googleOAuthUrl });
        return;
      } catch (e: any) {
        console.error('Capacitor Browser OAuth note:', e);
        setGlobalError('Could not launch Google authentication browser.');
        setLoading(false);
        return;
      }
    }

    // 2. Web Fallback - Try GIS OneTap if available
    const webRedirectUri = 'https://bitwiselearning.online/#login';
    const webGoogleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(webRedirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&prompt=select_account`;

    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            window.location.href = webGoogleOAuthUrl;
          }
        });
        return;
      } catch (e) {}
    }

    // 3. Web Redirect Fallback
    window.location.href = webGoogleOAuthUrl;
  };

  const executeGoogleSignIn = async (email: string, name?: string, idToken?: string) => {
    setLoading(true);
    setGlobalError(null);

    const cleanEmail = email.trim().toLowerCase();
    const userName = name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    try {
      const { data, error } = await dbService.googleSignIn(cleanEmail, userName, undefined, undefined, idToken);
      if (error) {
        setGlobalError(error);
      } else if (data) {
        setSuccessMsg(`Signed in as ${data.email}. Redirecting...`);
        setTimeout(() => {
          onLoginSuccess(data);
          navigate('dashboard');
        }, 600);
      }
    } catch (err: any) {
      setGlobalError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container container" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      {/* Dynamic Ambient Glow Backdrop */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}></div>

      {/* Main Login Card */}
      <div 
        className="auth-card glass-card fade-in" 
        style={{ 
          maxWidth: '430px', 
          width: '100%', 
          borderRadius: '28px', 
          padding: '42px 32px 36px 32px', 
          textAlign: 'center', 
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Brand Logo & Title Header */}
        <div className="auth-header" style={{ marginBottom: '30px' }}>
          <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '22px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '2px', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', background: '#0f172a' }}>
                <img src="/logo.jpg" alt="Bitwise Learning Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: '#ffffff', letterSpacing: '-0.025em' }}>
            Bitwise Learning
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.6', fontWeight: '400' }}>
            Access top-tier syllabus notes, hand-written guides & solved university PYQs.
          </p>
        </div>

        {/* Feature Highlights Pill Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '5px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} /> Instant Access
          </span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', padding: '5px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <BookOpen size={12} /> Verified Notes
          </span>
        </div>

        {/* Error Notification Banner */}
        {globalError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '16px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', lineHeight: '1.4' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{globalError}</span>
          </div>
        )}

        {/* Success Notification Banner */}
        {successMsg && (
          <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '12px 16px', borderRadius: '16px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Loading Indicator State */}
        {loading && (
          <div style={{ fontSize: '13px', color: '#60a5fa', marginBottom: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ width: '14px', height: '14px', border: '2px solid #60a5fa', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
            Verifying Google Account...
          </div>
        )}

        {/* Google Sign In Container */}
        <div style={{ margin: '0 auto 24px' }}>
          {/* Target for GIS renderButton */}
          {!Capacitor.isNativePlatform() && (
            <div 
              ref={googleBtnRef}
              style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }}
            ></div>
          )}

          {/* Guaranteed Visible Button for Android Native App and Fallbacks */}
          {(showCustomGoogleBtn || Capacitor.isNativePlatform()) && (
            <button
              type="button"
              onClick={triggerGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                maxWidth: '320px',
                height: '48px',
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #cbd5e1',
                borderRadius: '24px',
                fontSize: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                margin: '8px auto 0 auto',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>

        {/* Security & SSL Footer */}
        <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <ShieldCheck size={14} style={{ color: '#34d399' }} />
          <span>256-Bit Cryptographic SSL Security via Google OAuth</span>
        </div>
      </div>
    </div>
  );
};
