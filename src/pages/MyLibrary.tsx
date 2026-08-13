import React, { useEffect, useState } from 'react';
import { BookOpen, FolderOpen, ChevronRight, ArrowRight, ChevronDown, ChevronUp, Clock, FileText } from 'lucide-react';
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

    // 0ms Synchronous local cache hydration for instant offline loading!
    const cachedCatalog = localStorage.getItem('bw_cached_notes_catalog') ? JSON.parse(localStorage.getItem('bw_cached_notes_catalog')!) : [];
    const cachedPurchases = localStorage.getItem(`bw_user_purchases_cache_${user.id}`) ? JSON.parse(localStorage.getItem(`bw_user_purchases_cache_${user.id}`)!) : [];
    
    // Hydrate state from cache synchronously ONLY IF both catalog and purchases are available
    let hasCachedContent = false;
    if (cachedCatalog.length > 0 && cachedPurchases.length > 0) {
      const purchasedSet = new Set<string>(cachedPurchases.map((p: any) => p.note_id || p.id));
      const unlockedFromCache = cachedCatalog.filter((n: Note) => purchasedSet.has(n.id));
      if (unlockedFromCache.length > 0) {
        setAllNotes(cachedCatalog);
        setLibraryNotes(unlockedFromCache);
        hasCachedContent = true;
      }
    }

    if (hasCachedContent) {
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [allNotesRes, notesRes, bundlesRes, purchaseState] = await Promise.all([
        dbService.getNotes(),
        dbService.getPurchasedNotes(),
        dbService.getPurchasedBundles(),
        dbService.getAllUserPurchasesState()
      ]);

      const fullCatalog = allNotesRes.data || [];
      setAllNotes(fullCatalog);

      const purchasedSet = new Set<string>([
        ...(notesRes.data || []).map(n => n.id),
        ...purchaseState.purchasedNoteIds
      ]);

      const unlockedNotesList = fullCatalog.filter(n => purchasedSet.has(n.id));
      setLibraryNotes(unlockedNotesList.length > 0 ? unlockedNotesList : (notesRes.data || []));
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
        <div className="auth-card glass-card" style={{ textAlign: 'center', padding: '30px' }}>
          <FolderOpen size={48} className="yellow-accent" style={{ margin: '0 auto 16px' }} />
          <h3>Access Denied</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', margin: '8px 0 20px' }}>
            Please sign in to view your personal notes library.
          </p>
          <button className="btn-primary" onClick={() => navigate('auth')}>
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  // Display all purchased & unlocked study notes and PYQs
  const studyNotes = libraryNotes.filter(n => n.type !== 'pyqs');
  const pyqs = libraryNotes.filter(n => n.type === 'pyqs');

  // Helper to resolve all subject notes belonging to a bundle
  const getBundleSubjectNotes = (bundle: Bundle): Note[] => {
    const subjects = Array.isArray(bundle.subjects) && bundle.subjects.length > 0 ? bundle.subjects : [];

    // 1. If admin set explicit included subjects, display EVERY SINGLE included subject (no extra, no missing!)
    if (subjects.length > 0) {
      const resultNotes: Note[] = [];
      
      subjects.forEach((subjectName, idx) => {
        const matchingNotes = allNotes.filter(n =>
          n.subject.toLowerCase() === subjectName.toLowerCase() &&
          (n.semester === bundle.semester || !n.semester)
        );

        if (matchingNotes.length > 0) {
          resultNotes.push(...matchingNotes);
        } else {
          // If no note object uploaded in catalog yet, provide subject note card so ALL included subjects appear
          resultNotes.push({
            id: `bundle_sub_${bundle.id}_${idx}`,
            title: `${subjectName} - Complete Unit 1-5 Notes & PYQs`,
            subject: subjectName,
            year: (bundle.year as any) || '2nd Year',
            semester: bundle.semester || 4,
            price: 0,
            originalPrice: 0,
            description: `Complete syllabus notes, important questions & solved papers for ${subjectName}. Included in ${bundle.title}.`,
            previewUrl: 'https://cdn.jsdelivr.net/gh/mozilla/pdf.js@master/web/compressed.tracemonkey-pldi-09.pdf',
            pagesCount: 80,
            topics: ['Complete Syllabus Unit 1-5', 'Important Exam Questions', 'AKTU Solved Papers'],
            type: 'notes'
          });
        }
      });

      return resultNotes;
    }

    // 2. Fallback if no subjects array: match by notesIds
    if (Array.isArray(bundle.notesIds) && bundle.notesIds.length > 0) {
      const matchedById = bundle.notesIds
        .map(id => allNotes.find(n => n.id === id))
        .filter((n): n is Note => Boolean(n));
      if (matchedById.length > 0) return matchedById;
    }

    // 3. Fallback: notes matching bundle semester
    const semNotes = allNotes.filter(n => n.semester === bundle.semester);
    return semNotes;
  };

  return (
    <div className="container section-padding fade-in" style={{ paddingBottom: '90px', maxWidth: '720px', margin: '0 auto' }}>
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div style={{ marginBottom: '28px', textAlign: 'left' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          My Library
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
          {loading
            ? 'Loading your purchased notes...'
            : libraryBundles.length + studyNotes.length + pyqs.length > 0
              ? `${libraryBundles.length + studyNotes.length + pyqs.length} items purchased`
              : 'Nothing here yet'
          }
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div className="skeleton-box" style={{ width: '120px', height: '14px', borderRadius: '6px' }}></div>
            <div className="skeleton-box" style={{ width: '30px', height: '14px', borderRadius: '6px' }}></div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-box" style={{ width: '65%', height: '16px', borderRadius: '6px' }}></div>
                <div className="skeleton-box" style={{ width: '40%', height: '12px', borderRadius: '4px' }}></div>
              </div>
              <div className="skeleton-box" style={{ width: '48px', height: '20px', borderRadius: '100px', flexShrink: 0 }}></div>
            </div>
          ))}
        </div>
      ) : (libraryBundles.length === 0 && studyNotes.length === 0 && pyqs.length === 0) ? (
        <div className="glass-card fade-in" style={{ padding: '48px 24px', borderRadius: '20px', textAlign: 'center' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Combo Packs
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-yellow)', opacity: 0.8 }}>
                  {libraryBundles.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {libraryBundles.map(({ bundle, daysLeft }) => {
                  const isExpanded = expandedBundleId === bundle.id;
                  const bundleItems = getBundleSubjectNotes(bundle);

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

                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {bundle.title}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                            {bundleItems.length} subjects · Sem {bundle.semester}
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
                          background: 'rgba(0,0,0,0.15)',
                          textAlign: 'left'
                        }}>
                          {bundleItems.map(noteItem => (
                            <div
                              key={noteItem.id}
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
                                  {noteItem.pagesCount} pages · {noteItem.subject}
                                </span>
                              </div>
                              <ChevronRight size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                            </div>
                          ))}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Notes
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', opacity: 0.8 }}>
                  {studyNotes.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {studyNotes.map(note => {
                  const details = notesDetails[note.id];
                  const daysLeft = details ? details.daysLeft : null;

                  return (
                    <div
                      key={note.id}
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
                        background: 'rgba(96, 165, 250, 0.15)',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa',
                        flexShrink: 0
                      }}>
                        <BookOpen size={18} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {note.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {note.subject} · {note.pagesCount} pg
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: daysLeft !== null && daysLeft <= 30 ? '#f87171' : '#4ade80',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={11} />
                          {daysLeft !== null ? (daysLeft > 365 ? '∞' : `${daysLeft}d`) : '180d'}
                        </span>
                        <ChevronRight size={16} style={{ color: 'var(--color-muted)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PYQs */}
          {pyqs.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Previous Year Papers
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#a78bfa', opacity: 0.8 }}>
                  {pyqs.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pyqs.map(note => {
                  const details = notesDetails[note.id];
                  const daysLeft = details ? details.daysLeft : null;

                  return (
                    <div
                      key={note.id}
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
                        background: 'rgba(167, 139, 250, 0.15)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a78bfa',
                        flexShrink: 0
                      }}>
                        <FileText size={18} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {note.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {note.subject} · {note.pagesCount} pg
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: daysLeft !== null && daysLeft <= 30 ? '#f87171' : '#4ade80',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={11} />
                          {daysLeft !== null ? (daysLeft > 365 ? '∞' : `${daysLeft}d`) : '180d'}
                        </span>
                        <ChevronRight size={16} style={{ color: 'var(--color-muted)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
