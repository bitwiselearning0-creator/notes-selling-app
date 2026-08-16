import React, { useEffect, useState } from 'react';
import { BookOpen, FolderOpen, ChevronRight, ArrowRight, ArrowLeft, Clock, FileText } from 'lucide-react';
import { dbService, deriveBundleType, isNotePdfAvailable, isSameSubject, getStoredData } from '../lib/dbService';
import type { Note, UserProfile, Bundle } from '../lib/dbService';

interface MyLibraryProps {
  user: UserProfile | null;
  onReadNote: (note: Note) => void;
  navigate: (page: string) => void;
}

type LibraryView =
  | { mode: 'HUB' }
  | { mode: 'CATEGORY'; category: 'semester' | 'subject' | 'individual' }
  | { mode: 'PACK_DETAIL'; bundle: Bundle; daysLeft: number | null; originCategory: 'semester' | 'subject' };



export const MyLibrary: React.FC<MyLibraryProps> = ({ user, onReadNote, navigate }) => {
  const [libraryNotes, setLibraryNotes] = useState<Note[]>([]);
  const [libraryBundles, setLibraryBundles] = useState<{ bundle: Bundle; expiresAt: string; daysLeft: number }[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [notesDetails, setNotesDetails] = useState<Record<string, { expiresAt: string | null; daysLeft: number | null }>>({});
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<LibraryView>({ mode: 'HUB' });

  // URL Hash Synchronizer for seamless Browser & Native Back Button support in MyLibrary
  useEffect(() => {
    const syncLibraryHashState = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#library')) return;

      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const catParam = params.get('cat') as 'semester' | 'subject' | 'individual' | null;
      const packParam = params.get('pack');
      const subjectParam = params.get('subject');

      if (packParam && subjectParam) {
        const item = libraryBundles.find(b => b.bundle.id === packParam);
        setViewState({
          mode: 'PACK_DETAIL',
          bundle: item ? item.bundle : ({ id: packParam, title: 'Unlocked Pack' } as any),
          daysLeft: item ? item.daysLeft : null,
          originCategory: (catParam as 'semester' | 'subject') || 'semester'
        });
        return;
      }

      if (packParam) {
        const item = libraryBundles.find(b => b.bundle.id === packParam);
        setViewState({
          mode: 'PACK_DETAIL',
          bundle: item ? item.bundle : ({ id: packParam, title: 'Unlocked Pack' } as any),
          daysLeft: item ? item.daysLeft : null,
          originCategory: (catParam as 'semester' | 'subject') || 'semester'
        });
        return;
      }

      if (catParam) {
        setViewState({ mode: 'CATEGORY', category: catParam });
        return;
      }

      setViewState({ mode: 'HUB' });
    };

    syncLibraryHashState();
    window.addEventListener('popstate', syncLibraryHashState);
    window.addEventListener('hashchange', syncLibraryHashState);
    return () => {
      window.removeEventListener('popstate', syncLibraryHashState);
      window.removeEventListener('hashchange', syncLibraryHashState);
    };
  }, [libraryBundles]);

  const fetchLibraryData = async (isBackground = false) => {
    if (!user) return;

    // 1. Instant 0ms cache population if available
    const deletedIds = new Set(getStoredData<string[]>('bw_deleted_notes', []));
    const cachedNotes = getStoredData<Note[]>('bw_cached_notes', []).filter(n => !deletedIds.has(n.id));
    if (cachedNotes.length > 0 && allNotes.length === 0) {
      setAllNotes(cachedNotes);
    }

    if (!isBackground && libraryBundles.length === 0 && libraryNotes.length === 0) {
      setLoading(true);
    }

    try {
      // Single consolidated parallel fetch (NO duplicate inner API calls)
      const [allNotesRes, purchaseState, bundlesRes] = await Promise.all([
        dbService.getNotes(),
        dbService.getAllUserPurchasesState(),
        dbService.getBundles()
      ]);

      const fullCatalog = allNotesRes.data || [];
      setAllNotes(fullCatalog);

      const explicitSet = new Set<string>(purchaseState.explicitlyPurchasedNoteIds || []);

      const unlockedNotesList: Note[] = [];
      const addedNoteIds = new Set<string>();

      // 1. Catalog matches (ONLY explicitly purchased individual notes)
      fullCatalog.forEach(n => {
        if (explicitSet.has(n.id)) {
          unlockedNotesList.push(n);
          addedNoteIds.add(n.id);
        }
      });

      // 2. Synthesize missing individual notes so they ALWAYS appear under Individual Notes section
      (purchaseState.explicitlyPurchasedNoteIds || []).forEach(id => {
        if (!addedNoteIds.has(id) && !id.startsWith('bundle_') && !id.startsWith('sem_')) {
          const rawParts = id.replace(/^note_/, '').split('_');
          const subjectPart = rawParts[0] ? (rawParts[0].toUpperCase()) : 'STUDY';
          const unitPart = rawParts[1] ? (rawParts[1].toUpperCase()) : 'NOTE';
          const formattedTitle = `${subjectPart} ${unitPart} Notes`;

          unlockedNotesList.push({
            id: id,
            title: formattedTitle,
            subject: subjectPart,
            year: '2nd Year',
            semester: 4,
            price: 49,
            originalPrice: 99,
            description: `Individual study note (${formattedTitle}).`,
            previewUrl: '',
            pagesCount: 45,
            topics: ['Unit Notes', 'Important Concepts'],
            type: 'notes'
          });
          addedNoteIds.add(id);
        }
      });

      setLibraryNotes(unlockedNotesList);

      const purchasedBundlesRes = await dbService.getPurchasedBundles(bundlesRes.data || [], purchaseState);
      const purchasedBundleSet = new Set<string>(purchaseState.purchasedBundleIds);
      const validBundles = (purchasedBundlesRes.data || []).filter(b => purchasedBundleSet.has(b.bundle.id));

      setLibraryBundles(validBundles);
      setNotesDetails(purchaseState.noteDetailsMap);
    } catch (err) {
      console.error('Error fetching library notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData(false);

    const handleFocus = () => {
      fetchLibraryData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLibraryData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('bw_purchases_updated', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('bw_purchases_updated', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  // Separate Semester Combo Packs vs Subject Packs
  const semesterComboPacks = libraryBundles.filter(({ bundle }) =>
    deriveBundleType(bundle) === 'semester'
  );

  const subjectPacks = libraryBundles.filter(({ bundle }) =>
    deriveBundleType(bundle) === 'subject'
  );

  // Display all purchased & unlocked study notes and PYQs
  const studyNotes = libraryNotes.filter(n => n.type !== 'pyqs');
  const pyqs = libraryNotes.filter(n => n.type === 'pyqs');

  // Helper to resolve all subject notes belonging to a bundle with strict subject scoping
  const getBundleSubjectNotes = (bundle: Bundle): Note[] => {
    const isSubjectPack = deriveBundleType(bundle) === 'subject';
    const notesMap = new Map<string, Note>();

    if (isSubjectPack) {
      // FOR SUBJECT PACK: ONLY match notes of THIS specific subject!
      const targetSubject = bundle.subject || bundle.title;

      // A) Match notes in catalog by subject name using isSameSubject
      const matchingNotes = allNotes.filter(n =>
        n.subject && isSameSubject(n.subject, targetSubject)
      );

      if (matchingNotes.length > 0) {
        matchingNotes.forEach(mn => notesMap.set(mn.id, mn));
      }

      // B) Match notes explicitly in bundle.notesIds array
      if (Array.isArray(bundle.notesIds) && bundle.notesIds.length > 0) {
        bundle.notesIds.forEach(id => {
          const found = allNotes.find(n => n.id === id);
          if (found) notesMap.set(found.id, found);
        });
      }

      // C) If still 0 matching uploaded notes for this subject, create 1 clean synthesized master note for this subject
      if (notesMap.size === 0) {
        const cleanSubName = (bundle.subject || bundle.title)
          .replace(/\s*complete\s*subject\s*pack.*/i, '')
          .replace(/\s*master\s*notes.*/i, '')
          .trim();

        const synthId = `bundle_sub_${bundle.id}`;
        notesMap.set(synthId, {
          id: synthId,
          title: `${cleanSubName} - Complete Unit 1-5 Master Notes`,
          subject: cleanSubName,
          year: (bundle.year as any) || '2nd Year',
          semester: bundle.semester || 4,
          price: 0,
          originalPrice: 0,
          description: `Complete syllabus notes & solved papers for ${cleanSubName}. Included in ${bundle.title}.`,
          previewUrl: '',
          pagesCount: 80,
          topics: ['Complete Syllabus Unit 1-5', 'Important Exam Questions', 'AKTU Solved Papers'],
          type: 'notes'
        });
      }

      return Array.from(notesMap.values());
    }

    // FOR SEMESTER COMBO PACK:
    const subjects = Array.isArray(bundle.subjects) && bundle.subjects.length > 0 ? bundle.subjects : [];

    // 1. Match by explicit subjects list inside semester bundle
    if (subjects.length > 0) {
      subjects.forEach((subjectName, idx) => {
        const matchingNotes = allNotes.filter(n =>
          n.subject && isSameSubject(n.subject, subjectName)
        );

        if (matchingNotes.length > 0) {
          matchingNotes.forEach(mn => notesMap.set(mn.id, mn));
        } else {
          const synthId = `bundle_sub_${bundle.id}_${idx}`;
          notesMap.set(synthId, {
            id: synthId,
            title: `${subjectName} - Complete Unit 1-5 Notes & PYQs`,
            subject: subjectName,
            year: (bundle.year as any) || '2nd Year',
            semester: bundle.semester || 4,
            price: 0,
            originalPrice: 0,
            description: `Complete syllabus notes for ${subjectName}. Included in ${bundle.title}.`,
            previewUrl: '',
            pagesCount: 80,
            topics: ['Complete Syllabus Unit 1-5', 'Important Exam Questions', 'AKTU Solved Papers'],
            type: 'notes'
          });
        }
      });
    }

    // 2. Match notes explicitly in bundle.notesIds array
    if (Array.isArray(bundle.notesIds) && bundle.notesIds.length > 0) {
      bundle.notesIds.forEach(id => {
        const found = allNotes.find(n => n.id === id);
        if (found) notesMap.set(found.id, found);
      });
    }

    // 3. Match notes by semester only if subjects array is empty
    if (notesMap.size === 0 && bundle.semester) {
      const semNotes = allNotes.filter(n => n.semester === bundle.semester);
      semNotes.forEach(sn => notesMap.set(sn.id, sn));
    }

    return Array.from(notesMap.values());
  };

  // =========================================================================
  // VIEW MODE 3: INSIDE PACK RESOURCE CONTENT VIEW
  // =========================================================================
  if (viewState.mode === 'PACK_DETAIL') {
    const { bundle, daysLeft, originCategory } = viewState;
    const bundleItems = getBundleSubjectNotes(bundle);
    const isSemCombo = originCategory === 'semester';

    const themeColor = isSemCombo ? 'var(--color-yellow)' : '#a78bfa';
    const themeBg = isSemCombo ? 'rgba(251, 191, 36, 0.12)' : 'rgba(167, 139, 250, 0.12)';
    const themeBorder = isSemCombo ? 'rgba(251, 191, 36, 0.3)' : 'rgba(167, 139, 250, 0.3)';

    return (
      <div className="container section-padding fade-in" style={{ paddingBottom: '90px', maxWidth: '1040px', margin: '0 auto' }}>
        {/* Top Back Navigation Button */}
        <button
          className="library-back-btn"
          onClick={() => {
            if (window.history.length > 1 && window.location.hash.includes('?')) {
              window.history.back();
            } else {
              setViewState({ mode: 'CATEGORY', category: originCategory });
              window.location.hash = `#library?cat=${originCategory}`;
            }
          }}
        >
          <ArrowLeft size={16} /> Back to {isSemCombo ? 'Semester Packs' : 'Subject Packs'}
        </button>

        {/* Hero Pack Header Card */}
        <div 
          className="glass-card unlocked-bundle-banner fade-in"
          style={{
            borderRadius: '20px',
            border: `1px solid ${themeBorder}`,
            padding: '24px',
            marginBottom: '28px',
            position: 'relative',
            overflow: 'hidden',
            background: `radial-gradient(circle at 0% 0%, ${themeBg} 0%, rgba(15, 23, 42, 0.95) 100%)`,
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div className="bundle-icon-box" style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: themeBg,
              border: `1px solid ${themeBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeColor,
              flexShrink: 0
            }}>
              {isSemCombo ? <FolderOpen size={26} /> : <BookOpen size={26} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span className="bundle-type-badge" style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  color: themeColor,
                  background: themeBg,
                  border: `1px solid ${themeBorder}`,
                  padding: '3px 10px',
                  borderRadius: '100px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {isSemCombo ? `Semester ${bundle.semester || 4} Pack` : 'All-In-One Subject Pack'}
                </span>

                <span className="bundle-access-pill" style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: daysLeft && daysLeft <= 30 ? '#f87171' : '#4ade80',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Clock size={11} /> {daysLeft ? `${daysLeft} Days Access` : '180 Days Access'}
                </span>
              </div>

              <h2 className="unlocked-bundle-title" style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                {bundle.title}
              </h2>
            </div>
          </div>

          <p className="unlocked-bundle-desc" style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
            {isSemCombo 
              ? 'Includes complete unit-wise study notes and solved exam papers for all semester subjects. Select any subject below to open its Catalog Portal.'
              : `Contains complete unit-wise study notes and solved past year examination papers (${bundleItems.length} resources included).`
            }
          </p>
        </div>

        {/* 🏆 SEMESTER BUNDLE VIEW: Render Subject Cards for each subject included in the semester */}
        {isSemCombo ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'rgba(255,255,255,0.9)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Included Semester Subjects ({Array.from(new Set([...(bundle.subjects || []), ...bundleItems.map(n => n.subject)])).filter(Boolean).length})
              </h3>
              <span style={{ fontSize: '12px', fontWeight: '700', color: themeColor, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                ✦ All Subjects Unlocked
              </span>
            </div>

            <div className="library-cards-grid">
              {Array.from(new Set([...(bundle.subjects || []), ...bundleItems.map(n => n.subject)])).filter(Boolean).map(subjName => {
                const matchingNotes = allNotes.filter(n => isSameSubject(n.subject, subjName));
                const studyCount = matchingNotes.filter(n => n.type !== 'pyqs').length || 5;
                const pyqCount = matchingNotes.filter(n => n.type === 'pyqs').length || 1;
                const totalNotesCount = matchingNotes.length || (studyCount + pyqCount);

                return (
                  <div
                    key={subjName}
                    className="glass-card fade-in"
                    style={{
                      borderRadius: '20px',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      background: 'radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const cleanSub = subjName.replace(/\s*complete\s*subject\s*pack.*/i, '').trim();
                      const targetHash = `#catalog?subject=${encodeURIComponent(cleanSub)}`;
                      if (window.location.hash !== targetHash) {
                        window.history.pushState(null, '', targetHash);
                      }
                      navigate('dashboard');
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-yellow)', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '3px 10px', borderRadius: '100px', textTransform: 'uppercase' }}>
                          Semester Subject
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> Unlocked
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-yellow)', flexShrink: 0 }}>
                          <BookOpen size={22} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px', lineHeight: '1.3' }}>
                            {subjName}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>
                            {totalNotesCount} Notes & Solved PYQs
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cleanSub = subjName.replace(/\s*complete\s*subject\s*pack.*/i, '').trim();
                        window.location.hash = `#catalog?subject=${encodeURIComponent(cleanSub)}`;
                        navigate('dashboard');
                      }}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '12px 16px',
                        fontSize: '13px',
                        fontWeight: '800',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#0f172a',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      Open Subject Pack <ChevronRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 🟪 SUBJECT PACK VIEW: Subject Portal Card + Direct Resources */
          <div>
            {/* Subject Portal Quick Action Card */}
            <div
              className="glass-card fade-in"
              style={{
                borderRadius: '18px',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                background: 'radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)',
                padding: '18px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onClick={() => {
                const firstNote = bundleItems[0];
                if (firstNote) {
                  onReadNote(firstNote);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a78bfa',
                  flexShrink: 0
                }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '0 0 2px 0' }}>
                    {bundle.subject || bundle.title} Catalog Portal
                  </h4>
                  <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '600' }}>
                    View All Unit-Wise Study Notes & Exam PYQs in Catalog
                  </span>
                </div>
              </div>

              <button
                className="btn-primary"
                style={{
                  fontSize: '12px',
                  padding: '8px 16px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Open Portal <ChevronRight size={14} />
              </button>
            </div>

            {/* Included Resources Section Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'rgba(255,255,255,0.8)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pack Resources ({bundleItems.length})
              </h3>
              <span style={{ fontSize: '12px', fontWeight: '700', color: themeColor }}>
                ✦ Unlocked Full Access
              </span>
            </div>

            {/* Notes Items List Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bundleItems.map(noteItem => {
                const hasPdf = isNotePdfAvailable(noteItem);
                return (
                  <div
                    key={noteItem.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 20px',
                      borderRadius: '18px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onClick={() => onReadNote(noteItem)}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: themeColor,
                      flexShrink: 0
                    }}>
                      <BookOpen size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {noteItem.title}
                      </h4>
                      <span style={{ fontSize: '11px', color: hasPdf ? 'var(--color-muted)' : '#f59e0b', fontWeight: hasPdf ? '400' : '600', display: 'block' }}>
                        {hasPdf ? `${noteItem.pagesCount || 45} pages · ${noteItem.subject}` : `✦ Under Faculty Review · ${noteItem.subject}`}
                      </span>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReadNote(noteItem);
                      }}
                      style={{
                        fontSize: '12px',
                        padding: '8px 16px',
                        fontWeight: '700',
                        borderRadius: '10px',
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Read Note <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: INSIDE A SPECIFIC CATEGORY VIEW (Semester / Subject / Individual)
  // =========================================================================
  if (viewState.mode === 'CATEGORY') {
    const { category } = viewState;

    return (
      <div className="container section-padding fade-in" style={{ paddingBottom: '90px', maxWidth: '780px', margin: '0 auto' }}>
        {/* Back to Hub Button */}
        <button
          className="library-back-btn"
          onClick={() => {
            if (window.history.length > 1 && window.location.hash.includes('?cat=')) {
              window.history.back();
            } else {
              setViewState({ mode: 'HUB' });
              window.location.hash = '#library';
            }
          }}
        >
          <ArrowLeft size={16} /> Back to Library Hub
        </button>

        {/* 🟨 CATEGORY 1: SEMESTER COMBO PACKS */}
        {category === 'semester' && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏆 Semester Combo Packs <span style={{ fontSize: '13px', color: 'var(--color-yellow)', fontWeight: '700' }}>({semesterComboPacks.length})</span>
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                Select your unlocked semester bundle to view all included subject notes.
              </p>
            </div>

            {semesterComboPacks.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px 20px', borderRadius: '20px', textAlign: 'center' }}>
                <FolderOpen size={36} style={{ color: 'var(--color-yellow)', marginBottom: '12px' }} />
                <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 6px' }}>No Semester Combos Unlocked</h4>
                <p style={{ color: 'var(--color-muted)', fontSize: '13px', margin: '0 0 16px' }}>Purchase a semester bundle from the catalog to unlock all subjects together.</p>
                <button className="btn-primary" onClick={() => navigate('dashboard')} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}>
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="library-cards-grid">
                {semesterComboPacks.map(({ bundle, daysLeft }) => {
                  const bundleItems = getBundleSubjectNotes(bundle);
                  return (
                    <div
                      key={bundle.id}
                      className="glass-card fade-in"
                      style={{
                        borderRadius: '20px',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        background: 'radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const targetHash = `#library?cat=semester&pack=${bundle.id}`;
                        if (window.location.hash !== targetHash) {
                          window.history.pushState(null, '', targetHash);
                        }
                        setViewState({ mode: 'PACK_DETAIL', bundle, daysLeft, originCategory: 'semester' });
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-yellow)', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '3px 10px', borderRadius: '100px', textTransform: 'uppercase' }}>
                            Semester Pack
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: daysLeft <= 30 ? '#f87171' : '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> {daysLeft ? `${daysLeft}d` : '180d'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-yellow)', flexShrink: 0 }}>
                            <FolderOpen size={22} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '0 0 4px', lineHeight: '1.3' }}>
                              {bundle.title}
                            </h4>
                            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>
                              {bundleItems.length} Resources Included
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        Open Semester Pack <ChevronRight size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 🟪 CATEGORY 2: SUBJECT ALL-IN-ONE PACKS */}
        {category === 'subject' && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📚 Subject All-In-One Packs <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '700' }}>({subjectPacks.length})</span>
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                Select your unlocked subject pack to view unit notes & exam PYQs.
              </p>
            </div>

            {subjectPacks.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px 20px', borderRadius: '20px', textAlign: 'center' }}>
                <BookOpen size={36} style={{ color: '#a78bfa', marginBottom: '12px' }} />
                <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 6px' }}>No Subject Packs Unlocked</h4>
                <p style={{ color: 'var(--color-muted)', fontSize: '13px', margin: '0 0 16px' }}>Unlock subject bundles to access all 5 units & solved papers together.</p>
                <button className="btn-primary" onClick={() => navigate('dashboard')} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}>
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="library-cards-grid">
                {subjectPacks.map(({ bundle, daysLeft }) => {
                  const bundleItems = getBundleSubjectNotes(bundle);
                  return (
                    <div
                      key={bundle.id}
                      className="glass-card fade-in"
                      style={{
                        borderRadius: '20px',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        background: 'radial-gradient(circle at 0% 0%, rgba(167, 139, 250, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const targetSubj = bundle.subject || bundle.title.replace(/\s*complete\s*subject\s*pack.*/i, '').replace(/\s*all-in-one\s*pack.*/i, '').trim();
                        const targetHash = `#catalog?subject=${encodeURIComponent(targetSubj)}`;
                        if (window.location.hash !== targetHash) {
                          window.history.pushState(null, '', targetHash);
                        }
                        navigate('dashboard');
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)', padding: '3px 10px', borderRadius: '100px', textTransform: 'uppercase' }}>
                            All-In-One Pack
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: daysLeft <= 30 ? '#f87171' : '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> {daysLeft ? `${daysLeft}d` : '180d'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
                            <BookOpen size={22} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '0 0 4px', lineHeight: '1.3' }}>
                              {bundle.title}
                            </h4>
                            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>
                              {bundleItems.length} Notes & Solved PYQs
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetSubj = bundle.subject || bundle.title.replace(/\s*complete\s*subject\s*pack.*/i, '').replace(/\s*all-in-one\s*pack.*/i, '').trim();
                          window.location.hash = `#catalog?subject=${encodeURIComponent(targetSubj)}`;
                          navigate('dashboard');
                        }}
                        style={{ width: '100%', marginTop: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        Open Subject Pack <ChevronRight size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 🟦 CATEGORY 3: INDIVIDUAL STUDY NOTES & PYQS */}
        {category === 'individual' && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📝 Individual Notes & PYQs <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '700' }}>({studyNotes.length + pyqs.length})</span>
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                Your unlocked individual study unit notes and solved examination papers.
              </p>
            </div>

            {studyNotes.length === 0 && pyqs.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px 20px', borderRadius: '20px', textAlign: 'center' }}>
                <FileText size={36} style={{ color: '#60a5fa', marginBottom: '12px' }} />
                <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 6px' }}>No Individual Notes Unlocked</h4>
                <p style={{ color: 'var(--color-muted)', fontSize: '13px', margin: '0 0 16px' }}>Individual purchased unit notes will show up here.</p>
                <button className="btn-primary" onClick={() => navigate('dashboard')} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}>
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="library-cards-grid">
                {[...studyNotes, ...pyqs].map(note => {
                  const details = notesDetails[note.id];
                  const daysLeft = details ? details.daysLeft : null;
                  const hasPdf = isNotePdfAvailable(note);
                  const isPyq = note.type === 'pyqs';

                  return (
                    <div
                      key={note.id}
                      className="glass-card fade-in"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '18px',
                        background: isPyq
                          ? 'radial-gradient(circle at 0% 0%, rgba(167, 139, 250, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)'
                          : 'radial-gradient(circle at 0% 0%, rgba(96, 165, 250, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
                        border: isPyq ? '1px solid rgba(167, 139, 250, 0.25)' : '1px solid rgba(96, 165, 250, 0.25)',
                        borderRadius: '18px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onClick={() => onReadNote(note)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: isPyq ? '#a78bfa' : '#60a5fa', background: isPyq ? 'rgba(167, 139, 250, 0.15)' : 'rgba(96, 165, 250, 0.15)', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>
                            {isPyq ? 'PYQ Paper' : 'Study Note'}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: daysLeft !== null && daysLeft <= 30 ? '#f87171' : '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> {daysLeft ? `${daysLeft}d` : '180d'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isPyq ? 'rgba(167, 139, 250, 0.15)' : 'rgba(96, 165, 250, 0.15)', border: isPyq ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid rgba(96, 165, 250, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPyq ? '#a78bfa' : '#60a5fa', flexShrink: 0 }}>
                            {isPyq ? <FileText size={18} /> : <BookOpen size={18} />}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: '0 0 4px', lineHeight: '1.3' }}>
                              {note.title}
                            </h4>
                            <span style={{ fontSize: '11px', color: hasPdf ? 'var(--color-muted)' : '#f59e0b', fontWeight: hasPdf ? '400' : '600' }}>
                              {note.subject} · {hasPdf ? `${note.pagesCount} pg` : `✦ Under Faculty Review`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReadNote(note);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '9px 14px',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '10px',
                          background: isPyq ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        Read Note <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 1: MAIN 3 CATEGORY BOXES HUB
  // =========================================================================
  return (
    <div className="container section-padding fade-in" style={{ paddingBottom: '90px', maxWidth: '820px', margin: '0 auto' }}>
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div style={{ marginBottom: '32px', textAlign: 'left' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          My Library
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
          {loading
            ? 'Loading your purchased notes...'
            : libraryBundles.length + studyNotes.length + pyqs.length > 0
              ? `Select a category below to explore your ${libraryBundles.length + studyNotes.length + pyqs.length} unlocked resources.`
              : 'Nothing here yet'
          }
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }} className="fade-in">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="skeleton-box" style={{ width: '56px', height: '56px', borderRadius: '16px' }}></div>
              <div className="skeleton-box" style={{ width: '70%', height: '20px', borderRadius: '6px' }}></div>
              <div className="skeleton-box" style={{ width: '50%', height: '14px', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '100%', height: '42px', borderRadius: '12px', marginTop: '12px' }}></div>
            </div>
          ))}
        </div>
      ) : (libraryBundles.length === 0 && studyNotes.length === 0 && pyqs.length === 0) ? (
        <div className="glass-card fade-in" style={{ padding: '56px 24px', borderRadius: '24px', textAlign: 'center' }}>
          <FolderOpen size={48} style={{ color: 'var(--color-yellow)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>No purchases yet</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.6, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your unlocked semester packs, subject bundles, and study notes will appear in your library after purchase.
          </p>
          <button className="btn-primary" onClick={() => navigate('dashboard')} style={{ padding: '12px 32px', borderRadius: '14px', fontSize: '14px', fontWeight: '700' }}>
            Browse Catalog <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </button>
        </div>
      ) : (
        /* 🎯 THE 3 MAIN MASTER CATEGORY BOXES (STRICT 3 IN 1 ROW ON DESKTOP) */
        <div className="library-hub-grid">

          {/* 🟨 BOX 1: SEMESTER COMBO PACKS */}
          <div
            className="glass-card library-hub-card sem-combo-card fade-in"
            style={{
              borderRadius: '24px',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              background: 'radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 35px rgba(0, 0, 0, 0.45)',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: '230px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onClick={() => {
              const targetHash = '#library?cat=semester';
              if (window.location.hash !== targetHash) {
                window.history.pushState(null, '', targetHash);
              }
              setViewState({ mode: 'CATEGORY', category: 'semester' });
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(251, 191, 36, 0.18)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-yellow)',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)'
                }}>
                  <FolderOpen size={28} />
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: 'var(--color-yellow)',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  letterSpacing: '0.05em'
                }}>
                  {semesterComboPacks.length} Packs
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Semester Combo Packs
              </h3>

              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.5' }}>
                Complete multi-subject semester notes and PYQ bundles.
              </p>
            </div>

            <button
              className="btn-primary sem-combo-btn"
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: '800',
                borderRadius: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Explore Semester Packs <ChevronRight size={16} />
            </button>
          </div>

          {/* 🟪 BOX 2: SUBJECT ALL-IN-ONE PACKS */}
          <div
            className="glass-card library-hub-card subject-pack-card fade-in"
            style={{
              borderRadius: '24px',
              border: '1px solid rgba(167, 139, 250, 0.35)',
              background: 'radial-gradient(circle at 0% 0%, rgba(167, 139, 250, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 35px rgba(0, 0, 0, 0.45)',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: '230px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onClick={() => {
              const targetHash = '#library?cat=subject';
              if (window.location.hash !== targetHash) {
                window.history.pushState(null, '', targetHash);
              }
              setViewState({ mode: 'CATEGORY', category: 'subject' });
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(167, 139, 250, 0.18)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a78bfa',
                  boxShadow: '0 0 20px rgba(167, 139, 250, 0.2)'
                }}>
                  <BookOpen size={28} />
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#a78bfa',
                  background: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  letterSpacing: '0.05em'
                }}>
                  {subjectPacks.length} Packs
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Subject All-In-One Packs
              </h3>

              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.5' }}>
                Single subject unit 1-5 notes & exam PYQ bundles.
              </p>
            </div>

            <button
              className="btn-primary subject-pack-btn"
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: '800',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Explore Subject Packs <ChevronRight size={16} />
            </button>
          </div>

          {/* 🟦 BOX 3: INDIVIDUAL STUDY NOTES & PYQS */}
          <div
            className="glass-card library-hub-card individual-notes-card fade-in"
            style={{
              borderRadius: '24px',
              border: '1px solid rgba(96, 165, 250, 0.35)',
              background: 'radial-gradient(circle at 0% 0%, rgba(96, 165, 250, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 35px rgba(0, 0, 0, 0.45)',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: '230px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onClick={() => {
              const targetHash = '#library?cat=individual';
              if (window.location.hash !== targetHash) {
                window.history.pushState(null, '', targetHash);
              }
              setViewState({ mode: 'CATEGORY', category: 'individual' });
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(96, 165, 250, 0.18)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  boxShadow: '0 0 20px rgba(96, 165, 250, 0.2)'
                }}>
                  <FileText size={28} />
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#60a5fa',
                  background: 'rgba(96, 165, 250, 0.15)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  letterSpacing: '0.05em'
                }}>
                  {libraryNotes.length} Items
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Individual Study Notes
              </h3>

              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, lineHeight: '1.5' }}>
                Standalone unit notes and solved past year papers.
              </p>
            </div>

            <button
              className="btn-primary individual-notes-btn"
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: '800',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Explore Individual Notes <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
