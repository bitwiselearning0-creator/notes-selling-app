import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Note } from '../lib/supabase';

interface PDFViewerProps {
  note: Note;
  isUnlocked: boolean;
  onBack: () => void;
  onUnlock: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ note, isUnlocked, onBack, onUnlock }) => {
  const isAppMode = document.body.classList.contains('app-mode') || window.location.href.includes('platform=app');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (!note.previewUrl) return;

    if (note.previewUrl.startsWith('data:application/pdf;base64,') || note.previewUrl.includes(';base64,')) {
      try {
        const parts = note.previewUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);

        return () => {
          URL.revokeObjectURL(blobUrl);
        };
      } catch (err) {
        console.error('Error converting base64 to blob:', err);
        setPdfUrl(note.previewUrl);
      }
    } else {
      setPdfUrl(note.previewUrl);
    }
  }, [note.previewUrl]);

  // Maximum pages visible to the user
  const totalPages = isUnlocked ? note.pagesCount : 2;

  // Anti-copying and anti-printing bindings
  useEffect(() => {
    const preventActions = (e: KeyboardEvent) => {
      // Prevent copy (Ctrl+C, Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        alert('Copying content is disabled to protect intellectual property.');
      }
      // Prevent print (Ctrl+P, Cmd+P)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        alert('Printing notes is disabled to protect intellectual property.');
      }
      // Prevent inspect (F12, Ctrl+Shift+I)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i')) {
        e.preventDefault();
      }
    };

    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    const preventCopyPaste = (e: Event) => {
      e.preventDefault();
      alert('Copying and cutting content is disabled to protect intellectual property.');
    };

    window.addEventListener('keydown', preventActions);
    window.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);

    return () => {
      window.removeEventListener('keydown', preventActions);
      window.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
    };
  }, []);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate simulated notes content for high-quality mock preview (bypasses CORS restrictions on random PDFs)
  const getSimulatedPageContent = (page: number) => {
    // Return sample text based on note topics and active page
    const topicIndex = (page - 1) % note.topics.length;
    const activeTopic = note.topics[topicIndex];
    
    return (
      <div className="pdf-simulated-content" style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}>
        <div className="watermark">BITWISE LEARNING</div>
        <div className="doc-header">
          <span className="doc-subj">{note.subject}</span>
          <span className="doc-page">Page {page} of {note.pagesCount}</span>
        </div>
        <h2 className="doc-topic-title">Chapter {page}: {activeTopic}</h2>
        
        <div className="doc-section">
          <h3>1. Core Concepts</h3>
          <p>
            {activeTopic} forms the foundation of modern computer science architectures. Under standard university guidelines,
            students must understand the structural design, algorithm complexity, and historical context of this topic.
            Let's evaluate the primary characteristics:
          </p>
          <ul>
            <li><strong>Efficiency:</strong> Direct mapping and fast addressing modes reduce execution delays.</li>
            <li><strong>Robustness:</strong> Error containment protocols prevent system-wide memory fragmentation.</li>
            <li><strong>Standardization:</strong> Complies with standard IEEE curricula and previous year exam questions.</li>
          </ul>
        </div>

        <div className="doc-code-block">
          <div className="code-header">Example Implementation: {activeTopic}</div>
          <pre>
{`// Solved PYQ Example:
#include <stdio.h>
#define MAX_NODES 1024

void processNode() {
    printf("Executing Bitwise Learning notes workflow for ${activeTopic}...\\n");
    // Secure token rendering
    int activeSession = 1;
    if (activeSession) {
        printf("Page unlocked successfully.\\n");
    }
}`}
          </pre>
        </div>

        <div className="doc-section">
          <h3>2. Important Exam Tips (Solved PYQ Pattern)</h3>
          <p>
            Every year, examiners frequently ask about the optimization parameters of this system. In your answer script,
            make sure to draw the block diagram showing interface parameters. Always cite the mathematical proofs for
            full marks.
          </p>
          <div className="diagram-placeholder">
            [ Interactive Block Diagram: {activeTopic} Architecture Flowchart ]
          </div>
        </div>

        <div className="doc-footer">
          <span>Prepared by Bitwise Learning Academic Team</span>
          <span>© All Rights Reserved. Bitwise Learning.</span>
        </div>
      </div>
    );
  };

  return (
    <div className="pdf-viewer-container fade-in" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', display: 'flex', flexDirection: 'column', gap: '16px', margin: isAppMode ? '0' : '10px 0 20px 0', height: isAppMode ? 'calc(100vh - 80px)' : 'auto' }}>
      {/* Premium Header Bar */}
      <div className="viewer-header glass-card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: isAppMode ? '8px 12px' : '16px 24px', 
        borderRadius: '16px', 
        border: '1px solid var(--glass-border)', 
        background: 'rgba(10, 17, 43, 0.7)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
      }}>
        <button className="btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontWeight: '600' }}>
          <ChevronLeft size={16} /> Back
        </button>
        
        <div className="viewer-title-area" style={{ textAlign: 'center', flexGrow: 1, padding: '0 12px' }}>
          <h2 className="viewer-title" style={{ fontSize: isAppMode ? '13px' : '18px', fontWeight: '700', letterSpacing: '0.5px', color: 'var(--color-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isAppMode ? '140px' : '400px', margin: 0 }}>
            {note.title}
          </h2>
          <span className="viewer-subtitle" style={{ fontSize: isAppMode ? '8px' : '11px', color: isUnlocked ? '#22c55e' : 'var(--color-yellow)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginTop: '2px' }}>
            {isUnlocked ? '✦ Full Access Unlocked' : '✦ Free Preview Mode'}
          </span>
        </div>

        <div className="viewer-controls" style={{ display: 'flex', alignItems: 'center', gap: isAppMode ? '6px' : '12px' }}>
          <button className="btn-icon" onClick={() => setZoom(Math.max(50, zoom - 10))} title="Zoom Out" style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <ZoomOut size={16} />
          </button>
          {!isAppMode && <span className="zoom-text" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-white)', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>}
          <button className="btn-icon" onClick={() => setZoom(Math.min(150, zoom + 10))} title="Zoom In" style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <ZoomIn size={16} />
          </button>
          {!isAppMode && (
            <button className="btn-icon" onClick={() => setRotation((rotation + 90) % 360)} title="Rotate Page" style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              <RotateCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Security alert notification banner */}
      <div className="security-banner" style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1.5px solid rgba(239, 68, 68, 0.25)',
        padding: '10px 20px',
        borderRadius: '12px',
        fontSize: isAppMode ? '10px' : '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        color: '#f87171',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
        margin: '0 4px'
      }}>
        <ShieldAlert size={16} style={{ color: '#ef4444' }} />
        <span>Secure Document Viewer: Text copy, download, inspect, and screenshots are strictly monitored & blocked.</span>
      </div>

      {/* Main Workspace Layout */}
      <div className="viewer-workspace" style={{
        flexGrow: 1,
        overflow: 'hidden',
        padding: '12px',
        background: 'radial-gradient(circle at center, #0e162b 0%, #060913 100%)',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.02) 1.5px, transparent 0)',
        backgroundSize: '24px 24px',
        borderRadius: '24px',
        border: '1.5px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        boxShadow: 'inset 0 4px 30px rgba(0,0,0,0.6)'
      }}>
        {isUnlocked ? (
          <div className="unlocked-scroll-wrapper" style={{ 
            width: '100%', 
            height: isAppMode ? '54vh' : '65vh', 
            padding: '10px 10px 30px 10px', 
            overflowY: 'scroll', 
            overflowX: 'hidden',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'flex-start',
            gap: '20px',
            scrollBehavior: 'smooth'
          }}>
            <div style={{ 
              width: `${zoom}%`, 
              maxWidth: '820px',
              height: '1160px', 
              minWidth: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease, width 0.3s ease',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(255,255,255,0.06)'
            }}>
              {/* Blocker overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                background: 'transparent',
                cursor: 'default'
              }} />

              {/* Watermark Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 9,
                pointerEvents: 'none',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                opacity: 0.05
              }}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} style={{
                    transform: 'rotate(-35deg)',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'var(--color-white)',
                    margin: '60px',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    letterSpacing: '1px'
                  }}>
                    BITWISE LEARNING
                  </div>
                ))}
              </div>

              <iframe 
                src={pdfUrl ? `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0` : ''} 
                title={note.title} 
                style={{ 
                  width: 'calc(100% + 18px)', 
                  height: '100%', 
                  border: 'none', 
                  background: '#ffffff',
                  pointerEvents: 'none'
                }} 
              />
            </div>
          </div>
        ) : (
          <div className="page-scroller" style={{ height: isAppMode ? '54vh' : '65vh', overflowY: 'auto' }}>
            {/* Active Page Card */}
            <div className="page-canvas-wrapper glass-card" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '16px' }}>
              {getSimulatedPageContent(currentPage)}
            </div>

            {/* Locked Overlay */}
            {!isUnlocked && currentPage === totalPages && (
              <div className="locked-preview-overlay glass-card fade-in" style={{
                borderRadius: '16px',
                border: '1.5px solid rgba(245, 158, 11, 0.25)',
                background: 'rgba(10, 17, 36, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}>
                <div className="locked-overlay-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div className="locked-shield-icon" style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1.5px solid var(--color-yellow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <AlertTriangle size={32} className="yellow-accent" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-white)', margin: 0 }}>🔒 End of Free Preview</h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center', maxWidth: '320px', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                    You have read all 2 free pages. Buy this syllabus combo pack to unlock all {note.pagesCount} pages of this syllabus with PYQ solutions.
                  </p>
                  <button className="btn-primary" onClick={onUnlock} style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)' }}>
                    Unlock Full Syllabus (₹{note.price})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Elegant Universal Navigation Footer */}
      <div className="viewer-footer glass-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(10, 17, 43, 0.8)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <button 
          className="btn-secondary" 
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="page-counter" style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '600' }}>
          Page <strong style={{ color: 'var(--color-white)', fontSize: '16px' }}>{currentPage}</strong> of <strong style={{ color: 'var(--color-white)', fontSize: '16px' }}>{totalPages}</strong> 
          {isUnlocked ? (
            <span className="locked-tag" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.25)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', marginLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ✦ Full Access
            </span>
          ) : (
            <span className="locked-tag" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-yellow)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', marginLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preview Limit
            </span>
          )}
        </span>
        <button 
          className="btn-secondary" 
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
