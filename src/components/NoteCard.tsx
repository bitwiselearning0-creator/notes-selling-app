import React from 'react';
import { Unlock, FileText } from 'lucide-react';
import { isNotePdfAvailable } from '../lib/dbService';
import type { Note } from '../lib/dbService';

interface NoteCardProps {
  note: Note;
  isPurchased: boolean;
  isLoggedIn: boolean;
  onPurchase: (noteId: string, price: number) => void;
  onRead: (note: Note) => void;
  onNavigateToAuth: () => void;
  purchaseDetails?: { expiresAt: string | null; daysLeft: number | null } | null;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isPurchased,
  isLoggedIn,
  onPurchase,
  onRead,
  onNavigateToAuth,
  purchaseDetails
}) => {
  const isPyq = note.type === 'pyqs';
  const isUnlocked = isPurchased;

  // Accent colors based on type
  const accentColor = isPyq ? '#a78bfa' : '#60a5fa';
  const badgeBorder = isPyq ? 'rgba(167, 139, 250, 0.3)' : 'rgba(96, 165, 250, 0.3)';

  return (
    <div 
      className={`glass-card note-unit-card fade-in ${isPyq ? 'is-pyq-card' : 'is-notes-card'}`}
      style={{
        borderRadius: '18px',
        padding: '16px 18px',
        marginBottom: '14px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'left'
      }}
    >
      {/* Row 1: Header Badge & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="note-unit-badge" style={{
          fontSize: '10px',
          fontWeight: '800',
          padding: '3px 10px',
          borderRadius: '100px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isPyq ? '📝 Exam PYQ Paper' : '📖 Study Notes Unit'}
        </span>

        {isUnlocked ? (
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Unlock size={10} /> UNLOCKED
          </span>
        ) : (
          <span className="note-access-text" style={{ fontSize: '10px', fontWeight: '600' }}>
            {purchaseDetails?.daysLeft ? `${purchaseDetails.daysLeft} Days` : '6 Months Access'}
          </span>
        )}
      </div>

      {/* Row 2: Title */}
      <h4 className="note-unit-title" style={{ 
        fontSize: '15px', 
        fontWeight: '800', 
        margin: '0 0 8px 0', 
        lineHeight: '1.3'
      }}>
        {note.title}
      </h4>

      {/* Topics / Features Chips */}
      {note.topics && note.topics.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {note.topics.slice(0, 3).map((topic, i) => (
            <span key={i} className="note-topic-chip" style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Row 3: Symmetrical Bottom Bar (Stats on Left, Price & Action on Right) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Left: Document Stats */}
        <div className="note-stats-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600' }}>
          <FileText size={13} className="note-stats-icon" />
          <span>{isNotePdfAvailable(note) ? `${note.pagesCount} PDF Pages` : '✦ Under Faculty Review'}</span>
        </div>

        {/* Right: Price & Unlock/Read Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {!isUnlocked && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-muted)', textDecoration: 'line-through', lineHeight: 1 }}>
                ₹{note.originalPrice ?? (note.price + 100)}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: accentColor, lineHeight: 1.1, marginTop: '1px' }}>
                ₹{note.price}
              </div>
            </div>
          )}
          {isLoggedIn ? (
            isUnlocked ? (
              <button 
                className="btn-primary" 
                onClick={() => onRead(note)}
                style={{ fontSize: '12px', padding: '7px 16px', fontWeight: '700', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Read PDF</span>
              </button>
            ) : (
              <button 
                className="btn-primary" 
                onClick={() => onPurchase(note.id, note.price)}
                style={{ fontSize: '12px', padding: '7px 14px', fontWeight: '700', borderRadius: '10px', boxShadow: `0 4px 15px ${badgeBorder}` }}
              >
                Unlock
              </button>
            )
          ) : (
            <button 
              className="btn-primary" 
              onClick={onNavigateToAuth}
              style={{ fontSize: '12px', padding: '7px 14px', fontWeight: '700', borderRadius: '10px' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
