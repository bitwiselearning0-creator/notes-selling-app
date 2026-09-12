import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Lock, FileText, SunMoon, ShieldAlert } from 'lucide-react';
import type { Note } from '../lib/supabase';
import { isNotePdfAvailable, dbService, type UserProfile } from '../lib/dbService';

interface PDFViewerProps {
  note: Note;
  isUnlocked: boolean;
  user?: UserProfile | null;
  isAppMode?: boolean;
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
  isInverted?: boolean;
  pageAspectRatio?: number;
  user?: UserProfile | null;
  userIp?: string;
}> = React.memo(({ pageNumber, pdfDoc, rotation, zoom, isInverted, pageAspectRatio = 1.414, user, userIp }) => {
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
    }, { rootMargin: '500px 0px 500px 0px' });

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

        // Clean, Organized Forensic Watermark (Balanced Grid & Institutional Header/Footer)
        const activeUser = user || dbService.getCurrentUser();
        const watermarkEmail = activeUser?.email || activeUser?.name || 'Authorized Student';
        const ipTag = userIp ? `IP: ${userIp}` : '';

        context.save();
        
        // 1. Clean Staggered Diagonal Grid (3 rows, 2 columns, neat 3-line block)
        const fontSize = Math.max(13, Math.round(viewport.width * 0.018));
        const lineGap = fontSize * 1.35;
        context.font = `700 ${fontSize}px sans-serif`;
        context.fillStyle = isInverted ? 'rgba(248, 113, 113, 0.25)' : 'rgba(220, 38, 38, 0.18)';
        context.textAlign = 'center';

        const rowPositions = [0.22, 0.50, 0.78];
        const colPositions = [0.28, 0.72];

        rowPositions.forEach((rowRatio, rIdx) => {
          colPositions.forEach((colRatio) => {
            const offsetX = (rIdx % 2 === 1) ? (viewport.width * 0.10) : 0;
            const x = (viewport.width * colRatio) + offsetX;
            const y = viewport.height * rowRatio;

            context.save();
            context.translate(x, y);
            context.rotate(-Math.PI / 8); // Clean -22.5 degree angle
            context.fillText('BITWISE LEARNING', 0, -lineGap);
            context.fillText(`Licensed to: ${watermarkEmail}`, 0, 0);
            if (ipTag) {
              context.fillText(ipTag, 0, lineGap);
            }
            context.restore();
          });
        });

        // 2. Page 1 Mandatory Legal & Forensic Disclaimer Header Banner
        if (pageNumber === 1) {
          const bannerHeight = Math.max(54, Math.round(viewport.height * 0.048));
          context.fillStyle = isInverted ? 'rgba(185, 28, 28, 0.95)' : 'rgba(220, 38, 38, 0.95)';
          context.fillRect(0, 0, viewport.width, bannerHeight);

          const bannerFontSize = Math.max(12, Math.round(viewport.width * 0.015));
          context.font = `800 ${bannerFontSize}px sans-serif`;
          context.fillStyle = '#FFFFFF';
          context.textAlign = 'center';
          context.fillText(
            `⚠️ STRICT LEGAL WARNING: SCREENSHOTS & SHARING PROHIBITED • TRACEABLE VIA TRANSACTION ID & EMAIL (${watermarkEmail})`,
            viewport.width / 2,
            bannerHeight * 0.42
          );

          const subBannerFontSize = Math.max(10, Math.round(viewport.width * 0.0115));
          context.font = `600 ${subBannerFontSize}px sans-serif`;
          context.fillStyle = 'rgba(255, 255, 255, 0.95)';
          context.fillText(
            `Licensed to: ${watermarkEmail} ${ipTag ? `• ${ipTag}` : ''} • Leaks are traced via Transaction ID & attract strict legal actions.`,
            viewport.width / 2,
            bannerHeight * 0.82
          );
        }

        // 3. Neat Clean Bottom Security Footer on every page
        const footerFontSize = Math.max(11, Math.round(viewport.width * 0.013));
        context.font = `600 ${footerFontSize}px sans-serif`;
        context.fillStyle = isInverted ? 'rgba(248, 113, 113, 0.30)' : 'rgba(220, 38, 38, 0.28)';
        context.textAlign = 'center';
        const footerText = `Bitwise Learning Secure Viewer • Licensed to ${watermarkEmail} • Do Not Distribute`;
        context.fillText(footerText, viewport.width / 2, viewport.height - (footerFontSize * 1.5));

        context.restore();
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
  }, [pdfDoc, pageNumber, rotation, isVisible, user, userIp, isInverted]);

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const baseWidth = Math.min(screenWidth - 24, 850);
  const targetWidth = Math.round(baseWidth * (zoom / 100));
  const estimatedMinHeight = Math.round(targetWidth * pageAspectRatio);

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
        minHeight: isVisible ? 'auto' : `${estimatedMinHeight}px`,
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
          background: isInverted ? '#0f172a' : '#ffffff',
          filter: isInverted ? 'invert(1) hue-rotate(180deg)' : 'none',
          transition: 'filter 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease'
        }} 
      />
    </div>
  );
});

export const PDFViewer: React.FC<PDFViewerProps> = ({ note, isUnlocked, user, onBack, onUnlock }) => {
  const [zoom, setZoom] = useState(100);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const [rotation, setRotation] = useState(0);
  const [isInverted, setIsInverted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [scrollPage, setScrollPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(1.414);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth > 768;
  });

  // Track live user profile (auto-refreshes when phone number is captured via checkout/login)
  const [activeUserProfile, setActiveUserProfile] = useState<UserProfile | null>(() => {
    return user || dbService.getCurrentUser();
  });

  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      setActiveUserProfile(e.detail || dbService.getCurrentUser());
    };
    window.addEventListener('bw_user_updated', handleUserUpdate);

    // Auto-fetch latest profile from VPS database on mount to sync phone number
    const current = user || dbService.getCurrentUser();
    if (current) {
      dbService.refreshCurrentUserProfile().then(updated => {
        if (updated) setActiveUserProfile(updated);
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('bw_user_updated', handleUserUpdate);
    };
  }, [user]);

  // Fetch client IP for dynamic watermark trace
  const [userIp, setUserIp] = useState<string>(() => {
    try {
      return sessionStorage.getItem('bw_user_ip') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    if (userIp) return;
    let isMounted = true;
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (isMounted && data?.ip) {
          setUserIp(data.ip);
          try { sessionStorage.setItem('bw_user_ip', data.ip); } catch (e) {}
          return;
        }
      } catch (e) {}

      try {
        const res2 = await fetch('/api/client-ip');
        const data2 = await res2.json();
        if (isMounted && data2?.ip) {
          setUserIp(data2.ip);
          try { sessionStorage.setItem('bw_user_ip', data2.ip); } catch (e) {}
        }
      } catch (e) {}
    };
    fetchIp();
    return () => { isMounted = false; };
  }, [userIp]);

  // ─── Screen Protection Guard (Hardware Key & Screenshot Blur Guard) ────────
  const [isScreenProtected, setIsScreenProtected] = useState(false);

  useEffect(() => {
    let unblurTimer: any = null;

    const securePage = () => {
      if (unblurTimer) clearTimeout(unblurTimer);
      document.body.classList.add('pdf-screen-blurred');
      setIsScreenProtected(true);
    };

    const unsecurePage = (delay = 150) => {
      if (unblurTimer) clearTimeout(unblurTimer);
      unblurTimer = setTimeout(() => {
        document.body.classList.remove('pdf-screen-blurred');
        setIsScreenProtected(false);
      }, delay);
    };

    // 3-Finger Swipe Screenshot Detection (only triggers on 3 or more simultaneous touch points)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 3) {
        securePage();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!e.touches || e.touches.length < 3) {
        unsecurePage(100);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Handle background tab / window focus
    const handleVisibility = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        securePage();
      } else {
        unsecurePage(200);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility, { capture: true });

    return () => {
      if (unblurTimer) clearTimeout(unblurTimer);
      document.body.classList.remove('pdf-screen-blurred');
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('visibilitychange', handleVisibility, true);
    };
  }, []);

  // Android Hardware Keys (Power + Volume Down) & Desktop Shortcuts Interception
  useEffect(() => {
    const wipeClipboard = () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
      } catch (e) {}
    };

    const securePageInstant = () => {
      document.body.classList.add('pdf-screen-blurred');
      setIsScreenProtected(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || (e.getModifierState && e.getModifierState('Meta'));
      const isCtrl = e.ctrlKey || (e.getModifierState && e.getModifierState('Control'));
      const isShift = e.shiftKey || (e.getModifierState && e.getModifierState('Shift'));

      // Android Physical Buttons (Volume Down / Volume Up / Power)
      const isAndroidHardwareKey = 
        e.key === 'VolumeDown' ||
        e.key === 'VolumeUp' ||
        e.key === 'AudioVolumeDown' ||
        e.key === 'AudioVolumeUp' ||
        e.key === 'Power' ||
        e.code === 'AudioVolumeDown' ||
        e.code === 'AudioVolumeUp' ||
        e.code === 'Power' ||
        e.keyCode === 24 || // Android KEYCODE_VOLUME_UP
        e.keyCode === 25 || // Android KEYCODE_VOLUME_DOWN
        e.keyCode === 26 || // Android KEYCODE_POWER
        e.keyCode === 174 || // AudioVolumeDown
        e.keyCode === 175;   // AudioVolumeUp

      if (isAndroidHardwareKey) {
        securePageInstant();
      }

      // Modifiers & Screenshot Shortcuts (Cmd+Shift, Ctrl+Shift, PrintScreen)
      if ((isMeta || isCtrl) && isShift) {
        securePageInstant();
      }

      const keyLower = (e.key || '').toLowerCase();
      const code = e.code || '';

      const isMacScreenshotKey = 
        (isMeta || isShift) && 
        (keyLower === '3' || keyLower === '4' || keyLower === '5' || keyLower === '#' || keyLower === '$' || keyLower === '%' || code === 'Digit3' || code === 'Digit4' || code === 'Digit5');

      const isScreenshotKey =
        isAndroidHardwareKey ||
        e.key === 'PrintScreen' ||
        code === 'PrintScreen' ||
        e.key === 'F12' ||
        ((isMeta || isCtrl) && isShift) ||
        isMacScreenshotKey ||
        ((isMeta || isCtrl) && ['s', 'p', 'u', 'i', 'c', 'x', 'a'].includes(keyLower));

      if (isScreenshotKey) {
        wipeClipboard();
        securePageInstant();
      }

      // Block Ctrl+P / Cmd+P (Print), Ctrl+S / Cmd+S (Save), Ctrl+U (Source)
      if ((isCtrl || isMeta) && ['p', 's', 'u'].includes(keyLower)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || (e.getModifierState && e.getModifierState('Meta'));
      const isCtrl = e.ctrlKey || (e.getModifierState && e.getModifierState('Control'));
      const isShift = e.shiftKey || (e.getModifierState && e.getModifierState('Shift'));

      const isAndroidHardwareKey = 
        e.key === 'VolumeDown' ||
        e.key === 'VolumeUp' ||
        e.key === 'AudioVolumeDown' ||
        e.key === 'AudioVolumeUp' ||
        e.key === 'Power' ||
        e.code === 'AudioVolumeDown' ||
        e.code === 'AudioVolumeUp' ||
        e.code === 'Power' ||
        e.keyCode === 24 ||
        e.keyCode === 25 ||
        e.keyCode === 26 ||
        e.keyCode === 174 ||
        e.keyCode === 175;

      const code = e.code || '';

      if (
        isAndroidHardwareKey ||
        e.key === 'PrintScreen' ||
        code === 'PrintScreen' ||
        ((isMeta || isCtrl) && isShift)
      ) {
        wipeClipboard();
      }

      // Unblur immediately when user releases the hardware/modifier buttons
      if (!isMeta && !isCtrl && !isShift && !isAndroidHardwareKey) {
        setTimeout(() => {
          document.body.classList.remove('pdf-screen-blurred');
          setIsScreenProtected(false);
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', handleKeyUp, { capture: true, passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, []);
  // ─── End Protection Guard ─────────────────────────────────────────────────

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
    let url = note.previewUrl || note.pdfUrl || (note.id ? `/api/notes/${note.id}/pdf` : '');
    if (!url) return;

    // In Capacitor app, relative paths like /uploads/xxx.pdf resolve to capacitor://localhost/uploads/...
    // which doesn't exist. Convert to absolute VPS URL only for native Capacitor environment.
    const isCapacitor = typeof window !== 'undefined' && ((window as any).Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:');
    if (isCapacitor && (url.startsWith('/uploads/') || url.startsWith('/api/'))) {
      url = 'https://bitwiselearning.online' + url;
    }

    if (url.startsWith('data:application/pdf;base64,') || url.includes(';base64,')) {
      try {
        const parts = url.split(';base64,');
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
        setPdfUrl(url);
      }
    } else {
      setPdfUrl(url);
    }
  }, [note.id, note.previewUrl, note.pdfUrl]);

  // Reset document state whenever active note changes
  useEffect(() => {
    setPdfDoc(null);
    setLoadError(null);
    setScrollPage(1);
    setJumpPageInput('1');
  }, [note.id]);

  // 3. Load PDF Document via PDF.js when script and URL are ready
  useEffect(() => {
    if (!pdfjsLoaded || !pdfUrl) return;

    if (!isUnlocked) {
      setPdfDoc(null);
      setLoadingDoc(false);
      setLoadError(null);
      return;
    }

    if (!isNotePdfAvailable(note)) {
      setLoadError('PDF document is currently under faculty review.');
      setPdfDoc(null);
      setLoadingDoc(false);
      return;
    }

    const loadDocument = async () => {
      setLoadingDoc(true);
      setLoadError(null);
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        const token = localStorage.getItem('bw_auth_token') || '';
        const currentUserProfile = user || activeUserProfile || dbService.getCurrentUser();
        const userId = currentUserProfile?.id || '';
        const userEmail = currentUserProfile?.email || '';

        let targetUrl = pdfUrl;
        const isNative = typeof window !== 'undefined' && ((window as any).Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:');
        if (isNative && typeof targetUrl === 'string' && (targetUrl.startsWith('/uploads/') || targetUrl.startsWith('/api/'))) {
          targetUrl = 'https://bitwiselearning.online' + targetUrl;
        }

        let pdfSource: any = targetUrl;
        if (typeof targetUrl === 'string' && targetUrl.includes('/api/notes/')) {
          const params = new URLSearchParams();
          if (token) params.set('token', token);
          if (userId) params.set('userId', userId);
          if (userEmail) params.set('email', userEmail);

          const qs = params.toString();
          if (qs) {
            const separator = targetUrl.includes('?') ? '&' : '?';
            targetUrl = `${targetUrl}${separator}${qs}`;
          }

          const httpHeaders: Record<string, string> = {};
          if (token) httpHeaders['Authorization'] = `Bearer ${token}`;
          if (userId) httpHeaders['x-user-id'] = userId;
          if (userEmail) httpHeaders['x-user-email'] = userEmail;

          pdfSource = {
            url: targetUrl,
            httpHeaders,
            withCredentials: true
          };
        }

        const loadingTask = pdfjsLib.getDocument(pdfSource);
        const pdf = await loadingTask.promise;
        try {
          const firstPage = await pdf.getPage(1);
          const vp = firstPage.getViewport({ scale: 1 });
          if (vp && vp.width > 0 && vp.height > 0) {
            setPageAspectRatio(vp.height / vp.width);
          }
        } catch (e) {}
        setPdfDoc(pdf);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        setLoadError(err.message || 'Error parsing document content.');
        setPdfDoc(null);
      } finally {
        setLoadingDoc(false);
      }
    };

    loadDocument();
  }, [pdfjsLoaded, pdfUrl, note]);

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

  // Calculate total pages count (0 when locked/revoked)
  const totalPages = isUnlocked ? (pdfDoc ? pdfDoc.numPages : note.pagesCount) : 0;

  const isInputFocusedRef = useRef(false);
  const isJumpingRef = useRef(false);
  const jumpTimeoutRef = useRef<any>(null);

  // 5. Jump directly to specific page number function with 100% physical accuracy
  const handleJumpToPage = (targetNum?: number) => {
    const pageToJump = targetNum !== undefined ? targetNum : parseInt(jumpPageInput, 10);
    if (isNaN(pageToJump)) return;
    
    const validPage = Math.min(totalPages, Math.max(1, pageToJump));
    setScrollPage(validPage);
    setJumpPageInput(validPage.toString());

    isJumpingRef.current = true;
    if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);

    const targetEl = pageRefs.current[validPage - 1];
    const container = scrollContainerRef.current;
    if (targetEl && container) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const targetTopRelative = targetRect.top - containerRect.top + container.scrollTop;
      
      container.scrollTo({
        top: Math.max(0, targetTopRelative - 70),
        behavior: 'smooth'
      });

      jumpTimeoutRef.current = setTimeout(() => {
        isJumpingRef.current = false;
      }, 850);
    } else {
      isJumpingRef.current = false;
    }
  };

  // 6. Handle scroll position: Exact Physical Element Intersection & Auto-Hide/Show Controls
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || totalPages <= 0) return;

    const scrollTop = container.scrollTop;
    
    // Find closest page element to container viewport center
    const containerRect = container.getBoundingClientRect();
    const viewportCenter = containerRect.top + (containerRect.height / 2);

    let closestPage = 1;
    let minDistance = Infinity;

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageRefs.current[i];
      if (pageEl) {
        const rect = pageEl.getBoundingClientRect();
        const pageCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(pageCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestPage = i + 1;
        }
      }
    }

    setScrollPage(closestPage);
    if (!isInputFocusedRef.current && !isJumpingRef.current) {
      setJumpPageInput(closestPage.toString());
    }

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
      onContextMenu={(e) => e.preventDefault()}
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
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* Screenshot Protection Blur & Blackout Overlay */}
      {isScreenProtected && (
        <div 
          onClick={() => setIsScreenProtected(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999999,
            background: '#060913',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)'
          }}>
            <Lock size={40} style={{ color: '#ef4444' }} />
          </div>
          <p style={{
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '18px',
            textAlign: 'center',
            margin: 0,
            padding: '0 24px',
            lineHeight: 1.5,
            maxWidth: '440px'
          }}>
            🔒 Content Hidden — Screenshot Protection Active
          </p>
          <p style={{
            color: '#94a3b8',
            fontSize: '13px',
            textAlign: 'center',
            margin: 0,
            padding: '0 24px'
          }}>
            Click anywhere on this screen to resume viewing notes.
          </p>
          <button
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              setIsScreenProtected(false);
            }}
            style={{ marginTop: '12px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }}
          >
            Resume Reading
          </button>
        </div>
      )}
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
            className="btn-secondary viewer-back-btn" 
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
              color: isUnlocked ? '#34d399' : '#f87171', 
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
              {isUnlocked ? '✦ Full Access Unlocked' : '🔒 Access Locked (License Required)'}
            </span>
          </div>
        </div>

        {/* Right Section: Crisp Page Counter & Rotate Button */}
        <div className="viewer-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Prominent High-Contrast Active Page & Direct Jump Control Pill */}
          <div className="page-jump-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            padding: '4px 12px',
            borderRadius: '16px',
            height: '42px',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Enlarged Glowing Active Page Input Box */}
            <input 
              className="jump-input-box"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
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
              onFocus={(e) => {
                isInputFocusedRef.current = true;
                e.target.select();
              }}
              onBlur={() => {
                isInputFocusedRef.current = false;
                handleJumpToPage();
              }}
              style={{
                width: '60px',
                height: '34px',
                background: '#0a1329',
                border: '2px solid var(--color-yellow)',
                borderRadius: '8px',
                color: '#fef08a',
                fontSize: '18px',
                fontWeight: '900',
                textAlign: 'center',
                padding: 0,
                margin: 0,
                outline: 'none',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                lineHeight: '34px',
                display: 'inline-block',
                boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)'
              }}
            />

            <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '15px' }}>
              / {totalPages}
            </span>

            <button 
              className="jump-go-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToPage();
              }}
              title="Jump to Page"
              style={{
                background: 'var(--color-yellow)',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                flexShrink: 0,
                boxShadow: '0 2px 12px rgba(245, 158, 11, 0.4)',
                letterSpacing: '0.3px'
              }}
            >
              GO
            </button>
          </div>

          {/* Rotation Button */}
          <button 
            className="viewer-action-btn viewer-rotate-btn"
            onClick={(e) => {
              e.stopPropagation();
              setRotation(r => (r + 90) % 360);
            }} 
            title="Rotate Page" 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              border: '1px solid rgba(255, 255, 255, 0.22)', 
              background: 'rgba(255, 255, 255, 0.08)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--color-white)', 
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <RotateCw size={18} />
          </button>

          {/* Color Inversion Toggle Button (Icon only) */}
          <button 
            className="viewer-action-btn viewer-invert-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsInverted(prev => !prev);
            }} 
            title={isInverted ? "Original PDF Colors" : "Invert PDF Colors"} 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              border: isInverted ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.22)', 
              background: isInverted ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)', 
              display: 'flex', 
              alignItems: 'center',  
              justifyContent: 'center', 
              color: isInverted ? '#38bdf8' : 'var(--color-white)', 
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
          >
            <SunMoon size={18} />
          </button>
        </div>
      </div>

      {/* Main Full-Screen Scrollable Document Canvas Area */}
      <div 
        ref={scrollContainerRef}
        className="pdf-viewer-scroll-container"
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
          boxSizing: 'border-box',
          filter: isScreenProtected ? 'blur(50px)' : 'none',
          opacity: isScreenProtected ? 0 : 1,
          pointerEvents: isScreenProtected ? 'none' : 'auto',
          transition: 'filter 0.2s ease, opacity 0.2s ease'
        }}
      >
        {/* PDF Page Renderer & State Controller */}
        {!isUnlocked ? (
          /* ============================================================== */
          /* STRICT ACCESS LOCKED SCREEN (0 PAGES RENDERED WHEN REVOKED / UNPURCHASED) */
          /* ============================================================== */
          <div style={{
            minHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            zIndex: 100
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
            }}>
              <Lock size={40} style={{ color: '#ef4444' }} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '10px' }}>
              🔒 Access Locked - License Required
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '440px', lineHeight: '1.6', marginBottom: '28px' }}>
              Your access to <strong style={{ color: '#ffffff' }}>{note.title}</strong> is not active. Unlock now to get instant study access.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                onClick={onUnlock}
                style={{ padding: '12px 28px', fontSize: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)' }}
              >
                <Lock size={16} /> Unlock Full Resource (₹{note.price})
              </button>
              <button 
                className="btn-secondary" 
                onClick={onBack}
                style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600' }}
              >
                Back to Catalog
              </button>
            </div>
          </div>
        ) : loadError ? (
          <div className="pdf-error-container fade-in" style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '30px 20px', maxWidth: '480px' }}>
            <div className="pdf-error-icon-box" style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={32} />
            </div>
            <h3 className="pdf-error-title" style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              {loadError.toLowerCase().includes('faculty review') ? '📄 PDF Document Under Faculty Review' : '⚠️ Document Loading Notice'}
            </h3>
            <p className="pdf-error-desc" style={{ fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
              {loadError.toLowerCase().includes('faculty review')
                ? `High-quality study notes for ${note.title} are currently being finalized by faculty and will be updated shortly.`
                : loadError}
            </p>
            <button className="btn-secondary pdf-error-btn" onClick={onBack} style={{ marginTop: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }}>
              Back to Catalog
            </button>
          </div>
        ) : (!pdfjsLoaded || loadingDoc || !pdfUrl) ? (
          <div style={{ margin: 'auto', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }} className="fade-in">
            <div className="skeleton-box" style={{ width: '100%', height: '520px', borderRadius: '16px' }}></div>
            <div className="skeleton-box" style={{ width: '180px', height: '14px', borderRadius: '4px' }}></div>
          </div>
        ) : pdfDoc ? (
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
              boxSizing: 'border-box'
            }}
          >
            {/* Dedicated Page 1: Official Security & Legal Disclaimer Notice */}
            <div 
              style={{
                width: Math.round(Math.min((typeof window !== 'undefined' ? window.innerWidth : 800) - 24, 850) * (zoom / 100)),
                maxWidth: '100%',
                margin: '12px auto 16px auto',
                borderRadius: '16px',
                border: '1.5px solid rgba(239, 68, 68, 0.45)',
                background: isInverted 
                  ? 'linear-gradient(135deg, rgba(30, 20, 20, 0.96), rgba(45, 15, 15, 0.98))' 
                  : 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(35, 18, 22, 0.98))',
                boxShadow: '0 8px 32px rgba(220, 38, 38, 0.18)',
                padding: '22px 24px',
                boxSizing: 'border-box',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(239, 68, 68, 0.25)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                    <ShieldAlert size={22} color="#EF4444" />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#EF4444' }}>
                      Security Notice • Page 1
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '2px 0 0 0', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                      OFFICIAL LEGAL & COPYRIGHT DISCLAIMER
                    </h3>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', color: '#FCA5A5', fontWeight: '700' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                  FORENSIC TRACKING ACTIVE
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.88)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#EF4444', fontWeight: '800', fontSize: '14px' }}>1.</span>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Unauthorized Screenshots & Sharing Prohibited:</strong> Taking screenshots, screen recordings, extracting, copying, or forwarding any part of this document via WhatsApp, Telegram, Google Drive, or any public/private media is strictly prohibited.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#EF4444', fontWeight: '800', fontSize: '14px' }}>2.</span>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Identity Leak Risk:</strong> Every single page of this document contains cryptographic invisible and visible digital watermarks tied to your personal registered account (<span style={{ color: '#60A5FA', fontWeight: '700' }}>{activeUserProfile?.email || user?.email || 'Authorized Student'}</span>) and Device IP (<span style={{ color: '#60A5FA', fontWeight: '700' }}>{userIp || 'Verified IP'}</span>). If any screenshot is taken and shared, your personal credentials will be leaked publicly and traced back to you immediately.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#EF4444', fontWeight: '800', fontSize: '14px' }}>3.</span>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Transaction ID & Payment Traceability:</strong> We can track and identify you directly by your unique <span style={{ color: '#F59E0B', fontWeight: '700' }}>Payment / Transaction ID</span>, registered account records, and payment gateway logs. Every document access is cryptographically linked to your transaction history in our database.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#EF4444', fontWeight: '800', fontSize: '14px' }}>4.</span>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Strict Legal Actions:</strong> Any copyright infringement, unauthorized sharing, or attempt to bypass security protections is punishable under the <strong style={{ color: '#F59E0B' }}>Information Technology Act (IT Act 2000, Sections 43, 66 & 72)</strong> and the <strong style={{ color: '#F59E0B' }}>Indian Copyright Act 1957</strong>, leading to permanent blacklisting, forfeiture of all access, and criminal/civil legal prosecution.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                <span>Document: <strong style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{note.title}</strong></span>
                <span>Licensed to: <strong style={{ color: '#60A5FA' }}>{activeUserProfile?.email || user?.email || 'Student'}</strong></span>
                <span>Protected by Bitwise Security Shield</span>
              </div>
            </div>

            {/* Render pages: all pages when unlocked */}
            {Array.from({ length: pdfDoc.numPages }).map((_, idx) => {
              const pageNum = idx + 1;

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
                    isInverted={isInverted}
                    pageAspectRatio={pageAspectRatio}
                    user={activeUserProfile || user}
                    userIp={userIp}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
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
