import { useEffect } from 'react';

export default function Drawer({ open, onClose, links = [] }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <nav className="absolute left-0 top-0 h-full w-64 animate-slide-in-left bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-bold">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-lg p-2 text-gray-600 transition-transform hover:bg-gray-100 active:scale-90 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className="space-y-1">
          {links.map((l, i) => (
            <li key={l.href} style={{ animationDelay: `${i * 60}ms` }} className="animate-item-in">
              <a
                href={l.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-700
                  transition-all duration-150 hover:bg-gray-100 hover:translate-x-1
                  active:scale-95 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span className="text-lg" aria-hidden="true">{l.icon}</span>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
