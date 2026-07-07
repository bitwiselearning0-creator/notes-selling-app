import React from 'react';
import { User, Mail, Phone, ShieldCheck, LogOut, Award } from 'lucide-react';
import type { UserProfile } from '../lib/supabase';

interface ProfileProps {
  user: UserProfile | null;
  onLogout: () => void;
  navigate: (page: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout, navigate }) => {
  if (!user) {
    return (
      <div className="container section-padding fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="auth-card glass-card" style={{ textAlign: 'center', padding: '30px' }}>
          <User size={48} className="yellow-accent" style={{ margin: '0 auto 16px' }} />
          <h3>Access Denied</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', margin: '8px 0 20px' }}>
            Please sign in to view your profile details.
          </p>
          <button className="btn-primary" onClick={() => navigate('auth')}>
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-padding fade-in" style={{ paddingBottom: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      {/* Background blobs */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="auth-card glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px 30px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)', 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px', 
            color: 'var(--color-blue-light)',
            border: '2px solid rgba(96, 165, 250, 0.3)'
          }}>
            <User size={40} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: 0 }}>
            {user.name}
          </h3>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: user.role === 'admin' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(96, 165, 250, 0.08)',
            border: user.role === 'admin' ? '1px solid rgba(251, 191, 36, 0.25)' : '1px solid rgba(96, 165, 250, 0.25)',
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '11px',
            color: user.role === 'admin' ? 'var(--color-yellow)' : 'var(--color-blue-light)',
            fontWeight: '700',
            marginTop: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {user.role === 'admin' ? <ShieldCheck size={12} /> : <Award size={12} />}
            {user.role === 'admin' ? 'Admin Access' : 'Verified Learner'}
          </div>
        </div>

        {/* Profile Info Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Mail size={18} style={{ color: 'var(--color-muted)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>Email Address</div>
              <div style={{ fontSize: '14px', color: 'var(--color-white)', marginTop: '2px', wordBreak: 'break-all' }}>{user.email}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Phone size={18} style={{ color: 'var(--color-muted)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>Phone Number</div>
              <div style={{ fontSize: '14px', color: 'var(--color-white)', marginTop: '2px' }}>+91 {user.phone || 'Not Provided'}</div>
            </div>
          </div>
        </div>

        {/* Log Out Action Button */}
        <button 
          className="btn-secondary w-full" 
          onClick={onLogout}
          style={{ 
            borderColor: '#ef4444', 
            color: '#f87171', 
            justifyContent: 'center', 
            padding: '12px', 
            fontSize: '14px', 
            fontWeight: '700',
            gap: '8px'
          }}
        >
          <LogOut size={16} /> Log Out from Application
        </button>
      </div>
    </div>
  );
};
