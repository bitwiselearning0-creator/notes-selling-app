import React, { useEffect, useState } from 'react';
import { BookOpen, FolderOpen, ChevronRight, Loader2, ArrowRight, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react';
import { dbService } from '../lib/supabase';
import type { Note, UserProfile, Bundle } from '../lib/supabase';

interface MyLibraryProps {
  user: UserProfile | null;
  onReadNote: (note: Note) => void;
  navigate: (page: string) => void;
}

export const MyLibrary: React.FC<MyLibraryProps> = ({ user, onReadNote, navigate }) => {
  const [libraryNotes, setLibraryNotes] = useState<Note[]>([]);
  const [libraryBundles, setLibraryBundles] = useState<{ bundle: Bundle; expiresAt: string; daysLeft: number }[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [notesDetails, setNotesDetails] = useState<Record<string, { expiresAt: string | null; daysLeft: number | null }>>({});
  const [loading, setLoading] = useState(true);
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);

  const fetchLibraryData = async () => {
    if (!user) return;
    if (allNotes.length === 0 && libraryNotes.length === 0) {
      setLoading(true);
    }
    try {
      const [allNotesRes, notesRes, bundlesRes, purchaseState] = await Promise.all([
        dbService.getNotes(),
        dbService.getPurchasedNotes(),
        dbService.getPurchasedBundles(),
        dbService.getAllUserPurchasesState()
      ]);

      setAllNotes(allNotesRes.data || []);
      setLibraryNotes(notesRes.data || []);
      setLibraryBundles(bundlesRes.data || []);
      setNotesDetails(purchaseState.noteDetailsMap);
    } catch (err) {
      console.error('Error fetching library notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, [user]);

  if (!user) {
    return (
      <div className="container section-padding fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 28px', maxWidth: '360px', borderRadius: '20px' }}>
          <FolderOpen size={36} style={{ color: 'var(--color-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Sign in to continue</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', margin: '0 0 20px' }}>
            Your purchased notes will appear here.
          </p>
          <button className="btn-primary" onClick={() => navigate('auth')} style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show ALL purchased & unlocked notes directly in Notes & PYQ sections
  const studyNotes = libraryNotes.filter(n => n.type !== 'pyqs');
  const pyqs = libraryNotes.filter(n => n.type === 'pyqs');

  // Validity badge helper
  const ValidityBadge = ({ daysLeft }: { daysLeft: number | null }) => (
    <span style={{
      fontSize: '11px',
      fontWeight: '700',
      color: daysLeft !== null && daysLeft <= 30 ? '#f87171' : '#4ade80',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap'
    }}>
      <Clock size={11} />
      {daysLeft !== null ? (daysLeft > 365 ? '∞' : `${daysLeft}d`) : '180d'}
    </span>
  );

  // Reusable note row component
  const NoteRow = ({ note, icon, accentColor }: { note: Note; icon: React.ReactNode; accentColor: string }) => {
    const details = notesDetails[note.id];
    const daysLeft = details ? details.daysLeft : null;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 16px',
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          cursor: 'pointer',
          transition: 'background 0.15s ease'
        }}
        onClick={() => onReadNote(note)}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          flexShrink: 0
        }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {note.title}
          </h4>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
            {note.subject} · {note.pagesCount} pg
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <ValidityBadge daysLeft={daysLeft} />
          <ChevronRight size={16} style={{ color: 'var(--color-muted)' }} />
        </div>
      </div>
    );
  };

  // Section header helper
  const SectionHeader = ({ title, count, color }: { title: string; count: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </h3>
      <span style={{ fontSize: '12px', fontWeight: '700', color, opacity: 0.8 }}>
        {count}
      </span>
    </div>
  );

  const hasContent = libraryBundles.length > 0 || studyNotes.length > 0 || pyqs.length > 0;

  return (
    <div className="container section-padding fade-in" style={{ paddingBottom: '90px', maxWidth: '720px', margin: '0 auto' }}>
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Page Title — clean & minimal */}
      <div style={{ marginBottom: '28px', textAlign: 'left' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          My Library
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
          {hasContent
            ? `${libraryBundles.length + studyNotes.length + pyqs.length} items purchased`
            : 'Nothing here yet'
          }
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', gap: '10px', alignItems: 'center', color: 'var(--color-muted)' }}>
          <Loader2 className="animate-spin" size={22} color="var(--color-yellow)" />
          <span style={{ fontSize: '13px' }}>Loading...</span>
        </div>
      ) : !hasContent ? (
        /* Empty state — clean */
        <div className="glass-card" style={{ padding: '48px 24px', borderRadius: '20px', textAlign: 'center' }}>
          <FolderOpen size={40} style={{ color: 'var(--color-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>No purchases yet</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 }}>
            Your unlocked notes and combo packs will show up here after purchase.
          </p>
          <button className="btn-primary" onClick={() => navigate('dashboard')} style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
            Browse Catalog <ArrowRight size={16} style={{ marginLeft: '4px' }} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Combo Packs */}
          {libraryBundles.length > 0 && (
            <div>
              <SectionHeader title="Combo Packs" count={libraryBundles.length} color="var(--color-yellow)" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {libraryBundles.map(({ bundle, daysLeft }) => {
                  const isExpanded = expandedBundleId === bundle.id;

                  return (
                    <div
                      key={bundle.id}
                      className="glass-card"
                      style={{
                        borderRadius: '16px',
                        border: '1px solid rgba(251, 191, 36, 0.15)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Bundle header — tappable */}
                      <div
                        style={{
                          padding: '16px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedBundleId(isExpanded ? null : bundle.id)}
                      >
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'rgba(251,191,36,0.12)',
                          border: '1px solid rgba(251,191,36,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-yellow)',
                          flexShrink: 0
                        }}>
                          <FolderOpen size={20} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {bundle.title}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                            {bundle.notesIds.length} subjects · Sem {bundle.semester}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: daysLeft <= 30 ? '#f87171' : '#4ade80',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={11} />
                            {daysLeft > 365 ? '∞' : `${daysLeft}d`}
                          </span>
                          {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--color-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-muted)' }} />}
                        </div>
                      </div>

                      {/* Expanded subjects */}
                      {isExpanded && (
                        <div className="fade-in" style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          background: 'rgba(0,0,0,0.15)'
                        }}>
                          {bundle.notesIds.map(noteId => {
                            const noteItem = allNotes.find(n => n.id === noteId);
                            if (!noteItem) return null;

                            return (
                              <div
                                key={noteId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 12px',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease'
                                }}
                                onClick={() => onReadNote(noteItem)}
                              >
                                <BookOpen size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {noteItem.title}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
                                    {noteItem.pagesCount} pages
                                  </span>
                                </div>
                                <ChevronRight size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subject Notes */}
          {studyNotes.length > 0 && (
            <div>
              <SectionHeader title="Notes" count={studyNotes.length} color="#60a5fa" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {studyNotes.map(note => (
                  <NoteRow key={note.id} note={note} icon={<BookOpen size={18} />} accentColor="#60a5fa" />
                ))}
              </div>
            </div>
          )}

          {/* PYQs */}
          {pyqs.length > 0 && (
            <div>
              <SectionHeader title="Previous Year Papers" count={pyqs.length} color="#a78bfa" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pyqs.map(note => (
                  <NoteRow key={note.id} note={note} icon={<FileText size={18} />} accentColor="#a78bfa" />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
