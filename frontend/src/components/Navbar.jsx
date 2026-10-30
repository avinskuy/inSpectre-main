import { useState, useEffect } from 'react';
import Logo from './Logo.jsx';
import AccessibilityMenu from './AccessibilityMenu.jsx';
import Drawer from './Drawer.jsx';
import NavIcon from './NavIcon.jsx';

const PRIMARY_LINKS = [
  { href: '#/', label: 'Nexus', icon: 'home' },
  { href: '#/fitur/security', label: 'Security Center', icon: 'shield' },
  { href: '#/fitur/world-monitor', label: 'World Monitor', icon: 'globe' },
  { href: '#/fitur/analisis', label: 'Analisis', icon: 'search' },
];

const ALL_LINKS = [
  { href: '#/fitur/edukasi', label: 'Edukasi', icon: 'book' },
  { href: '#/fitur/berita', label: 'Berita', icon: 'news' },
  { href: '#/fitur/asisten', label: 'Asisten Keamanan', icon: 'spark' },
  { href: '#/fitur/melapor', label: 'Cara Melapor', icon: 'arrow' },
  { href: '#/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '#/history', label: 'Riwayat', icon: 'history' },
];
function routeIsActive(current, href) {
  if (href === '#/') return current === '#/';
  return current === href;
}

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState(
    typeof window !== 'undefined' ? window.location.hash || '#/' : '#/'
  );

  useEffect(() => {
    const onHash = () => {
      setCurrent(window.location.hash || '#/');
      setDrawerOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1220]/95 text-slate-100 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <a
            href="#/"
            aria-label="inSpectre — ke halaman utama"
            className="shrink-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Logo />
          </a>

          <nav aria-label="Navigasi utama" className="hidden min-w-0 flex-1 justify-center md:flex">
            <ul className="flex items-center gap-1">
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={routeIsActive(current, link.href) ? 'page' : undefined}
                    className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      routeIsActive(current, link.href)
                        ? 'bg-[#f5b96b]/15 text-[#f5b96b]'
                        : 'text-slate-300 hover:bg-white/5 hover:text-[#7dd3fc]'
                    }`}
                  >
                    <NavIcon name={link.icon} className="h-4 w-4" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <AccessibilityMenu />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka semua fitur dan utilitas"
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-[#7dd3fc]/40 hover:bg-white/5 hover:text-[#7dd3fc]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Semua fitur</span>
            </button>
          </div>
        </div>
      </header>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        primaryLinks={PRIMARY_LINKS}
        links={ALL_LINKS}
        current={current}
      />
    </>
  );
}
