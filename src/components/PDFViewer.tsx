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
    <div className="pdf-viewer-container fade-in" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
      {/* Viewer Header Dashboard */}
      <div className="viewer-header glass-card">
        <button className="btn-secondary" onClick={onBack}>
          <ChevronLeft size={16} /> Back
        </button>
        
        <div className="viewer-title-area">
          <h2 className="viewer-title">{note.title}</h2>
          <span className="viewer-subtitle">
            {isUnlocked ? 'Full Study Material' : 'Locked Mode (Free Preview)'}
          </span>
        </div>

        <div className="viewer-controls">
          <button className="btn-icon" onClick={() => setZoom(Math.max(50, zoom - 10))} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span className="zoom-text">{zoom}%</span>
          <button className="btn-icon" onClick={() => setZoom(Math.min(150, zoom + 10))} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button className="btn-icon" onClick={() => setRotation((rotation + 90) % 360)} title="Rotate Page">
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Security alert notification bar */}
      <div className="security-banner">
        <ShieldAlert size={14} className="yellow-accent" />
        <span>Secure Viewer Active. Text selection, copy-pasting, right-clicking, and printing have been blocked.</span>
      </div>

      {/* Document Workspace */}
      <div className="viewer-workspace" style={{ height: '78vh' }}>
        {isUnlocked ? (
          <div style={{ width: '100%', height: '100%', padding: '0 10px 10px 10px', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ 
              width: `${zoom}%`, 
              height: '70vh',
              minWidth: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'all 0.2s ease'
            }}>
              {/* Invisible overlay div to block drag selections and clicks inside the iframe */}
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

              <iframe 
                src={pdfUrl ? `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0` : ''} 
                title={note.title} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '16px', 
                  background: '#090d16',
                  pointerEvents: 'none' // Strict text block inside browser frames
                }} 
              />
            </div>
          </div>
        ) : (
          <div className="page-scroller">
            {/* Active Page Card */}
            <div className="page-canvas-wrapper glass-card">
              {getSimulatedPageContent(currentPage)}
            </div>

            {/* Locked Overlay for free preview limit */}
            {!isUnlocked && currentPage === totalPages && (
              <div className="locked-preview-overlay glass-card fade-in">
                <div className="locked-overlay-content">
                  <AlertTriangle size={48} className="yellow-accent" />
                  <h3>End of Free Preview</h3>
                  <p>You have read all 2 free pages. Buy these notes to unlock all {note.pagesCount} pages of this syllabus with PYQ solutions.</p>
                  <button className="btn-primary" onClick={onUnlock}>
                    Unlock Full Notes (₹{note.price})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Page Navigation Footer */}
      <div className="viewer-footer glass-card">
        <button 
          className="btn-secondary" 
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="page-counter">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> {isUnlocked ? <span className="locked-tag" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>Full Access</span> : <span className="locked-tag">(Preview Limit)</span>}
        </span>
        <button 
          className="btn-secondary" 
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
