/**
 * Bitwise Learning Theme Engine
 * Supports 3 Theme Preference Options:
 * 1. 'system' - Device Default (Auto syncs with Android OS / System preference)
 * 2. 'light'  - Premium Light Theme
 * 3. 'dark'   - Cosmic Dark Theme
 */

export type ThemePreference = 'system' | 'light' | 'dark';

export function isAndroidAppMode(): boolean {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const isNativeCapacitor = !!(window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform();
  const hasAppParam = searchParams.get('platform') === 'app' || hash.includes('platform=app');
  const isAppBody = document.body && document.body.classList.contains('app-mode');
  return isNativeCapacitor || hasAppParam || isAppBody;
}

export function getThemePreference(): ThemePreference {
  if (isAndroidAppMode()) return 'dark';
  const pref = localStorage.getItem('bw_theme_preference');
  if (pref === 'light' || pref === 'dark' || pref === 'system') {
    return pref;
  }
  return 'system';
}

export function resolveActualTheme(pref: ThemePreference): 'light' | 'dark' {
  if (isAndroidAppMode()) {
    return 'dark'; // Android App is STRICTLY DARK THEME ALWAYS
  }
  if (pref === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return pref;
}

export function applyThemePreference(pref: ThemePreference) {
  if (isAndroidAppMode()) {
    localStorage.setItem('bw_theme_preference', 'dark');
    localStorage.setItem('bw_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bw_theme_changed', { 
        detail: { pref: 'dark', actualTheme: 'dark' } 
      }));
    }
    return;
  }

  localStorage.setItem('bw_theme_preference', pref);
  const actualTheme = resolveActualTheme(pref);
  localStorage.setItem('bw_theme', actualTheme);
  document.documentElement.setAttribute('data-theme', actualTheme);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bw_theme_changed', { 
      detail: { pref, actualTheme } 
    }));
  }
}

export function initThemeEngine() {
  if (isAndroidAppMode()) {
    applyThemePreference('dark');
    return;
  }

  const pref = getThemePreference();
  applyThemePreference(pref);

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (isAndroidAppMode()) {
        applyThemePreference('dark');
        return;
      }
      const currentPref = getThemePreference();
      if (currentPref === 'system') {
        applyThemePreference('system');
      }
    };

    try {
      mediaQuery.addEventListener('change', handleSystemChange);
    } catch (e) {
      mediaQuery.addListener(handleSystemChange);
    }
  }
}
