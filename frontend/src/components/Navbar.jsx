import { useState, useEffect } from 'react';
import Logo from './Logo.jsx';
import AccessibilityMenu from './AccessibilityMenu.jsx';
import Drawer from './Drawer.jsx';

const LINKS = [
  { href: '#/', label: 'Nexus', icon: '⌂' },
  { href: '#/security', label: 'Security Center', icon: '◈' },
  { href: '#/world-monitor', label: 'World Monitor', icon: '◎' },
  { href: '#/analisis', label: 'Analisis', icon: '🔍' },
  { href: '#/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '#/history', label: 'Riwayat', icon: '↺' },
  { href: '#/edukasi', label: 'Edukasi', icon: '📚' },
  { href: '#/berita', label: 'Berita', icon: '🛡️' },
  { href: '#/asisten', label: 'Asisten AI', icon: '✦' },
  { href: '#/melapor', label: 'Cara Melapor', icon: '⚑' },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState(
    typeof window !== 'undefined' ? window.location.hash || '#/' : '#/'
  );

  useEffect(() => {
    const onHash = () => setCurrent(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <a href="#/" aria-label="inSpectre - ke halaman utama" className="transition-transform duration-200 hover:scale-105 active:scale-95">
              <Logo />
            </a>

            <nav aria-label="Navigasi utama" className="hidden md:block">
              <ul className="flex gap-1">
                {LINKS.map((l, i) => (
                  <li
                    key={l.href}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="animate-nav-fade"
                  >
                    <a
                      href={l.href}
                      aria-current={current === l.href ? 'page' : undefined}
                      className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium
                        transition-all duration-200 hover:-translate-y-0.5
                        ${
                          current === l.href
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                        }`}
                    >
                      <span aria-hidden="true">{l.icon}</span>
                      {l.label}
                      {current === l.href && (
                        <span className="animate-underline absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-blue-500 dark:bg-blue-400" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <AccessibilityMenu />

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              aria-expanded={drawerOpen}
              className="rounded-lg p-2 text-gray-600 transition-transform hover:bg-gray-100 active:scale-90 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={LINKS} />
    </>
  );
}
