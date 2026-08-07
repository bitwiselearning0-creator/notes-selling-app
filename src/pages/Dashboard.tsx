import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, ShieldCheck, User, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { dbService } from '../lib/supabase';
import type { Note, UserProfile, Bundle, Playlist } from '../lib/supabase';
import { openRazorpayCheckout } from '../lib/razorpay';
import { NoteCard } from '../components/NoteCard';
import { VideoCard } from '../components/VideoCard';

interface SubjectItem {
  name: string;
  semester: number | 'Common' | 'Coming Soon';
  isComingSoon?: boolean;
}

const getSubjectsForActiveFilter = (
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year',
  sem: number | null
): SubjectItem[] => {
  if (year === '1st Year') {
    return [
      { name: 'Engineering Physics', semester: 'Common' },
      { name: 'Engineering Chemistry', semester: 'Common' },
      { name: 'Engineering Mathematics-I', semester: 'Common' },
      { name: 'Programming for Problem Solving', semester: 'Common' },
      { name: 'Fundamentals of Electronics Engineering', semester: 'Common' },
      { name: 'Environment and Ecology', semester: 'Common' },
      { name: 'Soft Skills', semester: 'Common' }
    ];
  }
  if (year === '2nd Year') {
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

    if (sem === 3) return [...sem3, ...common];
    if (sem === 4) return [...sem4, ...common];
    return [...sem3, ...sem4, ...common];
  }
  if (year === '3rd Year') {
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

    if (sem === 5) return [...sem5, ...common];
    if (sem === 6) return [...sem6, ...common];
    return [...sem5, ...sem6, ...common];
  }
  if (year === '4th Year') {
    return [
      { name: 'Semester 7 subjects', semester: 'Coming Soon', isComingSoon: true },
      { name: 'Semester 8 subjects', semester: 'Coming Soon', isComingSoon: true }
    ];
  }
  return [];
};

interface DashboardProps {
  user: UserProfile | null;
  selectedYear: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  setSelectedYear: (year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year') => void;
  onReadNote: (note: Note) => void;
  navigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  selectedYear,
  setSelectedYear,
  onReadNote,
  navigate
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
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Loading & payment states
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<{ id: string; price: number; type: 'notes' | 'bundle'; title: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Load notes, bundles, playlists, and user purchases in high-performance batch
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [notesRes, bundlesRes, playlistsRes] = await Promise.all([
        dbService.getNotes(selectedYear),
        dbService.getBundles(selectedYear),
        dbService.getPlaylists(selectedYear)
      ]);

      const activeNotes = notesRes.data || [];
      const activeBundles = bundlesRes.data || [];
      setNotes(activeNotes);
      setBundles(activeBundles);
      setPlaylists(playlistsRes.data || []);

      if (user) {
        const purchaseState = await dbService.getAllUserPurchasesState();
        setPurchasedIds(purchaseState.purchasedNoteIds);
        setPurchaseDetailsMap(purchaseState.noteDetailsMap);
        setPurchasedBundleIds(purchaseState.purchasedBundleIds);
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
  }, [selectedYear, user]);

  // Handle physical/browser back button for Dashboard Subject Detail View and Search
  useEffect(() => {
    const handlePopState = () => {
      if (selectedSubject !== null) {
        setSelectedSubject(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (searchQuery.trim() !== '') {
        setSearchQuery('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedSubject, searchQuery]);

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

  // Filter notes based on search, sem filter & subject filter
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSem = selectedSemester === null || n.semester === selectedSemester;
    const matchesSubject = selectedSubject === null || n.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchesSearch && matchesSem && matchesSubject;
  });

  const studyNotes = filteredNotes.filter(n => n.type !== 'pyqs');
  const pyqs = filteredNotes.filter(n => n.type === 'pyqs');

  // Filter playlists based on semester & subject selection
  const filteredPlaylists = playlists.filter(p => {
    const matchesSem = selectedSemester === null || p.semester === selectedSemester;
    if (selectedSubject) {
      const subLower = selectedSubject.toLowerCase();
      const pSubLower = p.subject.toLowerCase();

      const isMath4Match = (subLower.includes('math') && (subLower.includes('4') || subLower.includes('iv'))) &&
                           (pSubLower.includes('math') && (pSubLower.includes('4') || pSubLower.includes('iv')));
      const isCoaMatch = (subLower.includes('coa') || subLower.includes('computer organization')) &&
                         (pSubLower.includes('coa') || pSubLower.includes('computer organization'));

      const matchesSubject = pSubLower === subLower || 
                             pSubLower.includes(subLower) || 
                             subLower.includes(pSubLower) ||
                             isMath4Match ||
                             isCoaMatch;

      return matchesSubject;
    }
    return matchesSem;
  });

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

        let res;
        if (type === 'notes') {
          res = await dbService.purchaseNotes(targetId, paymentDetails);
        } else {
          res = await dbService.purchaseBundle(targetId, paymentDetails);
        }

        if (res.success) {
          setPaymentSuccess(true);
          await loadDashboardData(); // Refresh all purchases
        }
        setPaying(false);

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
    <div className="dashboard-container container fade-in">
      {/* Background blobs */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Premium Welcome Header Card (Only visible on main catalog page) */}
      {selectedSubject === null && (
        <div className="glass-card welcome-dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.45) 100%)',
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
        <div className="subject-detail-view fade-in">
          {/* Back Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <button 
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}
              onClick={() => {
                setSelectedSubject(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ArrowLeft size={18} />
              <span>Back to Catalog</span>
            </button>

            <div style={{ fontSize: '13px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Catalog</span>
              <span>/</span>
              <span>{selectedYear}</span>
              {selectedSemester !== null && (
                <>
                  <span>/</span>
                  <span>Semester {selectedSemester}</span>
                </>
              )}
              <span>/</span>
              <span style={{ color: 'var(--color-yellow)', fontWeight: '600' }}>{selectedSubject}</span>
            </div>
          </div>

          {/* Subject Hero Header */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '32px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
            boxShadow: '0 12px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-blue-light)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                flexShrink: 0
              }}>
                <BookOpen size={32} />
              </div>
              <div>
                <span className="semester-tag" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedYear} • {selectedSemester !== null ? `Semester ${selectedSemester}` : 'Subject Portal'}
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-white)', margin: '4px 0 8px 0' }}>
                  {selectedSubject}
                </h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-muted)' }}>
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
              onClick={() => {
                setSelectedSubject(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ fontSize: '13px' }}
            >
              All Subjects
            </button>
          </div>

          {/* Subject All-In-One Bundle Card (if any exists for this subject) */}
          {bundles.filter(b => b.type === 'subject' && b.subject?.toLowerCase() === selectedSubject.toLowerCase()).map(bundle => {
            const isPurchased = purchasedBundleIds.includes(bundle.id);
            const expiry = bundlePurchaseDetailsMap[bundle.id];
            const normalSum = bundle.notesIds.reduce((sum, id) => {
              const note = notes.find(n => n.id === id);
              return sum + (note ? note.price : 99);
            }, 0);

            return (
              <div key={bundle.id} className="bundle-banner-card fade-in" style={{ marginBottom: '32px', borderColor: 'rgba(96, 165, 250, 0.3)' }}>
                <div>
                  <div className="bundle-banner-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    {isPurchased ? 'Unlocked Subject Pack' : '⚡ Subject All-In-One Pack'}
                  </div>
                  <h4 className="bundle-banner-title">{bundle.title}</h4>
                  <p className="bundle-banner-desc">{bundle.description}</p>
                </div>
                <div className="bundle-banner-includes">
                  <div className="bundle-banner-includes-title">Includes Everything</div>
                  <ul className="bundle-banner-includes-list">
                    <li className="bundle-banner-includes-item">
                      <CheckCircle2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                      <span>All Syllabus Units + PYQs & Solutions</span>
                    </li>
                  </ul>
                </div>
                <div className="bundle-banner-checkout">
                  <div className="bundle-banner-price-box">
                    {!isPurchased && (
                      <span className="bundle-banner-original-price">₹{bundle.originalPrice ?? (normalSum || bundle.price + 100)}</span>
                    )}
                    <span className="bundle-banner-price">₹{bundle.price}</span>
                  </div>
                  {user ? (
                    isPurchased ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <button className="btn-secondary w-full" style={{ pointerEvents: 'none', opacity: 0.8 }}>Unlocked</button>
                        {expiry && (
                          <span style={{ fontSize: '11px', color: 'var(--color-yellow)', fontWeight: '700' }}>
                            {expiry.daysLeft !== null && expiry.daysLeft !== undefined ? (expiry.daysLeft > 365 ? 'Lifetime Access' : `${expiry.daysLeft} Days Left`) : '6 Months Validity'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button className="btn-primary w-full" onClick={() => handleBundlePurchaseTrigger(bundle.id, bundle.price)}>Unlock All Units</button>
                    )
                  ) : (
                    <button className="btn-primary w-full" onClick={() => navigate('auth')}>Sign In to Unlock</button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Individual Unit Notes Section */}
          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700' }} className="blue-accent">
              {selectedSubject} - Unit Study Notes (6 Months Validity)
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '20px' }}>
              Choose specific unit notes to read or unlock.
            </p>
          </div>

          {studyNotes.length > 0 ? (
            <div className="notes-grid" style={{ marginBottom: '36px' }}>
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
            <div className="empty-state glass-card" style={{ padding: '30px 20px', borderRadius: '16px', border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.01)', marginBottom: '36px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No study notes published yet for {selectedSubject}.</span>
            </div>
          )}

          {/* Exam PYQs Section */}
          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700' }} className="blue-accent">
              {selectedSubject} - Previous Year Questions (PYQs)
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '20px' }}>
              Official past engineering exams with step-by-step solutions.
            </p>
          </div>

          {pyqs.length > 0 ? (
            <div className="notes-grid" style={{ marginBottom: '36px' }}>
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
            <div className="empty-state glass-card" style={{ padding: '30px 20px', borderRadius: '16px', border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.01)', marginBottom: '36px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No PYQ papers published yet for {selectedSubject}.</span>
            </div>
          )}

          {/* Video Solutions / Playlists Section */}
          {filteredPlaylists.length > 0 && (
            <section style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700' }} className="yellow-accent">
                  {selectedSubject} - Video Lectures & YouTube Course Playlists
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
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Loading State */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', gap: '10px', alignItems: 'center', color: 'var(--color-muted)' }}>
              <Loader2 className="animate-spin" size={24} color="var(--color-blue-light)" />
              <span>Loading catalog materials...</span>
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
              {getSubjectsForActiveFilter(selectedYear, selectedSemester)
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())).length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                      Matching Subjects:
                    </div>
                    <div className="subject-cards-grid">
                      {getSubjectsForActiveFilter(selectedYear, selectedSemester)
                        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                        .map((subject, i) => {
                          const subjectNotesCount = notes.filter(n => n.subject.toLowerCase() === subject.name.toLowerCase() && n.type !== 'pyqs').length;
                          const subjectPyqsCount = notes.filter(n => n.subject.toLowerCase() === subject.name.toLowerCase() && n.type === 'pyqs').length;
                          const subjectVideosCount = playlists.filter(p => p.subject.toLowerCase() === subject.name.toLowerCase()).length;

                          return (
                            <div 
                              key={i} 
                              className="subject-card"
                              style={{ cursor: 'pointer', touchAction: 'manipulation' }}
                              onClick={() => {
                                setSelectedSubject(subject.name);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
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
                    {getSubjectsForActiveFilter(selectedYear, selectedSemester).map((subject, i) => {
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
                        n => n.subject.toLowerCase() === subject.name.toLowerCase() && n.type !== 'pyqs'
                      ).length;
                      const subjectPyqsCount = notes.filter(
                        n => n.subject.toLowerCase() === subject.name.toLowerCase() && n.type === 'pyqs'
                      ).length;
                      const subjectVideosCount = playlists.filter(
                        p => p.subject.toLowerCase() === subject.name.toLowerCase()
                      ).length;

                      return (
                        <div 
                          key={i} 
                          className="subject-card"
                          style={{ cursor: 'pointer', touchAction: 'manipulation' }}
                          onClick={() => {
                            setSelectedSubject(subject.name);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
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
              {bundles.filter(b => (b.type === 'semester' || !b.type) && (selectedSemester === null || b.semester === selectedSemester)).length > 0 && (
                <div className="bundles-container" style={{ marginTop: '30px' }}>
                  <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '4px' }} className="yellow-accent">
                    Semester Combo Packs (6 Months Validity)
                  </h3>
                  <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '20px' }}>
                    Save more by unlocking all study notes for your active semester at a discounted combo rate.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                    {bundles
                      .filter(b => (b.type === 'semester' || !b.type) && (selectedSemester === null || b.semester === selectedSemester))
                      .map(bundle => {
                        const isPurchased = purchasedBundleIds.includes(bundle.id);
                        const expiry = bundlePurchaseDetailsMap[bundle.id];

                        const normalSum = bundle.notesIds.reduce((sum, id) => {
                          const note = notes.find(n => n.id === id);
                          return sum + (note ? note.price : 99);
                        }, 0);

                        const getBundleSubjectsList = (b: Bundle): string[] => {
                          // 1. Return strictly the subjects selected by the admin in Admin Panel
                          if (b.subjects && Array.isArray(b.subjects)) {
                            return b.subjects.filter(s => s && !s.toLowerCase().includes('pyq'));
                          }

                          // 2. Fallback for legacy bundle objects: extract subjects from notesIds
                          if (b.notesIds && Array.isArray(b.notesIds) && b.notesIds.length > 0) {
                            const fromNotes = b.notesIds
                              .map(id => notes.find(n => n.id === id)?.subject)
                              .filter((s): s is string => !!s && !s.toLowerCase().includes('pyq'));
                            const uniqueFromNotes = Array.from(new Set(fromNotes));
                            if (uniqueFromNotes.length > 0) {
                              return uniqueFromNotes;
                            }
                          }

                          // 3. Default fallback only if no subjects array or notes exist
                          return getSubjectsForActiveFilter(b.year, b.semester).map(s => s.name);
                        };

                        const includedSubjectsList = getBundleSubjectsList(bundle);

                        return (
                          <div key={bundle.id} className="bundle-banner-card fade-in">
                            {/* Column 1: Details */}
                            <div>
                              <div className="bundle-banner-badge">
                                {isPurchased ? 'Unlocked Combo Pack' : '🔥 Semester Discount Combo'}
                              </div>
                              <h4 className="bundle-banner-title">{bundle.title}</h4>
                              <p className="bundle-banner-desc">{bundle.description}</p>
                            </div>

                            {/* Column 2: Included Subjects */}
                            <div className="bundle-banner-includes">
                              <div className="bundle-banner-includes-title">Subjects Included ({includedSubjectsList.length} Subjects)</div>
                              <ul className="bundle-banner-includes-list">
                                {includedSubjectsList.map((subjName, idx) => (
                                  <li 
                                    key={idx} 
                                    className="bundle-banner-includes-item"
                                    style={{ cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center' }}
                                    onClick={() => {
                                      setSelectedSubject(subjName);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    title={`Tap to open ${subjName} notes & resources`}
                                  >
                                    <CheckCircle2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>
                                      {subjName}
                                    </span>
                                    <ArrowRight size={10} style={{ color: 'var(--color-yellow)', marginLeft: 'auto', opacity: 0.8, flexShrink: 0 }} />
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Column 3: Price & Actions */}
                            <div className="bundle-banner-checkout">
                              <div className="bundle-banner-price-box">
                                {!isPurchased && (
                                  <span className="bundle-banner-original-price">
                                    ₹{bundle.originalPrice ?? (normalSum || bundle.price + 100)}
                                  </span>
                                )}
                                <span className="bundle-banner-price">₹{bundle.price}</span>
                              </div>

                              {user ? (
                                isPurchased ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                    <button className="btn-secondary w-full" style={{ pointerEvents: 'none', opacity: 0.8, justifyContent: 'center' }}>
                                      Active & Unlocked
                                    </button>
                                    {expiry && (
                                      <span style={{ fontSize: '11px', color: 'var(--color-yellow)', fontWeight: '700' }}>
                                        {expiry.daysLeft !== null && expiry.daysLeft !== undefined ? (expiry.daysLeft > 365 ? 'Lifetime Access' : `${expiry.daysLeft} Days Left`) : '6 Months Validity'}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button 
                                    className="btn-primary w-full" 
                                    style={{ justifyContent: 'center' }}
                                    onClick={() => handleBundlePurchaseTrigger(bundle.id, bundle.price)}
                                  >
                                    Unlock Combo
                                  </button>
                                )
                              ) : (
                                <button className="btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('auth')}>
                                  Sign In to Unlock
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
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
