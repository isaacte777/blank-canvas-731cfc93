import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Supabase REST config for reliable beacon-style inserts (survive page close)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ============================================
// SESSION MANAGEMENT - Persists across reloads
// ============================================

// Generate or retrieve session ID (persists for entire browser session)
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

// Get device type - determined ONCE per session and cached
const getDeviceType = (): 'mobile' | 'desktop' => {
  // Check if already determined for this session
  const cachedType = sessionStorage.getItem('visitor_device_type');
  if (cachedType === 'mobile' || cachedType === 'desktop') {
    return cachedType;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check user agent for mobile patterns
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
    'iemobile', 'opera mini', 'mobile', 'phone', 'tablet',
    'silk', 'kindle', 'playbook', 'windows phone'
  ];
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check screen width
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Determine device type
  const deviceType = (isMobileUA || (isSmallScreen && hasTouch)) ? 'mobile' : 'desktop';
  
  // Cache for this session to ensure consistency
  sessionStorage.setItem('visitor_device_type', deviceType);
  
  return deviceType;
};

// ============================================
// VISIT TRACKING
// ============================================

// Check if a section was already tracked in this session
const wasSectionTrackedInSession = (sectionId: string): boolean => {
  const sessionId = getSessionId();
  const trackingKey = `tracked_section_${sessionId}_${sectionId}`;
  return sessionStorage.getItem(trackingKey) === 'true';
};

// Mark a section as tracked in this session
const markSectionAsTracked = (sectionId: string): void => {
  const sessionId = getSessionId();
  const trackingKey = `tracked_section_${sessionId}_${sectionId}`;
  sessionStorage.setItem(trackingKey, 'true');
};

// ============================================
// PAGE NAME MAPPING
// ============================================

const getPageName = (path: string): string => {
  const pageNames: Record<string, string> = {
    '/': 'Inicio',
    '/auth': 'Iniciar Sesión',
    '/donaciones': 'Donaciones',
    '/admin': 'Panel Admin',
    '/admin/mensajes': 'Admin Mensajes',
    '/admin/donaciones': 'Admin Donaciones',
    '/admin/estadisticas': 'Estadísticas',
  };

  if (path.startsWith('/ministerios/')) {
    const slug = path.replace('/ministerios/', '');
    return `Ministerio: ${slug}`;
  }

  return pageNames[path] || path;
};

const getSectionName = (sectionId: string): string => {
  const sectionNames: Record<string, string> = {
    'inicio': 'Hero/Inicio',
    'oracion': 'Banner de Oración',
    'anuncios': 'Anuncios',
    'cita': 'Cita Bíblica',
    'servicios': 'Servicios',
    'nosotros': 'Nosotros',
    'ministerios': 'Ministerios',
    'contacto': 'Contacto',
  };
  return sectionNames[sectionId] || sectionId;
};

// ============================================
// DATABASE OPERATIONS
// ============================================

const trackVisit = async (pagePath: string, pageName: string, timeSpent: number = 0) => {
  try {
    const { error } = await supabase
      .from('page_visits')
      .insert({
        page_path: pagePath,
        page_name: pageName,
        device_type: getDeviceType(),
        session_id: getSessionId(),
        referrer: document.referrer || null,
        time_spent: timeSpent,
      });

    if (error) {
      console.error('Error tracking visit:', error);
    }
  } catch (err) {
    console.error('Error tracking visit:', err);
  }
};

// Reliable insert that survives page close (mobile background / tab close).
// `fetch` with keepalive completes even after the page is being unloaded,
// unlike the async supabase client call which the browser aborts.
const sendVisitBeacon = (pagePath: string, pageName: string, timeSpent: number) => {
  const payload = {
    page_path: pagePath,
    page_name: pageName,
    device_type: getDeviceType(),
    session_id: getSessionId(),
    referrer: document.referrer || null,
    time_spent: timeSpent,
  };

  try {
    fetch(`${SUPABASE_URL}/rest/v1/page_visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* best-effort: ignore network errors on unload */
    });
  } catch {
    /* ignore */
  }
};

// ============================================
// MAIN HOOK
// ============================================

// Minimum time (in seconds) to consider a "real" section view
const MIN_VIEW_TIME_SECONDS = 3;

// Minimum active time (ms) for a page view to count. Filters out instant
// bounces / redirects and accidental double-mounts.
const MIN_PAGE_TIME_MS = 1000;

// A single page view in progress. We only count time while the tab is
// visible ("active time"), and we flush exactly once per view.
interface PageView {
  path: string;
  name: string;
  activeMs: number;     // accumulated active time
  segmentStart: number; // start of the current visible segment (0 = paused)
  counting: boolean;    // currently accumulating?
  flushed: boolean;     // already saved? (prevents duplicates)
}

export const usePageTracking = () => {
  const location = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTrackedInitialPage = useRef(false);

  // The page view currently being measured
  const currentView = useRef<PageView | null>(null);

  // Track section visibility timing
  const sectionTimers = useRef<Map<string, { startTime: number; totalTime: number; isVisible: boolean }>>(new Map());

  // ============================================
  // ACTIVE TIME PER PAGE
  // ============================================

  // Resume counting (only if visible and not yet flushed)
  const startSegment = useCallback(() => {
    const v = currentView.current;
    if (v && !v.counting && !v.flushed && document.visibilityState === 'visible') {
      v.segmentStart = Date.now();
      v.counting = true;
    }
  }, []);

  // Pause counting and fold the elapsed time into the accumulator
  const pauseSegment = useCallback(() => {
    const v = currentView.current;
    if (v && v.counting) {
      v.activeMs += Date.now() - v.segmentStart;
      v.counting = false;
    }
  }, []);

  // Save the current page view exactly once, with its real active time
  const flushCurrentView = useCallback(() => {
    const v = currentView.current;
    if (!v || v.flushed) return;

    if (v.counting) {
      v.activeMs += Date.now() - v.segmentStart;
      v.counting = false;
    }
    v.flushed = true;

    if (v.activeMs >= MIN_PAGE_TIME_MS) {
      sendVisitBeacon(v.path, v.name, Math.round(v.activeMs / 1000));
    }
  }, []);

  // ============================================
  // SECTION TIME TRACKING
  // ============================================

  const saveSectionTime = useCallback((sectionId: string) => {
    const timer = sectionTimers.current.get(sectionId);
    if (!timer) return;
    
    // Don't track if already tracked in this session
    if (wasSectionTrackedInSession(sectionId)) return;
    
    // Calculate final time if still visible
    if (timer.isVisible) {
      const now = Date.now();
      timer.totalTime += (now - timer.startTime) / 1000;
      timer.isVisible = false;
    }
    
    const timeSpent = Math.round(timer.totalTime);
    
    // Only track if user spent meaningful time (3+ seconds)
    if (timeSpent >= MIN_VIEW_TIME_SECONDS) {
      markSectionAsTracked(sectionId);
      const sectionName = getSectionName(sectionId);
      trackVisit(`/#${sectionId}`, `Sección: ${sectionName}`, timeSpent);
    }
  }, []);

  const saveAllSectionTimes = useCallback(() => {
    sectionTimers.current.forEach((_, sectionId) => {
      saveSectionTime(sectionId);
    });
  }, [saveSectionTime]);

  // ============================================
  // SECTION OBSERVER SETUP
  // ============================================

  const setupSectionTracking = useCallback(() => {
    // Only track sections on the index page
    if (location.pathname !== '/') {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    // Reset timers (but not session tracking - that persists)
    sectionTimers.current.clear();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id;
          if (!sectionId) return;
          
          // Skip if already tracked in this session
          if (wasSectionTrackedInSession(sectionId)) return;
          
          let timer = sectionTimers.current.get(sectionId);
          
          if (!timer) {
            timer = { startTime: 0, totalTime: 0, isVisible: false };
            sectionTimers.current.set(sectionId, timer);
          }
          
          if (entry.isIntersecting) {
            // Section came into view - start timing
            if (!timer.isVisible) {
              timer.startTime = Date.now();
              timer.isVisible = true;
            }
          } else {
            // Section went out of view - accumulate time
            if (timer.isVisible) {
              const now = Date.now();
              timer.totalTime += (now - timer.startTime) / 1000;
              timer.isVisible = false;
            }
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '0px',
      }
    );

    const validSectionIds = ['inicio', 'oracion', 'anuncios', 'cita', 'servicios', 'nosotros', 'ministerios', 'contacto'];
    const sections = document.querySelectorAll('[id]');
    
    sections.forEach((section) => {
      if (validSectionIds.includes(section.id)) {
        observerRef.current?.observe(section);
      }
    });
  }, [location.pathname]);

  // ============================================
  // PAGE VISIT TRACKING (active time)
  // ============================================

  // On every route change: flush the previous page view, then start a new one.
  // The hook stays mounted across SPA navigations, so this fires once per page.
  useEffect(() => {
    flushCurrentView();

    currentView.current = {
      path: location.pathname,
      name: getPageName(location.pathname),
      activeMs: 0,
      segmentStart: 0,
      counting: false,
      flushed: false,
    };
    startSegment();

    hasTrackedInitialPage.current = true;
  }, [location.pathname, flushCurrentView, startSegment]);

  // Pause/resume the active-time clock with tab visibility, and flush
  // reliably when the page is hidden or closed (the only reliable moment
  // on mobile). `pagehide` covers desktop tab close / refresh.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseSegment();
        flushCurrentView();
      } else {
        startSegment();
      }
    };

    const handlePageHide = () => {
      flushCurrentView();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      flushCurrentView();
    };
  }, [pauseSegment, flushCurrentView, startSegment]);

  // Setup section tracking after page renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setupSectionTracking();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [location.pathname, setupSectionTracking]);

  // Save section times on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveAllSectionTimes();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveAllSectionTimes();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      saveAllSectionTimes();
    };
  }, [saveAllSectionTimes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
};

export default usePageTracking;