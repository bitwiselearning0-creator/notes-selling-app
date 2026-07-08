import React from 'react';
import { Lock, Unlock, FileText } from 'lucide-react';
import type { Note } from '../lib/supabase';

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
  const isFree = note.price === 0;

  return (
    <div className="note-card glass-card fade-in">
      {/* Locked / Unlocked status badge */}
      {(!isPurchased || isFree) && (
        <div className={`note-status-badge ${isFree ? 'unlocked' : 'locked'}`}>
          {isFree ? (
            <>
              <Unlock size={14} /> <span>UNLOCKED</span>
            </>
          ) : (
            <>
              <Lock size={14} /> <span>LOCKED</span>
            </>
          )}
        </div>
      )}

      {/* License Expiration Badge */}
      {isPurchased && !isFree && purchaseDetails && (
        <div className="license-badge">
          {purchaseDetails.daysLeft !== null ? (
            purchaseDetails.daysLeft > 365 ? (
              <span>Admin License</span>
            ) : (
              <span>{purchaseDetails.daysLeft} Days Left</span>
            )
          ) : (
            <span>6 Months</span>
          )}
        </div>
      )}

      <div className="note-body">
        <span className="semester-tag">Sem {note.semester} • {note.year} • <strong style={{ color: note.type === 'pyqs' ? '#60a5fa' : '#34d399' }}>{note.type === 'pyqs' ? 'PYQ' : 'Notes'}</strong></span>
        <h3 className="note-title">{note.title}</h3>
        <p className="note-description">{note.description}</p>
        
        {/* Topics List */}
        <div className="note-topics">
          {note.topics.slice(0, 3).map((topic, i) => (
            <span key={i} className="topic-chip">{topic}</span>
          ))}
          {note.topics.length > 3 && <span className="topic-chip-more">+{note.topics.length - 3} more</span>}
        </div>

        {/* Document Stats */}
        <div className="note-stats">
          <div className="note-stat-item">
            <FileText size={16} className="blue-accent" />
            <span>{note.pagesCount} PDF Pages</span>
          </div>
          <div className="note-price">
            {isFree ? (
              <span className="free-price">FREE</span>
            ) : (
              <>
                <span className="original-price">₹{note.price + 100}</span>
                <span className="discounted-price">₹{note.price}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="note-footer">
        {isLoggedIn ? (
          isPurchased || isFree ? (
            <button className="btn-primary w-full" onClick={() => onRead(note)}>
              {note.type === 'pyqs' ? 'Read PYQ Solutions' : 'Read Notes'}
            </button>
          ) : (
            <div className="action-buttons-group">
              <button 
                className="btn-secondary" 
                onClick={() => onRead(note)} // In locked state, reading will open the preview mode (e.g. first 2 pages)
              >
                Free Preview
              </button>
              <button 
                className="btn-primary flex-1" 
                onClick={() => onPurchase(note.id, note.price)}
              >
                Unlock ₹{note.price}
              </button>
            </div>
          )
        ) : (
          <button className="btn-primary w-full" onClick={onNavigateToAuth}>
            Sign In to Unlock
          </button>
        )}
      </div>
    </div>
  );
};
