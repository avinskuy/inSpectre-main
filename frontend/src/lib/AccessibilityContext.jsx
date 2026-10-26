import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'inspectre-prefs';

const defaultPrefs = {
  theme: 'system',        
  colorMode: 'normal',    
  fontSize: 'normal',     
  reduceMotion: false,    
};

const AccessibilityContext = createContext(null);

function loadPrefs() {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...defaultPrefs };
  }
}

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* mode privat / storage dinonaktifkan */ }
  }, [prefs]);

  const isDark = prefs.theme === 'system' ? systemDark : prefs.theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    const el = document.documentElement;
    const filters = {
      protanopia: 'url(#protanopia)',
      deuteranopia: 'url(#deuteranopia)',
      tritanopia: 'url(#tritanopia)',
    };
    el.style.filter = filters[prefs.colorMode] || '';
    el.dataset.fontSize = prefs.fontSize;
    el.dataset.reduceMotion = String(prefs.reduceMotion);
  }, [prefs]);

  const update = (patch) => setPrefs((p) => ({ ...p, ...patch }));

  return (
    <AccessibilityContext.Provider value={{ prefs, update, isDark }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useA11y() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useA11y harus dipakai di dalam AccessibilityProvider');
  return ctx;
    }
