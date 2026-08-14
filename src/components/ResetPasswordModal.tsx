import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { dbService } from '../lib/supabase';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { success: resSuccess, error: resError } = await dbService.updatePassword(newPassword);
      if (resError) {
        setError(resError);
      } else if (resSuccess) {
        setSuccess('Password updated successfully! Redirecting...');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '90%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--color-yellow)' }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Set New Password
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Please enter and confirm your new password to secure your account.
          </p>
        </div>

        {error && (
          <div className="security-banner" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed var(--color-error)', color: 'var(--color-error)', marginBottom: '20px' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="security-banner" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px dashed #22c55e', color: '#22c55e', marginBottom: '20px' }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="reset-new-pass" style={{ fontSize: '13px', color: 'var(--color-text)' }}>New Password</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <Lock size={16} className="search-icon-overlay" style={{ left: '16px' }} />
              <input
                type="password"
                id="reset-new-pass"
                placeholder="At least 6 characters"
                style={{ paddingLeft: '48px', width: '100%', boxSizing: 'border-box' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm-pass" style={{ fontSize: '13px', color: 'var(--color-text)' }}>Confirm New Password</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <Lock size={16} className="search-icon-overlay" style={{ left: '16px' }} />
              <input
                type="password"
                id="reset-confirm-pass"
                placeholder="Re-enter new password"
                style={{ paddingLeft: '48px', width: '100%', boxSizing: 'border-box' }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            style={{ justifyContent: 'center', padding: '14px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Updating...' : (
              <>
                Update Password <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
