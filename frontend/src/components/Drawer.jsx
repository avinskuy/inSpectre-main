import { useEffect, useRef } from 'react';
import NavIcon from './NavIcon.jsx';

export default function Drawer({ open, onClose, primaryLinks = [], links = [], current = '#/' }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Navigasi dan fitur inSpectre"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-gray-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup menu"
        tabIndex={-1}
      />

      <nav className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b1220] p-5 text-slate-100 shadow-2xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7dd3fc]">
              INSPECTRE NEXUS
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-100">
              Eksplorasi
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Temukan fitur dan informasi pendukung.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7dd3fc]"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          NAVIGASI UTAMA
        </div>
        <ul className="mb-6 space-y-1">
          {primaryLinks.map((link) => {
            const active = current === link.href;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#f5b96b]/15 text-[#f5b96b]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-[#7dd3fc]'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base text-[#7dd3fc]" aria-hidden="true">
                    <NavIcon name={link.icon} className="h-4 w-4" />
                  </span>
                  <span>{link.label}</span>
                  {active && <span className="ml-auto text-xs">Aktif</span>}
                </a>
              </li>
            );
          })}
        </ul>
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          FITUR TAMBAHAN
        </div>

        <ul className="flex-1 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active = current === link.href || (link.href === '#/' && current === '#/');

            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7dd3fc] ${
                    active
                      ? 'bg-[#f5b96b]/15 text-[#f5b96b]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-[#7dd3fc]'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base text-[#7dd3fc]" aria-hidden="true">
                    <NavIcon name={link.icon} className="h-4 w-4" />
                  </span>
                  <span>{link.label}</span>
                  {active && (
                    <span className="ml-auto text-xs" aria-label="Halaman aktif">
                      Aktif
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        <p className="border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-slate-500">
          Hasil pemeriksaan dan data pemantauan perlu dibaca sesuai sumber, waktu, dan keterbatasannya.
        </p>
      </nav>
    </div>
  );
}
