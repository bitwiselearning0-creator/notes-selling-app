import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, ShieldCheck, User, BookOpen, ArrowLeft, ArrowRight, Sparkles, Clock, FileText, Video } from 'lucide-react';
import { dbService, decodeBundleFromDb, isSameSubject, deriveBundleType } from '../lib/dbService';
import type { Note, UserProfile, Bundle, Playlist } from '../lib/dbService';
import { openRazorpayCheckout } from '../lib/razorpay';
import { NoteCard } from '../components/NoteCard';
import { VideoCard } from '../components/VideoCard';
import { sanitizeSearchQuery } from '../lib/security';

interface SubjectItem {
  name: string;
  semester: number | 'Common' | 'Coming Soon';
  isComingSoon?: boolean;
}

export const isTrueStudyNote = (n: Note): boolean => {
  if (n.type === 'pyqs') return false;
  if ((n.type as string) === 'bundle' || (n.type as string) === 'subject' || (n.type as string) === 'combo') return false;
  
  const titleLower = n.title.toLowerCase();
  
  // Check if ID or Title indicates a Bundle / Subject Pack
  if (n.id.startsWith('subject_pack_') || n.id.startsWith('bundle_')) return false;
  if (titleLower.includes('bundle')) return false;
  if (titleLower.includes('subject pack') || titleLower.includes('combo pack') || titleLower.includes('combo bundle')) return false;
  
  return true;
};

const getSubjectsForActiveFilter = (
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year',
  sem: number | null,
  allNotes: Note[] = []
): SubjectItem[] => {
  let predefined: SubjectItem[] = [];
  if (year === '1st Year') {
    predefined = [
      { name: 'Engineering Physics', semester: 'Common' },
      { name: 'Engineering Chemistry', semester: 'Common' },
      { name: 'Engineering Mathematics-I', semester: 'Common' },
      { name: 'Programming for Problem Solving', semester: 'Common' },
      { name: 'Fundamentals of Electronics Engineering', semester: 'Common' },
      { name: 'Environment and Ecology', semester: 'Common' },
      { name: 'Soft Skills', semester: 'Common' }
    ];
  } else if (year === '2nd Year') {
    const sem3: SubjectItem[] = [
      { name: 'Data Structure', semester: 3 },
      { name: 'Computer Organization & Architecture', semester: 3 },
      { name: 'Discrete Structures & Theory of Logic', semester: 3 }
    ];
    const sem4: SubjectItem[] = [
      { name: 'Operating System', semester: 4 },
      { name: 'Theory of Automata and Formal Languages', semester: 4 },
      { name: 'Object Oriented Programming with Java', semester: 4 }
    ];
    const common: SubjectItem[] = [
      { name: 'Math IV', semester: 'Common' },
      { name: 'Technical Communication', semester: 'Common' },
      { name: 'Cyber Security', semester: 'Common' },
      { name: 'Python Programming', semester: 'Common' },
      { name: 'UHV', semester: 'Common' },
      { name: 'Energy Science and Engineering', semester: 'Common' }
    ];
    if (sem === 3) predefined = [...sem3, ...common];
    else if (sem === 4) predefined = [...sem4, ...common];
    else predefined = [...sem3, ...sem4, ...common];
  } else if (year === '3rd Year') {
    const sem5: SubjectItem[] = [
      { name: 'Database Management System', semester: 5 },
      { name: 'Web Technology', semester: 5 },
      { name: 'Design and Analysis of Algorithm (DAA)', semester: 5 },
      { name: 'Data Analytics', semester: 5 },
      { name: 'Object Oriented System Design with C++ (OOSD)', semester: 5 },
      { name: 'Image Processing', semester: 5 },
      { name: 'Data Warehouse & Data Mining', semester: 5 }
    ];
    const sem6: SubjectItem[] = [
      { name: 'Software Engineering', semester: 6 },
      { name: 'Compiler Design', semester: 6 },
      { name: 'Computer Networks', semester: 6 },
      { name: 'Blockchain Architecture Design', semester: 6 },
      { name: 'Big Data', semester: 6 },
      { name: 'Software Project Management (SPM)', semester: 6 }
    ];
    const common: SubjectItem[] = [
      { name: 'Constitution of India (COI)', semester: 'Common' },
      { name: 'Essence of Indian Traditional Knowledge (EITK)', semester: 'Common' }
    ];
    if (sem === 5) predefined = [...sem5, ...common];
    else if (sem === 6) predefined = [...sem6, ...common];
    else predefined = [...sem5, ...sem6, ...common];
  } else if (year === '4th Year') {
    predefined = [
      { name: 'Semester 7 subjects', semester: 'Coming Soon', isComingSoon: true },
      { name: 'Semester 8 subjects', semester: 'Coming Soon', isComingSoon: true }
    ];
  }

  // Dynamically include any uploaded custom subject from notes that is NOT in predefined list
  // IMPORTANT: only include subjects whose note actually belongs to the active year
  if (allNotes && allNotes.length > 0) {
    for (const n of allNotes) {
      if (!n.subject || !n.year) continue;
      // Strict year match — skip notes from other years
      const nY = n.year.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fY = year.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (nY !== fY && !nY.includes(fY) && !fY.includes(nY)) continue;
      const alreadyExists = predefined.some(p => isSameSubject(p.name, n.subject));
      if (!alreadyExists) {
        predefined.push({
          name: n.subject,
          semester: n.semester || 'Common'
        });
      }
    }
  }

  return predefined;
};

interface DashboardProps {
  user: UserProfile | null;
  selectedYear: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  setSelectedYear: (year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year') => void;
  onReadNote: (note: Note) => void;
  navigate: (page: string) => void;
  onRegisterBackHandler?: (handler: () => boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  selectedYear,
  setSelectedYear,
  onReadNote,
  navigate,
  onRegisterBackHandler
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [purchaseDetailsMap, setPurchaseDetailsMap] = useState<Record<string, { expiresAt: string | null; daysLeft: number | null }>>({});
  const [purchasedBundleIds, setPurchasedBundleIds] = useState<string[]>([]);
  const [bundlePurchaseDetailsMap, setBundlePurchaseDetailsMap] = useState<Record<string, { expiresAt: string | null; daysLeft: number | null }>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash.startsWith('#catalog')) return null;
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const subj = params.get('subject');
    return subj ? decodeURIComponent(subj) : null;
  });

  const [selectedCategory, setSelectedCategory] = useState<'notes' | 'pyqs' | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash.startsWith('#catalog')) return null;
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const cat = params.get('cat');
    return (cat === 'notes' || cat === 'pyqs') ? cat : null;
  });

  const [navAnimDir, setNavAnimDir] = useState<'forward' | 'back'>('forward');

  // URL Hash Synchronizer for seamless Browser & Native Back Button support
  useEffect(() => {
    const syncDashboardHashState = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#catalog')) return;

      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const subjParam = params.get('subject');
      const catParam = params.get('cat') as 'notes' | 'pyqs' | null;

      if (subjParam) {
        setSelectedSubject(decodeURIComponent(subjParam));
      } else if (hash === '#catalog') {
        setSelectedSubject(null);
      }

      if (catParam === 'notes' || catParam === 'pyqs') {
        setSelectedCategory(catParam);
      } else if (!hash.includes('&cat=')) {
        setSelectedCategory(null);
      }
    };

    syncDashboardHashState();
    window.addEventListener('popstate', syncDashboardHashState);
    return () => {
      window.removeEventListener('popstate', syncDashboardHashState);
    };
  }, []);

  const handleOpenSubject = (subjectName: string) => {
    setNavAnimDir('forward');
    setSelectedSubject(subjectName);
    setSelectedCategory(null);
    const targetHash = `#catalog?subject=${encodeURIComponent(subjectName)}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
    window.scrollTo(0, 0);
  };

  const handleOpenCategory = (cat: 'notes' | 'pyqs') => {
    setNavAnimDir('forward');
    setSelectedCategory(cat);
    if (selectedSubject) {
      const targetHash = `#catalog?subject=${encodeURIComponent(selectedSubject)}&cat=${cat}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
    window.scrollTo(0, 0);
  };

  const handleBackCategory = () => {
    setNavAnimDir('back');
    if (window.history.length > 1 && window.location.hash.includes('&cat=')) {
      window.history.back();
    } else {
      setSelectedCategory(null);
      if (selectedSubject) {
        const targetHash = `#catalog?subject=${encodeURIComponent(selectedSubject)}`;
        if (window.location.hash !== targetHash) {
          window.history.pushState(null, '', targetHash);
        }
      }
    }
    window.scrollTo(0, 0);
  };

  const handleBackSubject = () => {
    setNavAnimDir('back');
    if (window.history.length > 1 && window.location.hash.includes('?')) {
      window.history.back();
    } else {
      setSelectedSubject(null);
      setSelectedCategory(null);
      if (window.location.hash !== '#catalog') {
        window.history.pushState(null, '', '#catalog');
      }
    }
    window.scrollTo(0, 0);
  };
  
  // Loading & payment states
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<{ id: string; price: number; type: 'notes' | 'bundle'; title: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const isInitialLoad = useRef(true);

  // Load notes, bundles, playlists, and user purchases
  const loadDashboardData = async () => {
    // Initial 0ms synchronous local cache hydration for instant display across all subjects
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      const deletedIds = new Set(JSON.parse(localStorage.getItem('bw_deleted_notes') || '[]'));
      const rawCached = localStorage.getItem('bw_cached_notes') ? JSON.parse(localStorage.getItem('bw_cached_notes')!) : [];
      const cachedCatalog = rawCached.filter((n: any) => !deletedIds.has(n.id));
      const cachedBundles = localStorage.getItem('bw_cached_bundles') ? JSON.parse(localStorage.getItem('bw_cached_bundles')!) : [];
      const cachedPlaylists = localStorage.getItem('bw_cached_playlists') ? JSON.parse(localStorage.getItem('bw_cached_playlists')!) : [];

      if (cachedCatalog.length > 0 || cachedBundles.length > 0 || cachedPlaylists.length > 0) {
        setNotes(cachedCatalog);
        setBundles(cachedBundles);
        setPlaylists(cachedPlaylists);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    try {
      // Fetch full catalog across all years so any subject opened via URL/Subject Pack loads 100% instantly
      const [notesRes, bundlesRes, playlistsRes] = await Promise.all([
        dbService.getNotes(),
        dbService.getBundles(),
        dbService.getPlaylists()
      ]);

      const activeNotes = notesRes.data || [];
      const activeBundles = bundlesRes.data || [];
      const activePlaylists = playlistsRes.data || [];

      // Avoid state mutations if content is unchanged to prevent layout flicker
      setNotes(prev => JSON.stringify(prev) === JSON.stringify(activeNotes) ? prev : activeNotes);
      setBundles(prev => JSON.stringify(prev) === JSON.stringify(activeBundles) ? prev : activeBundles);
      setPlaylists(prev => JSON.stringify(prev) === JSON.stringify(activePlaylists) ? prev : activePlaylists);

      if (user) {
        const purchaseState = await dbService.getAllUserPurchasesState();
        setPurchasedIds(prev => JSON.stringify(prev) === JSON.stringify(purchaseState.purchasedNoteIds) ? prev : purchaseState.purchasedNoteIds);
        setPurchaseDetailsMap(purchaseState.noteDetailsMap);
        setPurchasedBundleIds(prev => JSON.stringify(prev) === JSON.stringify(purchaseState.purchasedBundleIds) ? prev : purchaseState.purchasedBundleIds);
        setBundlePurchaseDetailsMap(purchaseState.bundleDetailsMap);
      } else {
        setPurchasedIds([]);
        setPurchaseDetailsMap({});
        setPurchasedBundleIds([]);
        setBundlePurchaseDetailsMap({});
      }
    } catch (err) {
      console.error('Error loading catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handlePurchaseUpdate = () => {
      loadDashboardData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData();
      }
    };

    window.addEventListener('bw_purchases_updated', handlePurchaseUpdate);
    window.addEventListener('focus', handlePurchaseUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('bw_purchases_updated', handlePurchaseUpdate);
      window.removeEventListener('focus', handlePurchaseUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedYear, user]);

  // Automatically sync active year tab when opening a subject portal from URL hash or My Library
  useEffect(() => {
    if (selectedSubject && notes.length > 0) {
      const match = notes.find(n => isSameSubject(n.subject, selectedSubject));
      if (match && match.year && match.year !== selectedYear) {
        setSelectedYear(match.year as any);
      }
    }
  }, [selectedSubject, notes, selectedYear, setSelectedYear]);

  // Handle physical/browser back button for Dashboard Card View, Subject View, Search, & Semester Filter
  useEffect(() => {
    if (onRegisterBackHandler) {
      onRegisterBackHandler(() => {
        if (selectedCategory !== null) {
          handleBackCategory();
          return true;
        }
        if (selectedSubject !== null) {
          handleBackSubject();
          return true;
        }
        if (searchQuery.trim() !== '') {
          setSearchQuery('');
          return true;
        }
        if (selectedSemester !== null) {
          setSelectedSemester(null);
          return true;
        }
        return false;
      });
    }

    const handlePopState = () => {
      if (selectedCategory !== null) {
        handleBackCategory();
      } else if (selectedSubject !== null) {
        handleBackSubject();
      } else if (searchQuery.trim() !== '') {
        setSearchQuery('');
      } else if (selectedSemester !== null) {
        setSelectedSemester(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedCategory, selectedSubject, searchQuery, selectedSemester, onRegisterBackHandler]);

  // Determine semesters in active year
  const getSemestersForYear = () => {
    switch (selectedYear) {
      case '1st Year': return [1, 2];
      case '2nd Year': return [3, 4];
      case '3rd Year': return [5, 6];
      case '4th Year': return [7, 8];
      default: return [];
    }
  };

  // Reset semester & subject filter when changing year tab
  const handleYearChange = (year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year') => {
    setSelectedYear(year);
    setSelectedSemester(null);
    setSelectedSubject(null);
  };

  // Reset subject filter when changing semester
  const handleSemesterChange = (sem: number | null) => {
    setSelectedSemester(sem);
    setSelectedSubject(null);
  };

  // Filter notes based on search, year, semester & subject filter
  const filteredNotes = notes.filter(n => {
    const matchesSearch = !searchQuery || 
                          n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedSubject) {
      return matchesSearch && isSameSubject(n.subject, selectedSubject);
    }

    // Strict year match — notes without a year are NOT shown in any tab
    if (!n.year) return false;
    const nY = n.year.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fY = selectedYear.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchesYear = nY === fY || nY.includes(fY) || fY.includes(nY);
    if (!matchesYear) return false;

    // Semester filter — only apply if a semester tab is actively selected
    const matchesSem = selectedSemester === null || n.semester === selectedSemester;

    return matchesSearch && matchesSem;
  });

  const studyNotes = filteredNotes.filter(isTrueStudyNote);
  const pyqs = filteredNotes.filter(n => n.type === 'pyqs');

  // Filter playlists based on semester, year & subject selection with smart deduplication
  const filteredPlaylists = (() => {
    const list = playlists.filter(p => {
      // Drop dummy unsplash / pl_ seed playlists
      if (p.id.startsWith('pl_') || (p.thumbnailUrl && p.thumbnailUrl.includes('unsplash'))) {
        return false;
      }
      if (selectedSubject) {
        return isSameSubject(p.subject, selectedSubject);
      }
      const matchesYear = !selectedYear || p.year === selectedYear || !p.year;
      const matchesSem = selectedSemester === null || p.semester === selectedSemester;
      return matchesYear && matchesSem;
    });

    const unique: Playlist[] = [];
    const seen = new Set<string>();
    for (const item of list) {
      const key = item.subject ? item.subject.toLowerCase().trim() : item.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  })();

  // Execute Razorpay Checkout Directly
  const executePurchase = async (targetId: string, price: number, type: 'notes' | 'bundle', title: string) => {
    if (!user) {
      navigate('auth');
      return;
    }

    setPaymentTarget({ id: targetId, price, type, title });
    setPaying(true);

    const launched = await openRazorpayCheckout({
      title,
      price,
      type,
      user,
      onSuccess: async (response) => {
        const paymentDetails = {
          paymentId: response.razorpay_payment_id || 'pay_' + Math.random().toString(36).substring(2, 10),
          orderId: response.razorpay_order_id || '',
          signature: response.razorpay_signature || ''
        };

        if (type === 'notes') {
          await dbService.purchaseNotes(targetId, paymentDetails);
        } else {
          await dbService.purchaseBundle(targetId, paymentDetails);
        }

        setPaymentSuccess(true);
        setPaying(false);
        await loadDashboardData(); // Refresh all purchases

        setTimeout(() => {
          setPaymentTarget(null);
          setPaymentSuccess(false);
        }, 1800);
      },
      onFailure: (err) => {
        setPaying(false);
        setPaymentTarget(null);
        if (typeof err === 'string' && err.length > 0) {
          alert(err);
        }
      },
      onDismiss: () => {
        setPaying(false);
        setPaymentTarget(null);
      }
    });

    if (!launched) {
      setPaying(false);
      setPaymentTarget(null);
    }
  };

  const handlePurchaseTrigger = (noteId: string, price: number) => {
    const note = notes.find(n => n.id === noteId);
    executePurchase(noteId, price, 'notes', note ? note.title : 'Study Lecture Notes Pack');
  };

  const handleBundlePurchaseTrigger = (bundleId: string, price: number) => {
    const bundle = bundles.find(b => b.id === bundleId);
    executePurchase(bundleId, price, 'bundle', bundle ? bundle.title : 'Semester Combo Pack');
  };

  return (
    <div className="dashboard-container container fade-in" style={{ minHeight: '75vh' }}>
      {/* Background blobs */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Premium Welcome Header Card (Only visible on main catalog page) */}
      {selectedSubject === null && (
        <div className="dark-card welcome-dashboard-card" data-dark-card="true" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '28px',
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
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* User avatar/icon with soft ring */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-blue-light)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            flexShrink: 0,
            boxShadow: '0 0 15px rgba(96, 165, 250, 0.1)'
          }}>
            <User size={28} />
          </div>

          {/* Welcome Text */}
          <div style={{ flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Academic Portal
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '100px',
                padding: '2px 8px',
                fontSize: '10px',
                color: '#34d399',
                fontWeight: '700',
                letterSpacing: '0.02em'
              }}>
                SECURE
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '6px 0 2px 0', letterSpacing: '-0.01em' }}>
              {user ? `Hello, ${user.name.split(' ')[0]}! 👋` : 'Welcome to Catalog'}
            </h2>
            <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '13px', lineHeight: '1.4' }}>
              {user ? 'Ready to master your syllabus and ace your examinations?' : 'Select your year, filter by semester, and unlock study resources.'}
            </p>
          </div>
        </div>
      )}

      {/* Dedicated Inside Subject Detail View */}
      {selectedSubject ? (
        <div 
          key={selectedSubject + (selectedCategory || 'portal')} 
          className={navAnimDir === 'forward' ? 'page-transition-enter' : 'page-transition-back'}
        >
          {selectedCategory !== null ? (
            /* LEVEL 3: Dedicated Card Page (ONLY ← Back + Notes/PYQs list, ZERO top clutter) */
            <div className="fade-in">
              {/* Single Step Back Navigation Button Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '20px',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button 
                  className="btn-secondary"
                  onClick={handleBackCategory}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    flexShrink: 0
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    color: selectedCategory === 'notes' ? '#60a5fa' : '#a78bfa', 
                    fontWeight: '700', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    {selectedCategory === 'notes' ? 'Study Notes' : 'Exam PYQs'}
                  </span>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '800', 
                    color: '#fff', 
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {selectedSubject}
                  </h3>
                </div>
              </div>

              {/* Directly Render Notes Cards / PYQ Cards Cleanly */}
              {selectedCategory === 'notes' ? (
                studyNotes.length > 0 ? (
                  <div className="notes-grid" style={{ marginBottom: '32px' }}>
                    {studyNotes.map(note => (
                      <NoteCard 
                        key={note.id}
                        note={note}
                        isPurchased={purchasedIds.includes(note.id)}
                        isLoggedIn={!!user}
                        onPurchase={handlePurchaseTrigger}
                        onRead={onReadNote}
                        onNavigateToAuth={() => navigate('auth')}
                        purchaseDetails={purchaseDetailsMap[note.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state glass-card" style={{ padding: '36px 20px', textAlign: 'center', borderRadius: '16px', marginBottom: '32px' }}>
                    <Sparkles size={24} className="yellow-accent" style={{ marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Notes Launching Soon</h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                      Study notes for {selectedSubject} are currently being added.
                    </p>
                  </div>
                )
              ) : (
                pyqs.length > 0 ? (
                  <div className="notes-grid" style={{ marginBottom: '32px' }}>
                    {pyqs.map(note => (
                      <NoteCard 
                        key={note.id}
                        note={note}
                        isPurchased={purchasedIds.includes(note.id)}
                        isLoggedIn={!!user}
                        onPurchase={handlePurchaseTrigger}
                        onRead={onReadNote}
                        onNavigateToAuth={() => navigate('auth')}
                        purchaseDetails={purchaseDetailsMap[note.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state glass-card" style={{ padding: '36px 20px', textAlign: 'center', borderRadius: '16px', marginBottom: '32px' }}>
                    <Clock size={24} className="blue-accent" style={{ marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>PYQs Launching Soon</h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                      Solved PYQ papers for {selectedSubject} are currently being added.
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            /* LEVEL 2: Subject Portal View (Back to Catalog + Subject Banner + Bundles + 2 Cards + YouTube Playlists) */
            <>
              {/* Back Navigation Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <button 
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}
                  onClick={handleBackSubject}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Catalog</span>
                </button>
              </div>

              {/* Subject Hero Header */}
              <div className="glass-card subject-portal-header" style={{
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                padding: '16px 20px',
                marginBottom: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                boxShadow: '0 8px 25px rgba(0,0,0,0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-blue-light)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    flexShrink: 0
                  }}>
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <span className="semester-tag" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {selectedYear} • {selectedSemester !== null ? `Semester ${selectedSemester}` : 'Subject Portal'}
                    </span>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '2px 0 4px 0' }}>
                      {selectedSubject}
                    </h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--color-muted)' }}>
                      <span>📚 {studyNotes.length} Unit Notes</span>
                      <span>•</span>
                      <span>📝 {pyqs.length} PYQ Papers</span>
                      <span>•</span>
                      <span>🎥 {filteredPlaylists.length} Video Playlists</span>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn-secondary" 
                  onClick={handleBackSubject}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  All Subjects
                </button>
              </div>

              {/* Golden Subject All-In-One Combo Banner (Positioned Right Above 2 Square Cards ONLY if created by Admin) */}
              {(() => {
                const subjectPack = bundles.find(b => {
                  const isSub = (b.type as string) === 'subject' || (!b.id.startsWith('bundle_') && !b.title.toLowerCase().includes('combo pack') && !b.title.toLowerCase().includes('semester combo'));
                  return isSub && isSameSubject(b.subject || b.title, selectedSubject);
                });

                // Do not render anything above cards if admin hasn't explicitly created a subject bundle in Admin
                if (!subjectPack) return null;

                const isPurchased = purchasedBundleIds.includes(subjectPack.id) || 
                                    purchasedIds.includes(subjectPack.id) ||
                                    (notes.filter(n => isSameSubject(n.subject, selectedSubject)).length > 0 &&
                                     notes.filter(n => isSameSubject(n.subject, selectedSubject)).every(n => purchasedIds.includes(n.id)));

                return (
                  <div 
                    key={subjectPack.id} 
                    className="glass-card subject-pack-banner fade-in"
                    style={{
                      borderRadius: '18px',
                      padding: '16px 18px',
                      marginBottom: '20px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Row 1: Badge & Access Duration */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        color: 'var(--color-yellow)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Sparkles size={11} /> {isPurchased ? 'Unlocked Subject Pack' : '🔥 Subject All-In-One Pack'}
                      </span>
                      <span className="pack-access-text" style={{ fontSize: '11px', fontWeight: '600' }}>
                        6 Months Access
                      </span>
                    </div>

                    {/* Row 2: Title */}
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '800', 
                      margin: '0 0 12px 0', 
                      textAlign: 'left',
                      lineHeight: '1.3'
                    }}>
                      {subjectPack.title}
                    </h4>

                    {/* Row 3: Symmetrical Bottom Bar (Features on Left, Price & Action on Right) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      {/* Left: Compact Feature Badges */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="feature-badge-pill" style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={11} style={{ color: '#10b981' }} />
                          {studyNotes.length} Unit Notes
                        </span>
                        <span className="feature-badge-pill" style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={11} style={{ color: '#10b981' }} />
                          {pyqs.length} Solved PYQs
                        </span>
                      </div>

                      {/* Right: Price Tag & Unlock Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        {!isPurchased && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: 'var(--color-muted)', textDecoration: 'line-through', lineHeight: 1 }}>
                              ₹{subjectPack.originalPrice || 149}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-yellow)', lineHeight: 1.1, marginTop: '2px' }}>
                              ₹{subjectPack.price}
                            </div>
                          </div>
                        )}

                        {user ? (
                          isPurchased ? (
                            <button className="btn-secondary" style={{ pointerEvents: 'none', opacity: 0.9, fontSize: '12px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '700', borderRadius: '10px' }}>
                              ✓ Unlocked & Active
                            </button>
                          ) : (
                            <button 
                              className="btn-primary" 
                              onClick={() => handleBundlePurchaseTrigger(subjectPack.id, subjectPack.price)}
                              style={{ fontSize: '12px', padding: '7px 14px', fontWeight: '700', borderRadius: '10px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#000000' }}
                            >
                              Unlock Subject Pack
                            </button>
                          )
                        ) : (
                          <button 
                            className="btn-primary" 
                            onClick={() => navigate('auth')}
                            style={{ fontSize: '12px', padding: '7px 14px', fontWeight: '700', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#000000' }}
                          >
                            Unlock Subject Pack
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2 Square Cards in 1 Row (Compact & Fits in Same Screen View) */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                margin: '0 0 20px' 
              }}>
                {/* Square Card 1: Study Notes */}
                <div 
                  className="glass-card study-notes-card fade-in"
                  onClick={() => handleOpenCategory('notes')}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div className="icon-box-blue" style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <BookOpen size={20} />
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 2px 0' }}>
                    Study Notes
                  </h4>
                  <span className="card-sub-count" style={{ fontSize: '11px', fontWeight: '600' }}>
                    {studyNotes.length} Unit Files
                  </span>

                  <span className="action-pill-blue" style={{
                    marginTop: '8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Open Card <ArrowRight size={10} />
                  </span>
                </div>

                {/* Square Card 2: Exam PYQs */}
                <div 
                  className="glass-card pyqs-card fade-in"
                  onClick={() => handleOpenCategory('pyqs')}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div className="icon-box-purple" style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <FileText size={20} />
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 2px 0' }}>
                    Exam PYQs
                  </h4>
                  <span className="card-sub-count" style={{ fontSize: '11px', fontWeight: '600' }}>
                    {pyqs.length} Solved Papers
                  </span>

                  <span className="action-pill-purple" style={{
                    marginTop: '8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Open Card <ArrowRight size={10} />
                  </span>
                </div>
              </div>

              {/* YouTube Video Solutions / Playlists Section (Directly Below the 2 Square Cards) */}
              {filteredPlaylists.length > 0 && (
                <section style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }} className="yellow-accent">
                      <Video size={20} className="yellow-accent" />
                      {selectedSubject} - Video Lectures & YouTube Playlists
                    </h3>
                    <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '20px' }}>
                      Learn complex topics step-by-step through synced YouTube course playlists.
                    </p>
                  </div>
                  
                  <div className="video-grid">
                    {filteredPlaylists.map((p) => (
                      <VideoCard key={p.id} playlist={p} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        /* Catalog Main View (When no subject is tapped) */
        <>
          {/* Dashboard Controls */}
          <div className="dashboard-controls">
            {/* Search Bar */}
            <div className="search-bar-wrapper">
              <Search size={18} className="search-icon-overlay" />
              <input 
                type="text" 
                placeholder="Search by subject, notes topic, or syllabus..." 
                value={searchQuery}
                maxLength={100}
                onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
              />
            </div>

            {/* Year Selector Tabs */}
            <div className="year-tabs">
              {(['1st Year', '2nd Year', '3rd Year', '4th Year'] as const).map(year => (
                <button 
                  key={year}
                  className={`year-tab-btn ${selectedYear === year ? 'active' : ''}`}
                  onClick={() => handleYearChange(year)}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Semester Filter chips */}
            <div className="sem-filters">
              <button 
                className={`sem-filter-btn ${selectedSemester === null ? 'active' : ''}`}
                onClick={() => handleSemesterChange(null)}
              >
                All Semesters
              </button>
              {getSemestersForYear().map(sem => (
                <button
                  key={sem}
                  className={`sem-filter-btn ${selectedSemester === sem ? 'active' : ''}`}
                  onClick={() => handleSemesterChange(sem)}
                >
                  Semester {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Skeleton Loading State */}
          {loading ? (
            <div style={{ marginBottom: '40px' }} className="fade-in">
              <div className="subject-cards-grid" style={{ marginBottom: '30px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="glass-card" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '10px' }}></div>
                      <div className="skeleton-box" style={{ width: '45px', height: '18px', borderRadius: '100px' }}></div>
                    </div>
                    <div className="skeleton-box" style={{ width: '80%', height: '16px', borderRadius: '6px' }}></div>
                    <div className="skeleton-box" style={{ width: '60%', height: '12px', borderRadius: '4px' }}></div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery.trim() ? (
            /* Live Search Results View */
            <div className="search-results-container fade-in" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }} className="blue-accent">
                  Search Results for "{searchQuery}"
                </h3>
                <button 
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </div>

              {/* Matching Subject Cards */}
              {getSubjectsForActiveFilter(selectedYear, selectedSemester, notes)
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())).length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                      Matching Subjects:
                    </div>
                    <div className="subject-cards-grid">
                      {getSubjectsForActiveFilter(selectedYear, selectedSemester, notes)
                        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                        .map((subject, i) => {
                          const subjectNotesCount = notes.filter(n => isSameSubject(n.subject, subject.name) && isTrueStudyNote(n)).length;
                          const subjectPyqsCount = notes.filter(n => isSameSubject(n.subject, subject.name) && n.type === 'pyqs').length;
                          const subjectVideosCount = playlists.filter(p => isSameSubject(p.subject, subject.name)).length;

                          return (
                            <div 
                              key={i} 
                              className="subject-card"
                              style={{ cursor: 'pointer', touchAction: 'manipulation' }}
                              onClick={() => handleOpenSubject(subject.name)}
                            >
                              <div className="subject-card-top">
                                <div className="subject-card-icon-box"><BookOpen size={16} /></div>
                                <span className="subject-card-badge">{typeof subject.semester === 'number' ? `Sem ${subject.semester}` : subject.semester}</span>
                              </div>
                              <div className="subject-card-name" title={subject.name}>{subject.name}</div>
                              <div className="subject-card-stats">{subjectNotesCount} Notes • {subjectPyqsCount} PYQs {subjectVideosCount > 0 ? `• ${subjectVideosCount} Videos` : ''}</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Matching Notes & PYQs */}
              {filteredNotes.length > 0 ? (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                    Matching Study Notes & PYQ Papers ({filteredNotes.length}):
                  </div>
                  <div className="notes-grid">
                    {filteredNotes.map(note => (
                      <NoteCard 
                        key={note.id}
                        note={note}
                        isPurchased={purchasedIds.includes(note.id)}
                        isLoggedIn={!!user}
                        onPurchase={handlePurchaseTrigger}
                        onRead={onReadNote}
                        onNavigateToAuth={() => navigate('auth')}
                        purchaseDetails={purchaseDetailsMap[note.id]}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state glass-card" style={{ padding: '30px 20px', borderRadius: '16px', border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No study notes or subjects match "{searchQuery}". Try searching with another keyword.</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Subject Cards Grid */}
              {selectedYear && (
                <div className="subject-section fade-in" style={{ marginBottom: '35px' }}>
                  <div className="subject-section-header">
                    <h3 className="subject-section-title">
                      {selectedYear} Subjects {selectedSemester !== null ? `(Semester ${selectedSemester})` : ''}
                    </h3>
                  </div>
                  <div className="subject-cards-grid">
                    {getSubjectsForActiveFilter(selectedYear, selectedSemester, notes).map((subject, i) => {
                      if (subject.isComingSoon) {
                        return (
                          <div key={i} className="subject-card coming-soon">
                            <div className="subject-card-top">
                              <div className="subject-card-icon-box">
                                <BookOpen size={16} />
                              </div>
                              <span className="subject-card-badge">Coming Soon</span>
                            </div>
                            <div className="subject-card-name">{subject.name}</div>
                            <div className="subject-card-stats">Resources launching soon</div>
                          </div>
                        );
                      }

                      const subjectNotesCount = notes.filter(
                        n => isSameSubject(n.subject, subject.name) && isTrueStudyNote(n)
                      ).length;
                      const subjectPyqsCount = notes.filter(
                        n => isSameSubject(n.subject, subject.name) && n.type === 'pyqs'
                      ).length;
                      const subjectVideosCount = playlists.filter(
                        p => isSameSubject(p.subject, subject.name)
                      ).length;

                      return (
                        <div 
                          key={i} 
                          className="subject-card"
                          style={{ cursor: 'pointer', touchAction: 'manipulation' }}
                          onClick={() => handleOpenSubject(subject.name)}
                        >
                          <div className="subject-card-top">
                            <div className="subject-card-icon-box">
                              <BookOpen size={16} />
                            </div>
                            <span className="subject-card-badge">
                              {typeof subject.semester === 'number' ? `Sem ${subject.semester}` : subject.semester}
                            </span>
                          </div>
                          <div className="subject-card-name" title={subject.name}>{subject.name}</div>
                          <div className="subject-card-stats">
                            {subjectNotesCount} Notes • {subjectPyqsCount} PYQs {subjectVideosCount > 0 ? `• ${subjectVideosCount} Videos` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Semester Combo Bundles Section (Below Subject Cards Grid) */}
              {(() => {
                const getBundleSemester = (b: Bundle): number => {
                  const title = b.title.toLowerCase();
                  if (title.includes('sem 3') || title.includes('sem-3') || title.includes('semester 3') || title.includes('sem3') || title.includes('3 semester') || title.includes('cobo 3') || title.includes('combo 3')) return 3;
                  if (title.includes('sem 4') || title.includes('sem-4') || title.includes('semester 4') || title.includes('sem4') || title.includes('4 semester') || title.includes('cobo 4') || title.includes('combo 4')) return 4;
                  if (title.includes('sem 1') || title.includes('sem-1') || title.includes('semester 1') || title.includes('sem1') || title.includes('1 semester')) return 1;
                  if (title.includes('sem 2') || title.includes('sem-2') || title.includes('semester 2') || title.includes('sem2') || title.includes('2 semester')) return 2;
                  if (b.semester && Number(b.semester) > 0) return Number(b.semester);
                  return 3;
                };

                const getBundleYear = (b: Bundle): string => {
                  const sem = getBundleSemester(b);
                  if (sem === 1 || sem === 2) return '1st Year';
                  if (sem === 3 || sem === 4) return '2nd Year';
                  if (sem === 5 || sem === 6) return '3rd Year';
                  if (sem === 7 || sem === 8) return '4th Year';
                  if (b.year) return b.year;
                  return '2nd Year';
                };

                const semesterComboBundles = bundles.filter(b => {
                  if (deriveBundleType(b) === 'subject') return false;
                  
                  const bYear = getBundleYear(b);
                  const bSem = getBundleSemester(b);

                  const matchesYear = !selectedYear || bYear === selectedYear;
                  const matchesSem = selectedSemester === null || Number(bSem) === Number(selectedSemester);
                  return matchesYear && matchesSem;
                });

                if (semesterComboBundles.length === 0) return null;

                return (
                  <div className="bundles-container" style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '4px' }} className="yellow-accent">
                      Semester Combo Packs (6 Months Validity)
                    </h3>
                    <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '20px' }}>
                      Save more by unlocking all study notes for your active semester at a discounted combo rate.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                      {semesterComboBundles.map(bundle => {
                        const isPurchased = purchasedBundleIds.includes(bundle.id);
                        const expiry = bundlePurchaseDetailsMap[bundle.id];

                        const normalSum = bundle.notesIds.reduce((sum, id) => {
                          const note = notes.find(n => n.id === id);
                          return sum + (note ? note.price : 99);
                        }, 0);

                        const getBundleSubjectsList = (b: Bundle): string[] => {
                          const decoded = decodeBundleFromDb(b);
                          if (decoded.subjects && Array.isArray(decoded.subjects) && decoded.subjects.filter(Boolean).length > 0) {
                            return decoded.subjects.filter(Boolean);
                          }

                          return getSubjectsForActiveFilter(b.year, b.semester)
                            .map(s => s.name);
                        };

                        const includedSubjectsList = getBundleSubjectsList(bundle);

                        return (
                          <div 
                            key={bundle.id} 
                            className="glass-card semester-bundle-card fade-in"
                            style={{
                              borderRadius: '20px',
                              padding: '20px 24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '20px',
                              flexWrap: 'wrap',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Ambient Background Glow */}
                            <div className="bundle-ambient-glow" style={{
                              position: 'absolute',
                              top: '-30px',
                              right: '-30px',
                              width: '140px',
                              height: '140px',
                              borderRadius: '50%',
                              pointerEvents: 'none'
                            }} />

                            {/* Left Column: Badge, Title & Compact Subject Tags */}
                            <div style={{ flex: 1, minWidth: '240px', textAlign: 'left' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span className="semester-bundle-badge" style={{
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  padding: '3px 10px',
                                  borderRadius: '100px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {isPurchased ? 'Unlocked Pack' : '🔥 Semester Discount Combo'}
                                </span>
                                <span className="pack-access-text" style={{ fontSize: '11px', fontWeight: '600' }}>
                                  6 Months Access
                                </span>
                              </div>

                              <h4 className="semester-bundle-title" style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px 0' }}>
                                {bundle.title}
                              </h4>

                              {/* Compact Subject Tags (No Paragraph Text!) */}
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {includedSubjectsList.map((subjName, idx) => (
                                  <span 
                                    key={idx} 
                                    className="bundle-subject-chip"
                                    onClick={() => {
                                      setSelectedSubject(subjName);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      padding: '3px 10px',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title={`Tap to open ${subjName}`}
                                  >
                                    <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                                    {subjName}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Right Column: Price & Action */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                              {!isPurchased && (
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', textDecoration: 'line-through' }}>
                                    ₹{bundle.originalPrice ?? (normalSum || bundle.price + 100)}
                                  </div>
                                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>
                                    ₹{bundle.price}
                                  </div>
                                </div>
                              )}

                              {user ? (
                                isPurchased ? (
                                  <div style={{ textAlign: 'center' }}>
                                    <button className="btn-secondary" style={{ pointerEvents: 'none', opacity: 0.9, fontSize: '13px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '700', borderRadius: '10px' }}>
                                      ✓ Unlocked & Active
                                    </button>
                                    {expiry && (
                                      <div style={{ fontSize: '10px', color: 'var(--color-yellow)', fontWeight: '700', marginTop: '4px' }}>
                                        {expiry.daysLeft !== null && expiry.daysLeft !== undefined ? `${expiry.daysLeft} Days Left` : '180 Days Left'}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button 
                                    className="btn-primary" 
                                    onClick={() => handleBundlePurchaseTrigger(bundle.id, bundle.price)}
                                    style={{ fontSize: '13px', padding: '10px 20px', fontWeight: '700', borderRadius: '12px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}
                                  >
                                    Unlock Combo
                                  </button>
                                )
                              ) : (
                                <button 
                                  className="btn-primary" 
                                  onClick={() => navigate('auth')}
                                  style={{ fontSize: '13px', padding: '10px 20px', fontWeight: '700', borderRadius: '12px' }}
                                >
                                  Sign In to Unlock
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}

      {/* Razorpay Gateway Status Modal Overlay */}
      {paymentTarget && (
        <div className="locked-preview-overlay" style={{ background: 'rgba(5, 7, 16, 0.9)', zIndex: 105 }}>
          <div className="auth-card glass-card fade-in" style={{ maxWidth: '420px', padding: '30px' }}>
            {paymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={56} style={{ color: 'var(--color-success)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Payment Successful</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Item unlocked! Updating library...</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '20px' }}>
                  <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '700' }}>Razorpay Secure Gateway</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Paying For ({paymentTarget.type === 'bundle' ? 'Combo Bundle' : 'Notes Pack'})</div>
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '8px', color: 'var(--color-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {paymentTarget.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '8px' }}>
                    <span style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Amount Due:</span>
                    <strong className="yellow-accent" style={{ fontSize: '16px' }}>₹{paymentTarget.price}.00</strong>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <ShieldCheck size={14} color="var(--color-success)" /> 6-Month validity begins on payment success
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn-secondary flex-1" 
                    onClick={() => {
                      setPaymentTarget(null);
                      setPaying(false);
                    }}
                  >
                    Close
                  </button>
                  <button 
                    className="btn-primary flex-1" 
                    onClick={() => executePurchase(paymentTarget.id, paymentTarget.price, paymentTarget.type, paymentTarget.title)}
                    style={{ justifyContent: 'center' }}
                  >
                    {paying ? 'Opening Gateway...' : 'Retry Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
