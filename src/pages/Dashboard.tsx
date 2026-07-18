import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, ShieldCheck, User, BookOpen } from 'lucide-react';
import { dbService, isMock } from '../lib/supabase';
import type { Note, UserProfile, Bundle, Playlist } from '../lib/supabase';
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

  // Load notes, bundles, playlists, and user purchases
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: notesData } = await dbService.getNotes(selectedYear);
      const activeNotes = notesData || [];
      setNotes(activeNotes);

      const { data: bundlesData } = await dbService.getBundles(selectedYear);
      const activeBundles = bundlesData || [];
      setBundles(activeBundles);

      const { data: playlistsData } = await dbService.getPlaylists(selectedYear);
      setPlaylists(playlistsData || []);

      if (user) {
        // Load note purchase states
        const owned = await dbService.getPurchasedNotes();
        setPurchasedIds((owned.data || []).map(n => n.id));

        const detailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
        for (const note of activeNotes) {
          const details = await dbService.getPurchaseDetails(note.id);
          if (details.purchased) {
            detailsMap[note.id] = { expiresAt: details.expiresAt, daysLeft: details.daysLeft };
          }
        }
        setPurchaseDetailsMap(detailsMap);

        // Load bundle purchase states
        const ownedBundles: string[] = [];
        const bDetailsMap: Record<string, { expiresAt: string | null; daysLeft: number | null }> = {};
        for (const bundle of activeBundles) {
          const details = await dbService.isBundlePurchased(bundle.id);
          if (details.purchased) {
            ownedBundles.push(bundle.id);
            bDetailsMap[bundle.id] = { expiresAt: details.expiresAt, daysLeft: details.daysLeft };
          }
        }
        setPurchasedBundleIds(ownedBundles);
        setBundlePurchaseDetailsMap(bDetailsMap);
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
    const matchesSubject = selectedSubject === null || p.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchesSem && matchesSubject;
  });

  // Handle Purchase Triggers
  const handlePurchaseTrigger = (noteId: string, price: number) => {
    if (!user) {
      navigate('auth');
      return;
    }
    const note = notes.find(n => n.id === noteId);
    setPaymentTarget({ 
      id: noteId, 
      price, 
      type: 'notes', 
      title: note ? note.title : 'Study Lecture Notes Pack' 
    });
  };

  const handleBundlePurchaseTrigger = (bundleId: string, price: number) => {
    if (!user) {
      navigate('auth');
      return;
    }
    const bundle = bundles.find(b => b.id === bundleId);
    setPaymentTarget({ 
      id: bundleId, 
      price, 
      type: 'bundle', 
      title: bundle ? bundle.title : 'Semester Combo Pack' 
    });
  };

  // Simulate Razorpay checkout process (Mock) or handle live Razorpay integration
  const processCheckout = async (simulateSuccess: boolean) => {
    if (!paymentTarget || !user) return;
    setPaying(true);

    if (isMock) {
      // Mock payment delay
      setTimeout(async () => {
        if (simulateSuccess) {
          let res;
          if (paymentTarget.type === 'notes') {
            res = await dbService.purchaseNotes(paymentTarget.id);
          } else {
            res = await dbService.purchaseBundle(paymentTarget.id);
          }

          if (res.success) {
            setPaymentSuccess(true);
            await loadDashboardData(); // Refresh all purchases
          }
        }
        setPaying(false);
        // Clear success popup after 2 seconds
        setTimeout(() => {
          setPaymentTarget(null);
          setPaymentSuccess(false);
        }, 1800);
      }, 1200);
    } else {
      // Live deployment checkout simulation trigger
      let res;
      if (paymentTarget.type === 'notes') {
        res = await dbService.purchaseNotes(paymentTarget.id);
      } else {
        res = await dbService.purchaseBundle(paymentTarget.id);
      }
      if (res.success) {
        setPaymentSuccess(true);
        await loadDashboardData();
      }
      setPaying(false);
      setTimeout(() => {
        setPaymentTarget(null);
        setPaymentSuccess(false);
      }, 1500);
    }
  };

  return (
    <div className="dashboard-container container fade-in">
      {/* Background blobs */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Premium Welcome Header Card */}
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
      ) : (
        <>
          {/* Subject Cards Grid */}
          {selectedYear && (
            <div className="subject-section fade-in" style={{ marginBottom: '35px' }}>
              <div className="subject-section-header">
                <h3 className="subject-section-title">
                  {selectedYear} Subjects {selectedSemester !== null ? `(Semester ${selectedSemester})` : ''}
                </h3>
                {selectedSubject && (
                  <div className="subject-filter-indicator">
                    <span>Filtered by: <strong>{selectedSubject}</strong></span>
                    <button className="subject-filter-clear" onClick={() => setSelectedSubject(null)}>
                      Clear
                    </button>
                  </div>
                )}
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

                  const isActive = selectedSubject === subject.name;

                  return (
                    <div 
                      key={i} 
                      className={`subject-card ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedSubject(isActive ? null : subject.name)}
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

          {/* Semester Combo Bundles Section */}
          {selectedSubject === null && bundles.filter(b => (b.type === 'semester' || !b.type) && (selectedSemester === null || b.semester === selectedSemester)).length > 0 && (
            <div className="bundles-container">
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

                    // Calculate normal bundle value (sum of note prices included)
                    const normalSum = bundle.notesIds.reduce((sum, id) => {
                      const note = notes.find(n => n.id === id);
                      return sum + (note ? note.price : 99);
                    }, 0);

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

                        {/* Column 2: Included Resources */}
                        <div className="bundle-banner-includes">
                          <div className="bundle-banner-includes-title">Resources Included</div>
                          <ul className="bundle-banner-includes-list">
                            {bundle.notesIds.map(noteId => {
                              const noteItem = notes.find(n => n.id === noteId);
                              return (
                                <li key={noteId} className="bundle-banner-includes-item">
                                  <CheckCircle2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {noteItem ? noteItem.title : 'Engineering Lecture Notes'}
                                  </span>
                                </li>
                              );
                            })}
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
                                    {expiry.daysLeft !== null && expiry.daysLeft > 365 ? 'Lifetime Access' : `${expiry.daysLeft} Days Left`}
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

          {/* Subject Study Bundles Section */}
          {bundles.filter(b => b.type === 'subject' && (selectedSemester === null || b.semester === selectedSemester) && (selectedSubject === null || b.subject?.toLowerCase() === selectedSubject.toLowerCase())).length > 0 && (
            <div className="bundles-container">
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '4px' }} className="blue-accent">
                Subject Study Bundles (6 Months Validity)
              </h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '20px' }}>
                Unlock all units, PYQs, and solutions of this specific subject at a discounted rate.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                {bundles
                  .filter(b => b.type === 'subject' && (selectedSemester === null || b.semester === selectedSemester) && (selectedSubject === null || b.subject?.toLowerCase() === selectedSubject.toLowerCase()))
                  .map(bundle => {
                    const isPurchased = purchasedBundleIds.includes(bundle.id);
                    const expiry = bundlePurchaseDetailsMap[bundle.id];

                    // Calculate normal bundle value (sum of note prices included)
                    const normalSum = bundle.notesIds.reduce((sum, id) => {
                      const note = notes.find(n => n.id === id);
                      return sum + (note ? note.price : 99);
                    }, 0);

                    return (
                      <div key={bundle.id} className="bundle-banner-card fade-in" style={{ borderColor: 'rgba(96, 165, 250, 0.25)' }}>
                        {/* Column 1: Details */}
                        <div>
                          <div className="bundle-banner-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            {isPurchased ? 'Unlocked Subject Bundle' : '⚡ Subject All-In-One Pack'}
                          </div>
                          <h4 className="bundle-banner-title">{bundle.title}</h4>
                          <p className="bundle-banner-desc">{bundle.description}</p>
                        </div>

                        {/* Column 2: Included Resources */}
                        <div className="bundle-banner-includes">
                          <div className="bundle-banner-includes-title">Resources Included</div>
                          <ul className="bundle-banner-includes-list">
                            {bundle.notesIds.map(noteId => {
                              const noteItem = notes.find(n => n.id === noteId);
                              return (
                                <li key={noteId} className="bundle-banner-includes-item">
                                  <CheckCircle2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {noteItem ? noteItem.title : 'Engineering Lecture Notes'}
                                  </span>
                                </li>
                              );
                            })}
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
                                    {expiry.daysLeft !== null && expiry.daysLeft > 365 ? 'Lifetime Access' : `${expiry.daysLeft} Days Left`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button 
                                className="btn-primary w-full" 
                                style={{ justifyContent: 'center' }}
                                onClick={() => handleBundlePurchaseTrigger(bundle.id, bundle.price)}
                              >
                                Unlock Bundle
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

          {/* Individual Notes Section */}
          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700' }} className="blue-accent">
              Individual Subject Notes (6 Months Validity)
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '20px' }}>
              Choose specific subject modules to unlock individually with 6-month license coverage.
            </p>
          </div>

          {studyNotes.length > 0 ? (
            <div className="notes-grid" style={{ marginBottom: '30px' }}>
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
            <div className="empty-state glass-card" style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.01)', marginBottom: '30px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '500' }}>
                No subject study notes available for this semester.
              </span>
            </div>
          )}

          {/* Exam PYQs Section */}
          <div style={{ textAlign: 'left', marginBottom: '15px', marginTop: '30px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700' }} className="blue-accent">
              Previous Year Questions - PYQs (6 Months Validity)
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '20px' }}>
              Solve official past engineering exams with verified step-by-step solutions.
            </p>
          </div>

          {pyqs.length > 0 ? (
            <div className="notes-grid">
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
            <div className="empty-state glass-card" style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '500' }}>
                No past year exam PYQs available for this semester.
              </span>
            </div>
          )}
        </>
      )}

      {/* Video Solutions / Playlists Section */}
      <section className="section-padding" style={{ paddingTop: '50px', borderTop: '1px solid var(--glass-border)', marginTop: '50px' }}>
        <div style={{ textAlign: 'left', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '700' }} className="yellow-accent">
            Video Solutions & Syllabus Lectures
          </h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '25px' }}>
            Learn complex engineering topics step-by-step through our synced YouTube course playlists.
          </p>
        </div>
        
        {filteredPlaylists.length > 0 ? (
          <div className="video-grid">
            {filteredPlaylists.map((p) => (
              <VideoCard key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-card" style={{ padding: '40px 20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.06)' }}>
            No video playlists configured yet for this semester.
          </div>
        )}
      </section>

      {/* Razorpay Test Payment Modal Simulator */}
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
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '700' }}>Razorpay Checkout (Sandbox)</span>
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
                    onClick={() => setPaymentTarget(null)}
                    disabled={paying}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary flex-1" 
                    onClick={() => processCheckout(true)}
                    disabled={paying}
                    style={{ justifyContent: 'center' }}
                  >
                    {paying ? 'Processing...' : 'Pay with UPI/Card'}
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
