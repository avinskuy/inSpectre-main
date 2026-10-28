import { useEffect, useRef } from 'react';

export default function Drawer({ open, onClose, links = [], current = '#/' }) {
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
      aria-label="Semua fitur dan utilitas"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-gray-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup menu"
        tabIndex={-1}
      />

      <nav className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              inSpectre Nexus
            </p>
            <h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">
              Semua fitur
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pilih ruang kerja atau utilitas.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Fitur dan workspace
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
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-base dark:bg-gray-800" aria-hidden="true">
                    {link.icon}
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

        <p className="border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">
          Hasil pemeriksaan dan data pemantauan perlu dibaca sesuai sumber, waktu, dan keterbatasannya.
        </p>
      </nav>
    </div>
  );
}
