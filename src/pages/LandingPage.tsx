import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Sparkles, Video, CheckCircle2, ShieldCheck } from 'lucide-react';
import { dbService } from '../lib/dbService';
import type { Playlist } from '../lib/dbService';
import { VideoCard } from '../components/VideoCard';
import { FAQ } from '../components/FAQ';

interface LandingPageProps {
  navigate: (page: string) => void;
  setSelectedYear: (year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate, setSelectedYear }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [learners, setLearners] = useState(0);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  // Load playlists & fetch channel statistics from YouTube API
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data } = await dbService.getPlaylists();
      setPlaylists(data || []);
    };
    fetchPlaylists();

    // Stats counter animation helper
    const animateCount = (target: number, setter: React.Dispatch<React.SetStateAction<number>>, duration: number) => {
      let start = 0;
      const steps = 50;
      const increment = Math.ceil(target / steps);
      const stepTime = duration / steps;
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(start);
        }
      }, stepTime);
      return timer;
    };

    let learnersTimer: any = null;
    let viewsTimer: any = null;
    let likesTimer: any = null;
    let commentsTimer: any = null;

    const fetchStats = async () => {
      let targetSubscribers = 5550; // Fallback standard subscribers
      let targetViews = 1077672;    // Fallback standard views

      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCqOS38WVZe4LpnHEXZvdsfA&key=AIzaSyD0v_Fg9i_EDyHAgkD_1eCzXXWreaI_FDo`
        );
        const json = await response.json();
        if (json.items && json.items[0]) {
          const stats = json.items[0].statistics;
          targetSubscribers = parseInt(stats.subscriberCount) || 5550;
          targetViews = parseInt(stats.viewCount) || 1077672;
        }
      } catch (err) {
        console.error('Error fetching YouTube statistics:', err);
      }

      const targetLikes = Math.floor(targetViews * 0.05);
      const targetComments = Math.floor(targetViews * 0.035);

      // Trigger animations
      learnersTimer = animateCount(targetSubscribers, setLearners, 1500);
      viewsTimer = animateCount(targetViews, setViews, 1500);
      likesTimer = animateCount(targetLikes, setLikes, 1500);
      commentsTimer = animateCount(targetComments, setComments, 1500);
    };

    fetchStats();

    return () => {
      if (learnersTimer) clearInterval(learnersTimer);
      if (viewsTimer) clearInterval(viewsTimer);
      if (likesTimer) clearInterval(likesTimer);
      if (commentsTimer) clearInterval(commentsTimer);
    };
  }, []);

  // Typewriter effect state engine for 1-2 words at the end of Line 2
  const highlightWords = [
    'Handwritten Notes!',
    'Solved PYQs!',
    'One-Shot Packs!',
    'Complete Ease!'
  ];

  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = highlightWords[wordIndex];

    const typingSpeed = isDeleting ? 40 : 85;
    const pauseDelay = isDeleting ? 40 : 2000;

    if (!isDeleting && charIndex === currentWord.length) {
      const timeout = setTimeout(() => setIsDeleting(true), pauseDelay);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % highlightWords.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, wordIndex]);

  const typedWord = highlightWords[wordIndex].slice(0, charIndex);

  const handleYearClick = (year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year') => {
    setSelectedYear(year);
    navigate('dashboard');
  };

  return (
    <div className="fade-in landing-page-wrapper">
      {/* Liquid background decorative elements */}
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Hero Section */}
      <header className="hero container" style={{ position: 'relative' }}>
        <div className="hero-badge">
          <Sparkles size={14} className="yellow-accent" />
          <span>One-Shot Mastery For Engineering Students</span>
        </div>
        <h1 className="hero-title">
          <div>Level Up Your Engineering Preparation</div>
          <div>Master Subjects with <span style={{ color: '#38bdf8' }}>{typedWord}<span className="typewriter-cursor">|</span></span></div>
        </h1>
        <p className="hero-desc">
          Welcome to <strong>Bitwise Learning!</strong> Download premier <strong>AKTU BTech handwritten study notes</strong>, unit-wise revision bundles, solved PYQ question papers, and syllabus video lectures for 1st, 2nd, 3rd, and 4th year CSE/IT engineering students.
        </p>
        <div className="hero-ctas">
          <button className="btn-primary" onClick={() => navigate('dashboard')}>
            Explore Study Notes <ArrowRight size={16} />
          </button>
          <a href="#youtube-videos" className="btn-secondary">
            <Video size={18} className="blue-accent" /> Watch Lectures
          </a>
        </div>

        {/* Animated Counter Stats */}
        <div className="hero-stats-row">
          <div className="stat-card glass-card">
            <div className="stat-num blue">{learners.toLocaleString()}+</div>
            <div className="stat-lbl">Active Learners</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-num yellow">{views.toLocaleString()}+</div>
            <div className="stat-lbl">Video Views</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-num">
              {likes >= 1000 ? `${(likes / 1000).toFixed(0)}K` : likes}+
            </div>
            <div className="stat-lbl">Likes Received</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-num">
              {comments >= 1000 ? `${(comments / 1000).toFixed(0)}K` : comments}+
            </div>
            <div className="stat-lbl">Helpful Comments</div>
          </div>
        </div>
      </header>

      {/* Year-Wise Notes Sections */}
      <section className="section-padding container">
        <div className="section-header">
          <h2 className="section-title">Complete Study Notes</h2>
          <p className="section-subtitle">Get complete syllabus notes with solved previous year questions (PYQs) categorized by year.</p>
        </div>
        <div className="notes-grid">
          <div className="note-card glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '10px' }} className="blue-accent">1st Year Notes</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Covers Mathematics-I/II, Engineering Physics, Chemistry, PPS (C Language), Basic Electrical, and Mechanical Engineering.
            </p>
            <button className="btn-primary w-full" style={{ marginTop: 'auto' }} onClick={() => handleYearClick('1st Year')}>
              View Notes
            </button>
          </div>
          
          <div className="note-card glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '10px' }} className="yellow-accent">2nd Year Notes</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Covers Data Structures, Operating Systems, OOPs (Java), COA, Discrete Mathematics, and Software Engineering.
            </p>
            <button className="btn-primary w-full" style={{ marginTop: 'auto' }} onClick={() => handleYearClick('2nd Year')}>
              View Notes
            </button>
          </div>

          <div className="note-card glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '10px' }} className="blue-accent">3rd Year Notes</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Covers Database Management Systems (DBMS), Compiler Design, Web Technologies, Theory of Automata (TAFL), and Algorithms (DAA).
            </p>
            <button className="btn-primary w-full" style={{ marginTop: 'auto' }} onClick={() => handleYearClick('3rd Year')}>
              View Notes
            </button>
          </div>

          <div className="note-card glass-card span-full" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: '1 1 300px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '22px', marginBottom: '10px' }} className="yellow-accent">4th Year Notes & Placements Pack</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                  Covers Computer Networks, Machine Learning, Distributed Systems, Cloud Computing, and curated interview preparations.
                </p>
              </div>
              <button className="btn-primary" style={{ padding: '12px 40px' }} onClick={() => handleYearClick('4th Year')}>
                Access 4th Year Catalog
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Youtube Videos Section */}
      <section id="youtube-videos" className="section-padding container">
        <div className="section-header">
          <h2 className="section-title">Featured Lecture Playlists</h2>
          <p className="section-subtitle">Learn from our high-quality, exam-focused concept video lectures synced directly from YouTube.</p>
        </div>
        {playlists.length > 0 ? (
          <div className="video-grid">
            {playlists.slice(0, 4).map((p) => (
              <VideoCard key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-card">No video playlists configured yet.</div>
        )}
      </section>

      {/* Feature Highlights */}
      <section className="section-padding container" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="features-grid">
          <div style={{ textAlign: 'left', display: 'flex', gap: '16px' }}>
            <div style={{ background: 'rgba(37,99,235,0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
              <ShieldCheck className="blue-accent" size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Verified PYQs Solutions</h4>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Every premium note pack includes detailed solutions to past 5 years of university questions.</p>
            </div>
          </div>

          <div style={{ textAlign: 'left', display: 'flex', gap: '16px' }}>
            <div style={{ background: 'rgba(251,191,36,0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
              <BookOpen className="yellow-accent" size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Concise Hand-written Formats</h4>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Specially structured using bullet points, bold tags, and hand-drawn flowcharts for quick memorization.</p>
            </div>
          </div>

          <div style={{ textAlign: 'left', display: 'flex', gap: '16px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
              <CheckCircle2 style={{ color: 'var(--color-success)' }} size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>6 Months Library Access</h4>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Once unlocked, you will get 6 months full access to revision folders, subject updates, and exam alerts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AKTU BTech Notes SEO Directory Section */}
      <section className="section-padding container" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="section-header">
          <h2 className="section-title">AKTU BTech Notes &amp; Solved PYQs Directory</h2>
          <p className="section-subtitle">Browse unit-wise handwritten engineering notes, Quantum revision guides, and exam question solutions by academic year.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#60a5fa', marginBottom: '12px' }}>AKTU 1st Year Notes</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>• Engineering Physics Notes</li>
              <li>• Engineering Chemistry Notes</li>
              <li>• Engineering Mathematics-I &amp; II</li>
              <li>• Programming for Problem Solving (PPS)</li>
              <li>• Basic Electronics Engineering</li>
              <li>• Environment &amp; Ecology</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#f59e0b', marginBottom: '12px' }}>AKTU 2nd Year CSE/IT Notes</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>• Data Structures (DS) Notes</li>
              <li>• Computer Org &amp; Architecture (COA)</li>
              <li>• Discrete Structures (DSTL)</li>
              <li>• Operating System (OS) Notes</li>
              <li>• Automata Theory (TAFL) Notes</li>
              <li>• OOPs with Java &amp; Python</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#34d399', marginBottom: '12px' }}>AKTU 3rd Year CSE Notes</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>• Database Management System (DBMS)</li>
              <li>• Design &amp; Analysis of Algo (DAA)</li>
              <li>• Web Technology (WT) Notes</li>
              <li>• Computer Networks (CN) Notes</li>
              <li>• Software Engineering (SE)</li>
              <li>• Compiler Design &amp; Data Analytics</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#c084fc', marginBottom: '12px' }}>AKTU 4th Year CSE Notes</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>• Cloud Computing Notes</li>
              <li>• Machine Learning (ML) Notes</li>
              <li>• Information Security Notes</li>
              <li>• Deep Learning &amp; Neural Networks</li>
              <li>• Internet of Things (IoT) Notes</li>
              <li>• AKTU Past 5 Years Solved PYQs</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="section-padding container" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Find answers to commonly asked questions about our study material and service guides.</p>
        </div>
        <FAQ />
      </section>
    </div>
  );
};
