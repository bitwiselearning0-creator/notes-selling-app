import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Lock, AlertTriangle } from 'lucide-react';
import type { Note } from '../lib/supabase';

interface PDFViewerProps {
  note: Note;
  isUnlocked: boolean;
  onBack: () => void;
  onUnlock: () => void;
}

// Sub-component to render individual PDF pages onto canvas securely with smooth width scaling
const CanvasPage: React.FC<{
  pageNumber: number;
  pdfDoc: any;
  rotation: number;
  zoom: number;
  isPinching?: boolean;
}> = React.memo(({ pageNumber, pdfDoc, rotation, zoom }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(pageNumber <= 2);

  useEffect(() => {
    if (pageNumber <= 2) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '400px 0px 400px 0px' });

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !isVisible) return;
    
    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!isMounted) return;

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Render at ultra high-definition 2.0x scale for razor-sharp text
        const scale = 2.0;
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
        // Safe catch for cancelled rendering tasks
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, pageNumber, rotation, isVisible]);

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const baseWidth = Math.min(screenWidth - 24, 850);
  const targetWidth = Math.round(baseWidth * (zoom / 100));

  return (
    <div 
      ref={containerRef}
      style={{ 
        margin: '12px auto', 
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'transparent',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        width: `${targetWidth}px`,
        maxWidth: 'none',
        boxSizing: 'border-box',
        transition: 'none'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: 'auto',
          display: isVisible ? 'block' : 'none',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: '#ffffff'
        }} 
      />
    </div>
  );
});

export const PDFViewer: React.FC<PDFViewerProps> = ({ note, isUnlocked, onBack, onUnlock }) => {
  const [zoom, setZoom] = useState(100);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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
  const pagesWrapperRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<{ left: number; top: number } | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Synchronously update scroll position before browser paint when zoom changes to prevent page jump
  React.useLayoutEffect(() => {
    if (pendingScrollRef.current && scrollContainerRef.current) {
      const { left, top } = pendingScrollRef.current;
      scrollContainerRef.current.scrollLeft = left;
      scrollContainerRef.current.scrollTop = top;
      pendingScrollRef.current = null;
    }
  }, [zoom]);

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
      } catch (e) {
        console.error('Error converting base64 PDF to blob URL:', e);
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

  // 4. Ultra-Smooth Direct GPU Pinch-to-Zoom Engine (Zero React Re-render Latency)
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(100);
  const touchStartScrollLeftRef = useRef<number>(0);
  const touchStartScrollTopRef = useRef<number>(0);
  const touchStartMidXRef = useRef<number>(0);
  const touchStartMidYRef = useRef<number>(0);
  const touchLastMidXRef = useRef<number>(0);
  const touchLastMidYRef = useRef<number>(0);
  const currentScaleRef = useRef<number>(1);
  const isPinchingRef = useRef<boolean>(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (dist > 10) {
          touchStartDistRef.current = dist;
          touchStartZoomRef.current = zoomRef.current;

          const rect = container.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

          touchStartMidXRef.current = midX;
          touchStartMidYRef.current = midY;
          touchLastMidXRef.current = midX;
          touchLastMidYRef.current = midY;

          touchStartScrollLeftRef.current = container.scrollLeft;
          touchStartScrollTopRef.current = container.scrollTop;

          const docX = midX + container.scrollLeft;
          const docY = midY + container.scrollTop;

          if (pagesWrapperRef.current) {
            pagesWrapperRef.current.style.transformOrigin = `${docX}px ${docY}px`;
            pagesWrapperRef.current.style.willChange = 'transform';
            pagesWrapperRef.current.style.transition = 'none';
          }

          currentScaleRef.current = 1;
          isPinchingRef.current = true;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDistRef.current && touchStartDistRef.current > 0 && isPinchingRef.current) {
        if (e.cancelable) e.preventDefault();

        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const rect = container.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        touchLastMidXRef.current = midX;
        touchLastMidYRef.current = midY;

        const rawScale = currentDist / touchStartDistRef.current;
        const startZoom = touchStartZoomRef.current;
        const maxScale = 200 / startZoom;
        const minScale = 100 / startZoom;

        const clampedScale = Math.min(maxScale, Math.max(minScale, rawScale));
        currentScaleRef.current = clampedScale;

        // Direct DOM GPU Scale Mutation - 0ms React Overhead
        if (pagesWrapperRef.current) {
          pagesWrapperRef.current.style.transform = `scale(${clampedScale})`;
        }
      }
    };

    const finishPinch = () => {
      if (touchStartDistRef.current !== null && isPinchingRef.current) {
        isPinchingRef.current = false;
        const finalScale = currentScaleRef.current;
        const startZoom = touchStartZoomRef.current;
        const rawTargetZoom = startZoom * finalScale;
        const finalZoom = Math.min(200, Math.max(100, Math.round(rawTargetZoom / 5) * 5));

        const zoomRatio = finalZoom / startZoom;
        const startMidX = touchStartMidXRef.current;
        const startMidY = touchStartMidYRef.current;
        const lastMidX = touchLastMidXRef.current || startMidX;
        const lastMidY = touchLastMidYRef.current || startMidY;

        const startScrollLeft = touchStartScrollLeftRef.current;
        const startScrollTop = touchStartScrollTopRef.current;

        const newScrollLeft = Math.max(0, (startScrollLeft + startMidX) * zoomRatio - lastMidX);
        const newScrollTop = Math.max(0, (startScrollTop + startMidY) * zoomRatio - lastMidY);

        // Reset direct DOM transform before React layout commit
        if (pagesWrapperRef.current) {
          pagesWrapperRef.current.style.transform = 'none';
          pagesWrapperRef.current.style.willChange = 'auto';
        }

        pendingScrollRef.current = { left: newScrollLeft, top: newScrollTop };

        zoomRef.current = finalZoom;
        setZoom(finalZoom);

        touchStartDistRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        finishPinch();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', finishPinch);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', finishPinch);
    };
  }, []);
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
      className="pdf-viewer-root"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
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
          padding: '8px 14px', 
          borderRadius: '16px', 
          border: '1px solid var(--glass-border)', 
          background: 'rgba(10, 17, 43, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          transform: controlsVisible ? 'translateY(0)' : 'translateY(-130%)',
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
          gap: '12px'
        }}
      >
        {/* Left Section: Prominent Large Back Button & Note Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <button 
            className="btn-secondary" 
            onClick={onBack} 
            title="Back to Catalog"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              padding: 0,
              borderRadius: '12px', 
              flexShrink: 0,
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          
          <div className="viewer-title-area" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
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
              color: isUnlocked ? '#34d399' : '#fbbf24', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.4px',
              marginTop: '2px',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block'
            }}>
              {isUnlocked ? '✦ Full Access Unlocked' : '✦ Free Preview Mode'}
            </span>
          </div>
        </div>

        {/* Right Section: Crisp Page Counter & Rotate Button */}
        <div className="viewer-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Clean High-Contrast Page Counter Pill */}
          <div className="page-jump-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '4px 10px',
            borderRadius: '24px',
            height: '40px',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap'
          }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToPage(scrollPage - 1);
              }}
              disabled={scrollPage <= 1}
              title="Previous Page"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: scrollPage <= 1 ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-white)',
                cursor: scrollPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                flexShrink: 0
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Clear, Bold Page Counter Display */}
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span>{scrollPage}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: '600', fontSize: '12px' }}>/ {totalPages}</span>
            </span>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToPage(scrollPage + 1);
              }}
              disabled={scrollPage >= totalPages}
              title="Next Page"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: scrollPage >= totalPages ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-white)',
                cursor: scrollPage >= totalPages ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                flexShrink: 0
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Rotation Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setRotation(r => (r + 90) % 360);
            }} 
            title="Rotate Page" 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '12px', 
              border: '1px solid rgba(255, 255, 255, 0.18)', 
              background: 'rgba(255, 255, 255, 0.08)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--color-white)', 
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <RotateCw size={17} />
          </button>
        </div>
      </div>

      {/* Main Full-Screen Scrollable Document Canvas Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onClick={toggleControls}
        style={{ 
          flex: 1,
          width: '100%', 
          height: '100%', 
          padding: '75px 0 calc(24px + env(safe-area-inset-bottom, 0px)) 0', 
          overflowY: 'auto', 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y pinch-zoom',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: zoom > 100 ? 'flex-start' : 'center', 
          justifyContent: 'flex-start',
          scrollBehavior: 'auto',
          background: '#060913',
          boxSizing: 'border-box'
        }}
      >
        {/* Loading / Error States */}
        {(!pdfjsLoaded || loadingDoc || !pdfUrl) && (
          <div style={{ margin: 'auto', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }} className="fade-in">
            <div className="skeleton-box" style={{ width: '100%', height: '520px', borderRadius: '16px' }}></div>
            <div className="skeleton-box" style={{ width: '180px', height: '14px', borderRadius: '4px' }}></div>
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
          <div 
            ref={pagesWrapperRef}
            style={{ 
              minWidth: '100%',
              width: 'max-content',
              margin: '0 auto',
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '0 12px',
              boxSizing: 'border-box',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
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
                    rotation={rotation} 
                    zoom={zoom}
                  />
                  
                  {isSecondPageLocked && (
                    <div className="locked-preview-overlay" style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: `${Math.min(typeof window !== 'undefined' ? window.innerWidth - 24 : 800, 850) * (zoom / 100)}px`,
                      maxWidth: 'none',
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
