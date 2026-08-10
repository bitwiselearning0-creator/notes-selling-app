import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Lock, Loader2, AlertTriangle } from 'lucide-react';
import type { Note } from '../lib/supabase';

interface PDFViewerProps {
  note: Note;
  isUnlocked: boolean;
  onBack: () => void;
  onUnlock: () => void;
}

// Sub-component to render individual PDF pages onto canvas securely with working zoom
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

        // Cancel previous rendering task if active
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // High-DPI crisp rendering scale multiplied by zoom factor
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

  const scaledWidth = Math.round(850 * (zoom / 100));

  return (
    <div style={{ 
      margin: '16px auto', 
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: `${scaledWidth}px`,
      maxWidth: '96vw',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: 'auto',
          display: 'block' 
        }} 
      />
    </div>
  );
};

export const PDFViewer: React.FC<PDFViewerProps> = ({ note, isUnlocked, onBack, onUnlock }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [scrollPage, setScrollPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth > 768;
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // 3. Load PDF Document via PDF.js when script and URL are ready
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

  // Sync jumpPageInput with active scroll page
  useEffect(() => {
    setJumpPageInput(scrollPage.toString());
  }, [scrollPage]);

  // 4. Anti-copying and anti-printing bindings
  useEffect(() => {
    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    const preventCopyPaste = (e: Event) => {
      e.preventDefault();
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

  // Calculate total pages count
  const totalPages = isUnlocked ? (pdfDoc ? pdfDoc.numPages : note.pagesCount) : Math.min(2, pdfDoc ? pdfDoc.numPages : 2);

  // 5. Jump directly to specific page number function
  const handleJumpToPage = (targetNum?: number) => {
    const pageToJump = targetNum !== undefined ? targetNum : parseInt(jumpPageInput, 10);
    if (isNaN(pageToJump)) return;
    
    const validPage = Math.min(totalPages, Math.max(1, pageToJump));
    setScrollPage(validPage);
    setJumpPageInput(validPage.toString());

    const targetEl = pageRefs.current[validPage - 1];
    if (targetEl && scrollContainerRef.current) {
      const topPos = targetEl.offsetTop - 85;
      scrollContainerRef.current.scrollTo({
        top: topPos,
        behavior: 'smooth'
      });
    }
  };

  // 6. Handle scroll position: Page Counter & Auto-Hide/Show Header-Footer Controls
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    
    if (scrollHeight <= 0) return;
    
    // Estimate current page
    const percentage = scrollTop / scrollHeight;
    const page = Math.min(totalPages, Math.max(1, Math.round(percentage * (totalPages - 1)) + 1));
    setScrollPage(page);

    // Auto-hide controls when scrolling DOWN, Auto-show when scrolling UP or near TOP
    const delta = scrollTop - lastScrollTopRef.current;
    if (scrollTop < 30) {
      setControlsVisible(true);
    } else if (delta > 15) {
      setControlsVisible(false);
    } else if (delta < -15) {
      setControlsVisible(true);
    }

    lastScrollTopRef.current = scrollTop;
  };

  const toggleControls = () => {
    setControlsVisible(prev => !prev);
  };

  return (
    <div 
      className="pdf-viewer-container fade-in" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: '#060913',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none', 
        WebkitUserSelect: 'none'
      }}
    >
      {/* Compact Floating Back Button when top navbar is hidden */}
      {!controlsVisible && (
        <button 
          onClick={onBack}
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 1000001,
            background: 'rgba(10, 17, 43, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            color: 'var(--color-white)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Back to Catalog"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Floating Zoom Controls Widget for Mobile App Mode */}
      {!controlsVisible && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '16px',
            zIndex: 1000001,
            background: 'rgba(10, 17, 43, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '30px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom(z => Math.max(60, z - 15));
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              color: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>

          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-white)', minWidth: '36px', textAlign: 'center' }}>
            {zoom}%
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom(z => Math.min(220, z + 15));
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              color: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      )}

      {/* Premium Header Bar (Auto-hides on scroll) */}
      <div 
        className="viewer-header glass-card" 
        style={{ 
          position: 'fixed',
          top: '12px',
          left: '16px',
          right: '16px',
          zIndex: 1000000,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '8px 16px', 
          borderRadius: '16px', 
          border: '1px solid var(--glass-border)', 
          background: 'rgba(10, 17, 43, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          transform: controlsVisible ? 'translateY(0)' : 'translateY(-130%)',
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none'
        }}
      >
        {/* Left Section: Back Button & Note Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flexShrink: 1 }}>
          <button 
            className="btn-secondary" 
            onClick={onBack} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 14px', 
              borderRadius: '10px', 
              fontWeight: '600', 
              fontSize: '13px',
              height: '34px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <h2 className="viewer-title" style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              color: 'var(--color-white)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap', 
              margin: 0,
              lineHeight: 1.2
            }}>
              {note.title}
            </h2>
            <span className="viewer-subtitle" style={{ 
              fontSize: '10px', 
              color: isUnlocked ? '#22c55e' : 'var(--color-yellow)', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              marginTop: '1px',
              lineHeight: 1
            }}>
              {isUnlocked ? '✦ Full Access Unlocked' : '✦ Free Preview Mode'}
            </span>
          </div>
        </div>

        {/* Right Section: Page Jump & Zoom Controls */}
        <div className="viewer-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Direct Page Jump Input Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            padding: '3px 8px',
            borderRadius: '20px',
            height: '34px',
            boxSizing: 'border-box'
          }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToPage(scrollPage - 1);
              }}
              disabled={scrollPage <= 1}
              title="Previous Page"
              style={{
                background: 'none',
                border: 'none',
                color: scrollPage <= 1 ? 'rgba(255,255,255,0.2)' : 'var(--color-white)',
                cursor: scrollPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                width: '20px',
                height: '20px'
              }}
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Pg</span>
            
            <input 
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setJumpPageInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  handleJumpToPage();
                }
              }}
              onFocus={(e) => e.target.select()}
              style={{
                width: '32px',
                height: '24px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'var(--color-white)',
                fontSize: '12px',
                fontWeight: '700',
                textAlign: 'center',
                padding: '0',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>/ {totalPages}</span>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToPage();
              }}
              title="Jump to Page"
              style={{
                background: 'var(--color-yellow)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                height: '22px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Go
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToPage(scrollPage + 1);
              }}
              disabled={scrollPage >= totalPages}
              title="Next Page"
              style={{
                background: 'none',
                border: 'none',
                color: scrollPage >= totalPages ? 'rgba(255,255,255,0.2)' : 'var(--color-white)',
                cursor: scrollPage >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                width: '20px',
                height: '20px'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Zoom Controls Pill */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            padding: '3px 8px',
            borderRadius: '20px',
            height: '34px',
            boxSizing: 'border-box'
          }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setZoom(z => Math.max(55, z - 15));
              }} 
              title="Zoom Out" 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: 'none', 
                background: 'rgba(255,255,255,0.08)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--color-white)', 
                cursor: 'pointer' 
              }}
            >
              <ZoomOut size={13} />
            </button>
            
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-white)', minWidth: '36px', textAlign: 'center' }}>
              {zoom}%
            </span>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setZoom(z => Math.min(200, z + 15));
              }} 
              title="Zoom In" 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: 'none', 
                background: 'rgba(255,255,255,0.08)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--color-white)', 
                cursor: 'pointer' 
              }}
            >
              <ZoomIn size={13} />
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setRotation(r => (r + 90) % 360);
              }} 
              title="Rotate Page" 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: 'none', 
                background: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--color-muted)', 
                cursor: 'pointer',
                marginLeft: '2px' 
              }}
            >
              <RotateCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Screen Scrollable Document Canvas Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onClick={toggleControls}
        style={{ 
          width: '100vw', 
          height: '100vh', 
          padding: '70px 0 70px 0', 
          overflowY: 'scroll', 
          overflowX: 'auto',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'flex-start',
          scrollBehavior: 'smooth',
          background: 'radial-gradient(circle at center, #0a1127 0%, #03060d 100%)'
        }}
      >
        {/* Loading / Error States */}
        {(!pdfjsLoaded || loadingDoc || !pdfUrl) && (
          <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: 'var(--color-muted)' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--color-yellow)' }} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Decrypting and rendering document...</span>
          </div>
        )}

        {loadError && (
          <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#f87171', textAlign: 'center', padding: '20px' }}>
            <AlertTriangle size={36} />
            <span style={{ fontSize: '14px', fontWeight: '700' }}>Error Loading Document: {loadError}</span>
            <button className="btn-secondary" onClick={() => window.location.reload()} style={{ marginTop: '8px' }}>Retry Load</button>
          </div>
        )}

        {/* PDF Page Renderer */}
        {pdfjsLoaded && pdfDoc && !loadError && (
          <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Floating Security Watermark Overlay */}
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
              opacity: 0.04
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

            {/* Render pages: all pages if unlocked, or up to 2 pages if in preview mode */}
            {Array.from({ length: isUnlocked ? pdfDoc.numPages : Math.min(2, pdfDoc.numPages) }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSecondPageLocked = !isUnlocked && pageNum === 2;

              return (
                <div 
                  key={idx} 
                  ref={el => { pageRefs.current[idx] = el; }}
                  style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <CanvasPage 
                    pageNumber={pageNum} 
                    pdfDoc={pdfDoc} 
                    zoom={zoom} 
                    rotation={rotation} 
                  />
                  
                  {isSecondPageLocked && (
                    <div className="locked-preview-overlay" style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: `${Math.min(96 * 10, Math.round(850 * (zoom / 100)))}px`,
                      maxWidth: '96vw',
                      height: '100%',
                      borderRadius: '12px',
                      background: 'rgba(10, 17, 36, 0.92)',
                      backdropFilter: 'blur(22px)',
                      WebkitBackdropFilter: 'blur(22px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 15
                    }}>
                      <div className="locked-overlay-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
                        <div className="locked-shield-icon" style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1.5px solid var(--color-yellow)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '6px'
                        }}>
                          <Lock size={28} style={{ color: 'var(--color-yellow)' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-white)', margin: 0 }}>🔒 End of Free Preview</h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center', maxWidth: '320px', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                          You have read all 2 free preview pages. Unlock to read all {pdfDoc.numPages} pages.
                        </p>
                        <button 
                          className="btn-primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlock();
                          }} 
                          style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)' }}
                        >
                          Unlock Full Syllabus (₹{note.price})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Pill Page Indicator & Jump Bar (Auto-hides on scroll) */}
      {pdfjsLoaded && !loadError && (
        <div 
          className="viewer-footer glass-card" 
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: controlsVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(150%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            opacity: controlsVisible ? 1 : 0,
            pointerEvents: controlsVisible ? 'auto' : 'none',
            zIndex: 1000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 18px',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(10, 17, 43, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            gap: '12px'
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleJumpToPage(scrollPage - 1);
            }}
            disabled={scrollPage <= 1}
            title="Previous Page"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: scrollPage <= 1 ? 'rgba(255,255,255,0.2)' : 'var(--color-white)',
              cursor: scrollPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '5px'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <span className="page-counter" style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Page <strong style={{ color: 'var(--color-white)', fontSize: '16px' }}>{scrollPage}</strong> of <strong style={{ color: 'var(--color-white)', fontSize: '16px' }}>{totalPages}</strong> 
          </span>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleJumpToPage(scrollPage + 1);
            }}
            disabled={scrollPage >= totalPages}
            title="Next Page"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: scrollPage >= totalPages ? 'rgba(255,255,255,0.2)' : 'var(--color-white)',
              cursor: scrollPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '5px'
            }}
          >
            <ChevronRight size={16} />
          </button>

          {isUnlocked ? (
            <span className="locked-tag" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.25)', padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ✦ Full Access
            </span>
          ) : (
            <span className="locked-tag" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-yellow)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preview Limit
            </span>
          )}
        </div>
      )}
    </div>
  );
};
