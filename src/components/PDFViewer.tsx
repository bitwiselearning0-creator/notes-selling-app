import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ZoomIn, ZoomOut, RotateCw, ShieldAlert, Lock, Loader2, AlertTriangle } from 'lucide-react';
import type { Note } from '../lib/supabase';

interface PDFViewerProps {
  note: Note;
  isUnlocked: boolean;
  onBack: () => void;
  onUnlock: () => void;
}

// Sub-component to render individual PDF pages onto canvas securely
const CanvasPage: React.FC<{
  pageNumber: number;
  pdfDoc: any;
  zoom: number;
  rotation: number;
}> = ({ pageNumber, pdfDoc, zoom, rotation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!isMounted) return;

        // Cancel previous rendering if active
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Standard PDF render scale (increased to 1.5 for high-DPI crisp text rendering)
        const scale = (zoom / 100) * 1.5;
        const viewport = page.getViewport({ scale, rotation });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const context = canvas.getContext('2d');
        if (!context) return;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, zoom, rotation]);

  return (
    <div style={{ 
      margin: '14px 0', 
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: '100%',
      transition: 'transform 0.3s ease'
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          maxWidth: '800px', 
          display: 'block' 
        }} 
      />
    </div>
  );
};

export const PDFViewer: React.FC<PDFViewerProps> = ({ note, isUnlocked, onBack, onUnlock }) => {
  const isAppMode = document.body.classList.contains('app-mode') || window.location.href.includes('platform=app');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [scrollPage, setScrollPage] = useState(1);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Load PDF.js from CDN dynamically
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfjsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      setPdfjsLoaded(true);
    };
    script.onerror = () => {
      setLoadError('Failed to load secure document renderer engine.');
    };
    document.head.appendChild(script);
  }, []);

  // 2. Convert Base64 previewUrl to Blob URL if necessary
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

  // 3. Load PDF Document via PDF.js when script and URL are ready (always load to render actual preview pages)
  useEffect(() => {
    if (!pdfjsLoaded || !pdfUrl) return;

    const loadDocument = async () => {
      setLoadingDoc(true);
      setLoadError(null);
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        setLoadError(err.message || 'Error parsing document content.');
      } finally {
        setLoadingDoc(false);
      }
    };

    loadDocument();
  }, [pdfjsLoaded, pdfUrl]);

  // 4. Anti-copying and anti-printing bindings
  useEffect(() => {
    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    const preventCopyPaste = (e: Event) => {
      e.preventDefault();
      alert('Copying and cutting content is disabled to protect intellectual property.');
    };

    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);

    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
    };
  }, []);

  // Calculate pages on scroll dynamically
  const totalPages = isUnlocked ? (pdfDoc ? pdfDoc.numPages : note.pagesCount) : Math.min(2, pdfDoc ? pdfDoc.numPages : 2);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    
    if (scrollHeight <= 0) return;
    
    // Estimate current page by finding scroll percentage
    const percentage = scrollTop / scrollHeight;
    const page = Math.min(totalPages, Math.max(1, Math.round(percentage * (totalPages - 1)) + 1));
    setScrollPage(page);
  };

  return (
    <div className="pdf-viewer-container fade-in" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', display: 'flex', flexDirection: 'column', gap: '14px', margin: isAppMode ? '0' : '10px 0 20px 0', height: isAppMode ? 'calc(100vh - 80px)' : 'auto' }}>
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
        padding: '16px',
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
        {/* Loading / Error States */}
        {(!pdfjsLoaded || loadingDoc || !pdfUrl) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--color-muted)' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-yellow)' }} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Decrypting and loading secure document renderer...</span>
          </div>
        )}

        {loadError && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#f87171', textAlign: 'center', padding: '20px' }}>
            <AlertTriangle size={36} />
            <span style={{ fontSize: '14px', fontWeight: '700' }}>Error Loading Document: {loadError}</span>
            <button className="btn-secondary" onClick={() => window.location.reload()} style={{ marginTop: '8px' }}>Retry Load</button>
          </div>
        )}

        {/* Unified Note Page Renderer (Renders real PDF pages) */}
        {pdfjsLoaded && pdfDoc && !loadError && (
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{ 
              width: '100%', 
              height: isAppMode ? '54vh' : '65vh', 
              padding: '0 10px 40px 10px', 
              overflowY: 'scroll', 
              overflowX: 'hidden',
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'flex-start',
              scrollBehavior: 'smooth'
            }}
          >
            {/* Scrollable Container of Canvas Pages */}
            <div style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
              {/* Floating Diagonal Security Watermark Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9,
                pointerEvents: 'none',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                opacity: 0.05
              }}>
                {Array.from({ length: Math.min(25, (isUnlocked ? pdfDoc.numPages : 2) * 2) }).map((_, i) => (
                  <div key={i} style={{
                    transform: 'rotate(-35deg)',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'var(--color-white)',
                    margin: '120px 80px',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    letterSpacing: '1px'
                  }}>
                    BITWISE LEARNING
                  </div>
                ))}
              </div>

              {/* Render pages: either all pages (if unlocked) or up to 2 pages (if locked) */}
              {Array.from({ length: isUnlocked ? pdfDoc.numPages : Math.min(2, pdfDoc.numPages) }).map((_, idx) => (
                <CanvasPage 
                  key={idx} 
                  pageNumber={idx + 1} 
                  pdfDoc={pdfDoc} 
                  zoom={zoom} 
                  rotation={rotation} 
                />
              ))}

              {/* Locked Preview overlay right below Page 2 if locked */}
              {!isUnlocked && (
                <div className="locked-preview-overlay glass-card fade-in" style={{
                  margin: '20px 0 40px 0',
                  padding: '40px 24px',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(245, 158, 11, 0.25)',
                  background: 'rgba(10, 17, 36, 0.88)',
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div className="locked-shield-icon" style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1.5px solid var(--color-yellow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <Lock size={32} style={{ color: 'var(--color-yellow)' }} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-white)', margin: '0 0 8px 0' }}>🔒 End of Free Preview</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted)', textAlign: 'center', maxWidth: '360px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                    You have read all 2 free preview pages of the actual notes. Buy this combo pack or unlock the notes to read all {pdfDoc.numPages} pages.
                  </p>
                  <button className="btn-primary" onClick={onUnlock} style={{ padding: '12px 28px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)' }}>
                    Unlock Full Syllabus (₹{note.price})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Pill Page Indicator Bar */}
      {pdfjsLoaded && !loadError && (
        <div className="viewer-footer glass-card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          background: 'rgba(10, 17, 43, 0.85)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          gap: '20px'
        }}>
          <span className="page-counter" style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Viewing Page <strong style={{ color: 'var(--color-white)', fontSize: '18px' }}>{scrollPage}</strong> of <strong style={{ color: 'var(--color-white)', fontSize: '18px' }}>{totalPages}</strong> 
            {isUnlocked ? (
              <span className="locked-tag" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.25)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ✦ Full Access
              </span>
            ) : (
              <span className="locked-tag" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-yellow)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Preview Limit
            </span>
          )}
        </span>
      </div>
      )}
    </div>
  );
};
