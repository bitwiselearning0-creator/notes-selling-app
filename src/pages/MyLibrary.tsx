import React, { useEffect, useState } from 'react';
import { BookOpen, FolderOpen, ChevronRight, Loader2, ArrowRight, ChevronDown, ChevronUp, Key } from 'lucide-react';
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
    setLoading(true);
    try {
      const allNotesRes = await dbService.getNotes();
      setAllNotes(allNotesRes.data || []);

      const notesRes = await dbService.getPurchasedNotes();
      const bundlesRes = await dbService.getPurchasedBundles();
      
      const activeNotes = notesRes.data || [];
      setLibraryNotes(activeNotes);
      setLibraryBundles(bundlesRes.data || []);

      // Load specific license details for each note
      const detailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
      for (const note of activeNotes) {
        const details = await dbService.getPurchaseDetails(note.id);
        if (details.purchased) {
          detailsMap[note.id] = { expiresAt: details.expiresAt, daysLeft: details.daysLeft };
        }
      }
      setNotesDetails(detailsMap);
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

  // Filter notes that are purchased INDIVIDUALLY (not unlocked via a bundle)
  // to avoid cluttering the screen with duplicate entries
  const individualPurchasedNotes = libraryNotes.filter(note => {
    // Check if this note is part of any active purchased bundle
    const unlockedViaBundle = libraryBundles.some(({ bundle }) => bundle.notesIds.includes(note.id));
    return !unlockedViaBundle;
  });

  return (
    <div className="container section-padding fade-in" style={{ paddingBottom: '80px' }}>
      {/* Background blobs */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Premium Welcome Header Card */}
      <div className="glass-card welcome-dashboard-card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.45) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        textAlign: 'left',
        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Lock/Key icon with soft pulsing ring */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-yellow)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          flexShrink: 0,
          boxShadow: '0 0 15px rgba(251, 191, 36, 0.1)'
        }}>
          <Key size={28} />
        </div>

        {/* Welcome Text */}
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Academic Locker
            </span>
            <span style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '100px',
              padding: '2px 8px',
              fontSize: '10px',
              color: 'var(--color-yellow)',
              fontWeight: '700',
              letterSpacing: '0.02em'
            }}>
              VERIFIED
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '6px 0 2px 0', letterSpacing: '-0.01em' }}>
            {user ? `${user.name.split(' ')[0]}'s` : 'My'} Study Locker Room 🔑
          </h2>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '13px', lineHeight: '1.4' }}>
            Your unlocked premium exam notes and 6-month combo reference materials.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', gap: '10px', alignItems: 'center', color: 'var(--color-muted)' }}>
          <Loader2 className="animate-spin" size={24} color="var(--color-blue-light)" />
          <span>Opening locker...</span>
        </div>
      ) : (
        <>
          {/* Bundles Section */}
          {libraryBundles.length > 0 && (
            <div style={{ maxWidth: '800px', margin: '0 auto 40px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="yellow-accent">
                Unlocked Semester Combo Packs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {libraryBundles.map(({ bundle, daysLeft }) => {
                  const isExpanded = expandedBundleId === bundle.id;

                  return (
                    <div key={bundle.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 350px' }}>
                          <div style={{ background: 'rgba(251,191,36,0.1)', padding: '12px', borderRadius: '10px', color: 'var(--color-yellow)', flexShrink: 0 }}>
                            <FolderOpen size={24} />
                          </div>
                          <div>
                            <span className="semester-tag" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                              Semester {bundle.semester} Combo • {bundle.year}
                            </span>
                            <h4 style={{ fontSize: '17px', marginTop: '2px', color: 'var(--color-white)', fontWeight: '700' }}>{bundle.title}</h4>
                            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
                              Combo folder containing {bundle.notesIds.length} syllabus note files.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
                          <div style={{ textAlign: 'right', fontSize: '12px' }}>
                            <div style={{ color: 'var(--color-muted)' }}>License Validity</div>
                            <div style={{ color: 'var(--color-yellow)', fontWeight: '700' }}>
                              {daysLeft > 365 ? 'Lifetime Admin' : `${daysLeft} Days Left`}
                            </div>
                          </div>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }} 
                            onClick={() => setExpandedBundleId(isExpanded ? null : bundle.id)}
                          >
                            {isExpanded ? (
                              <>Collapse Folder <ChevronUp size={16} /></>
                            ) : (
                              <>Explore Subjects <ChevronDown size={16} /></>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible subjects drawer */}
                      {isExpanded && (
                        <div className="fade-in" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Choose Subject Notes to Read:
                          </div>
                          {bundle.notesIds.map(noteId => {
                            const noteItem = allNotes.find(n => n.id === noteId);
                            if (!noteItem) return null;

                            return (
                              <div key={noteId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px 18px', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                                  <div style={{ background: 'rgba(37,99,235,0.08)', padding: '8px', borderRadius: '8px', color: 'var(--color-blue-light)' }}>
                                    <BookOpen size={16} />
                                  </div>
                                  <div>
                                    <h5 style={{ fontSize: '14px', color: 'var(--color-white)', fontWeight: '600' }}>{noteItem.title}</h5>
                                    <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Subject: {noteItem.subject} • {noteItem.pagesCount} Pages</span>
                                  </div>
                                </div>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '8px 18px', fontSize: '13px' }} 
                                  onClick={() => onReadNote(noteItem)}
                                >
                                  Open Reader
                                </button>
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

          {/* Notes Section */}
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="blue-accent">
              Unlocked Subject Notes
            </h3>
            
            {individualPurchasedNotes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {individualPurchasedNotes.map(note => {
                  const details = notesDetails[note.id];
                  const daysLeft = details ? details.daysLeft : null;

                  return (
                    <div key={note.id} className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 350px' }}>
                        <div style={{ background: 'rgba(37,99,235,0.1)', padding: '12px', borderRadius: '10px', color: 'var(--color-blue-light)', flexShrink: 0 }}>
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <span className="semester-tag" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                            Semester {note.semester} • {note.year}
                          </span>
                          <h3 style={{ fontSize: '17px', marginTop: '2px', color: 'var(--color-white)', fontWeight: '700' }}>{note.title}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <span>Subject: <strong>{note.subject}</strong></span>
                            <span>•</span>
                            <span>{note.pagesCount} Pages</span>
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
                        <div style={{ textAlign: 'right', fontSize: '12px' }}>
                          <div style={{ color: 'var(--color-muted)' }}>License Validity</div>
                          <div style={{ color: 'var(--color-yellow)', fontWeight: '700' }}>
                            {daysLeft !== null ? (
                              daysLeft > 365 ? 'Lifetime Admin' : `${daysLeft} Days Left`
                            ) : '6 Months'}
                          </div>
                        </div>
                        <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={() => onReadNote(note)}>
                          Open PDF Reader <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              libraryBundles.length === 0 && (
                <div className="empty-state glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '50px 30px' }}>
                  <FolderOpen size={48} className="blue-accent" style={{ margin: '0 auto 16px' }} />
                  <h3>Your Library is Empty</h3>
                  <p style={{ color: 'var(--color-muted)', fontSize: '14px', margin: '8px 0 20px' }}>
                    You haven't unlocked any study resources yet. Browse the catalog to get started.
                  </p>
                  <button className="btn-primary" onClick={() => navigate('dashboard')}>
                    Browse Catalog <ArrowRight size={16} />
                  </button>
                </div>
              )
            )}
            
            {libraryBundles.length > 0 && individualPurchasedNotes.length === 0 && (
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                No extra individual subject notes purchased. Check your active combo packs folder above!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
