import React, { useEffect, useState } from 'react';
import { BookOpen, FolderOpen, ChevronRight, Loader2, ArrowRight, ChevronDown, ChevronUp, Key, Sparkles, FileText, Clock } from 'lucide-react';
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
        <div className="auth-card glass-card" style={{ textAlign: 'center', padding: '36px 28px', maxWidth: '420px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--color-yellow)' }}>
            <Key size={32} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Locker Access Required</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 }}>
            Please sign in to access your personal study locker and view your unlocked notes & combo packs.
          </p>
          <button className="btn-primary" onClick={() => navigate('auth')} style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
            Sign In Now <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </button>
        </div>
      </div>
    );
  }

  // Filter notes that are purchased INDIVIDUALLY (not unlocked via a bundle)
  const individualPurchasedNotes = libraryNotes.filter(note => {
    const unlockedViaBundle = libraryBundles.some(({ bundle }) => bundle.notesIds.includes(note.id));
    return !unlockedViaBundle;
  });

  const studyNotes = individualPurchasedNotes.filter(n => n.type !== 'pyqs');
  const pyqs = individualPurchasedNotes.filter(n => n.type === 'pyqs');

  // Total items unlocked calculation
  let totalUnlockedNotesCount = individualPurchasedNotes.length;
  libraryBundles.forEach(({ bundle }) => {
    totalUnlockedNotesCount += (bundle.notesIds || []).length;
  });

  return (
    <div className="container section-padding fade-in" style={{ paddingBottom: '90px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Liquid Ambient Background */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.65) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '24px 28px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '160px',
          height: '160px',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Key Icon Badge */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(217, 119, 6, 0.08) 100%)',
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-yellow)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.15)'
          }}>
            <Key size={30} />
          </div>

          <div style={{ flex: '1 1 240px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-yellow)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ✦ Personal Locker Room
              </span>
              <span style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '100px',
                padding: '2px 8px',
                fontSize: '10px',
                color: '#4ade80',
                fontWeight: '700'
              }}>
                SECURED ACCESS
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              {user ? `${user.name.split(' ')[0]}'s` : 'My'} Unlocked Materials
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-muted)', fontSize: '13px', lineHeight: 1.4 }}>
              Instant offline reading access for all your purchased semester packages and subject notes.
            </p>
          </div>
        </div>

        {/* Quick Stats Summary Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Combo Packs</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-yellow)', marginTop: '2px' }}>{libraryBundles.length}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Subject Notes</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#60a5fa', marginTop: '2px' }}>{studyNotes.length}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '700', textTransform: 'uppercase' }}>PYQ Papers</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#a78bfa', marginTop: '2px' }}>{pyqs.length}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Unlocked</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#4ade80', marginTop: '2px' }}>{totalUnlockedNotesCount} Files</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', gap: '12px', alignItems: 'center', color: 'var(--color-muted)' }}>
          <Loader2 className="animate-spin" size={24} color="var(--color-yellow)" />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Unlocking study locker room...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Section 1: Semester Combo Packs */}
          {libraryBundles.length > 0 && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(251, 191, 36, 0.12)', padding: '8px', borderRadius: '10px', color: 'var(--color-yellow)' }}>
                    <FolderOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                      Unlocked Semester Combo Packs
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>
                      Full semester bundles including all subject notes
                    </span>
                  </div>
                </div>
                <span style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--color-yellow)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>
                  {libraryBundles.length} PACKS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {libraryBundles.map(({ bundle, daysLeft }) => {
                  const isExpanded = expandedBundleId === bundle.id;

                  return (
                    <div 
                      key={bundle.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '20px', 
                        borderRadius: '20px', 
                        border: '1px solid rgba(251, 191, 36, 0.25)', 
                        background: 'linear-gradient(145deg, rgba(20, 30, 60, 0.7), rgba(10, 16, 38, 0.9))',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                          <div style={{ 
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.05) 100%)', 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '14px', 
                            border: '1px solid rgba(251,191,36,0.3)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'var(--color-yellow)', 
                            flexShrink: 0 
                          }}>
                            <FolderOpen size={22} />
                          </div>
                          
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(251,191,36,0.12)', color: 'var(--color-yellow)', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                                Sem {bundle.semester} • {bundle.year}
                              </span>
                              <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700' }}>
                                ✓ Unlocked
                              </span>
                            </div>
                            <h4 style={{ fontSize: '16px', marginTop: '4px', color: '#fff', fontWeight: '800', margin: '4px 0 2px' }}>
                              {bundle.title}
                            </h4>
                            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                              Includes {bundle.notesIds.length} complete subject note files
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'right', fontSize: '12px' }}>
                            <div style={{ color: 'var(--color-muted)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Validity</div>
                            <div style={{ color: 'var(--color-yellow)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              {daysLeft > 365 ? 'Lifetime Admin' : `${daysLeft} Days Left`}
                            </div>
                          </div>

                          <button 
                            className="btn-primary" 
                            style={{ 
                              padding: '10px 18px', 
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: '700',
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              boxShadow: '0 4px 15px rgba(251, 191, 36, 0.25)'
                            }} 
                            onClick={() => setExpandedBundleId(isExpanded ? null : bundle.id)}
                          >
                            {isExpanded ? (
                              <>Hide Folder <ChevronUp size={16} /></>
                            ) : (
                              <>Explore Subjects <ChevronDown size={16} /></>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible subjects drawer */}
                      {isExpanded && (
                        <div className="fade-in" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-yellow)', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={13} /> Select Subject Note to Read:
                          </div>

                          {bundle.notesIds.map(noteId => {
                            const noteItem = allNotes.find(n => n.id === noteId);
                            if (!noteItem) return null;

                            return (
                              <div 
                                key={noteId} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  background: 'rgba(255, 255, 255, 0.03)', 
                                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                                  borderRadius: '14px', 
                                  padding: '12px 16px', 
                                  gap: '12px', 
                                  flexWrap: 'wrap',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', flex: '1 1 200px' }}>
                                  <div style={{ background: 'rgba(37,99,235,0.15)', padding: '8px', borderRadius: '10px', color: '#60a5fa', flexShrink: 0 }}>
                                    <BookOpen size={18} />
                                  </div>
                                  <div>
                                    <h5 style={{ fontSize: '14px', color: '#fff', fontWeight: '700', margin: 0 }}>{noteItem.title}</h5>
                                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{noteItem.subject} • {noteItem.pagesCount} Pages</span>
                                  </div>
                                </div>

                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '700', borderRadius: '10px' }} 
                                  onClick={() => onReadNote(noteItem)}
                                >
                                  Open PDF Reader <ChevronRight size={14} style={{ marginLeft: '4px' }} />
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

          {/* Section 2: Unlocked Subject Notes */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.12)', padding: '8px', borderRadius: '10px', color: '#60a5fa' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                    Unlocked Subject Notes
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>
                    Individual full syllabus units and study guides
                  </span>
                </div>
              </div>
              <span style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>
                {studyNotes.length} NOTES
              </span>
            </div>
            
            {studyNotes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {studyNotes.map(note => {
                  const details = notesDetails[note.id];
                  const daysLeft = details ? details.daysLeft : null;

                  return (
                    <div 
                      key={note.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '18px 22px', 
                        borderRadius: '18px', 
                        border: '1px solid rgba(59, 130, 246, 0.2)', 
                        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(10, 16, 38, 0.85))',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        flexWrap: 'wrap', 
                        gap: '16px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
                        <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(29,78,216,0.05) 100%)', width: '44px', height: '44px', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
                          <BookOpen size={20} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(37,99,235,0.12)', color: '#60a5fa', padding: '2px 7px', borderRadius: '6px', textTransform: 'uppercase' }}>
                              Sem {note.semester} • {note.year}
                            </span>
                            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700' }}>
                              ✓ Unlocked
                            </span>
                          </div>
                          <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: '800', margin: '4px 0 2px' }}>{note.title}</h4>
                          <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                            Subject: <strong style={{ color: 'var(--color-white)' }}>{note.subject}</strong> • {note.pagesCount} Pages
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right', fontSize: '12px' }}>
                          <div style={{ color: 'var(--color-muted)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Validity</div>
                          <div style={{ color: 'var(--color-yellow)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {daysLeft !== null ? (
                              daysLeft > 365 ? 'Lifetime Admin' : `${daysLeft} Days Left`
                            ) : '6 Months'}
                          </div>
                        </div>

                        <button 
                          className="btn-primary" 
                          style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 15px rgba(37,99,235,0.25)' }} 
                          onClick={() => onReadNote(note)}
                        >
                          Open PDF Reader <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state glass-card" style={{ padding: '24px 20px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '600' }}>
                  No individual subject study notes unlocked yet.
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Exam PYQs Section */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(167, 139, 250, 0.12)', padding: '8px', borderRadius: '10px', color: '#a78bfa' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                    Unlocked Previous Year Questions (PYQs)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>
                    AKTU solved question papers and exam solutions
                  </span>
                </div>
              </div>
              <span style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.25)', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>
                {pyqs.length} PAPERS
              </span>
            </div>
            
            {pyqs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pyqs.map(note => {
                  const details = notesDetails[note.id];
                  const daysLeft = details ? details.daysLeft : null;

                  return (
                    <div 
                      key={note.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '18px 22px', 
                        borderRadius: '18px', 
                        border: '1px solid rgba(167, 139, 250, 0.25)', 
                        background: 'linear-gradient(145deg, rgba(25, 20, 50, 0.7), rgba(10, 16, 38, 0.85))',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        flexWrap: 'wrap', 
                        gap: '16px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
                        <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(139,92,246,0.05) 100%)', width: '44px', height: '44px', borderRadius: '12px', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
                          <FileText size={20} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(167,139,250,0.12)', color: '#a78bfa', padding: '2px 7px', borderRadius: '6px', textTransform: 'uppercase' }}>
                              PYQ Solved • Sem {note.semester}
                            </span>
                            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700' }}>
                              ✓ Unlocked
                            </span>
                          </div>
                          <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: '800', margin: '4px 0 2px' }}>{note.title}</h4>
                          <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                            Subject: <strong style={{ color: 'var(--color-white)' }}>{note.subject}</strong> • {note.pagesCount} Pages
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right', fontSize: '12px' }}>
                          <div style={{ color: 'var(--color-muted)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Validity</div>
                          <div style={{ color: 'var(--color-yellow)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {daysLeft !== null ? (
                              daysLeft > 365 ? 'Lifetime Admin' : `${daysLeft} Days Left`
                            ) : '6 Months'}
                          </div>
                        </div>

                        <button 
                          className="btn-primary" 
                          style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 15px rgba(167,139,250,0.25)' }} 
                          onClick={() => onReadNote(note)}
                        >
                          Open PDF Reader <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state glass-card" style={{ padding: '24px 20px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '600' }}>
                  No exam PYQ papers unlocked yet.
                </span>
              </div>
            )}
          </div>

          {/* Empty Locker State when 0 items unlocked */}
          {libraryBundles.length === 0 && studyNotes.length === 0 && pyqs.length === 0 && (
            <div className="empty-state glass-card" style={{ maxWidth: '520px', margin: '20px auto 0 auto', padding: '40px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#60a5fa' }}>
                <FolderOpen size={30} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                Your Study Locker is Empty
              </h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 }}>
                You haven't unlocked any engineering study guides or combo packs yet. Browse our catalog to get started.
              </p>
              <button className="btn-primary" onClick={() => navigate('dashboard')} style={{ margin: '0 auto', padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
                Browse Notes Catalog <ArrowRight size={16} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
