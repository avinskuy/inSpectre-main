import { useEffect, useRef, useState } from 'react';
import NavIcon from './NavIcon.jsx';

function isActive(link, current) {
  return current === link.href || link.activeRoutes?.includes(current);
}

function LinkList({ items, current, onClose }) {
  return (
    <ul className="space-y-1">
      {items.map((link) => {
        const active = isActive(link, current);
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#7dd3fc]" aria-hidden="true">
                <NavIcon name={link.icon} className="h-4 w-4" />
              </span>
              <span>{link.label}</span>
              {active && <span className="ml-auto text-xs">Aktif</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function Drawer({
  open,
  onClose,
  primaryLinks = [],
  informationLinks = [],
  utilityLinks = [],
  current = '#/',
}) {
  const closeButtonRef = useRef(null);
  const [informationOpen, setInformationOpen] = useState(false);
  const informationActive = informationLinks.some((link) => isActive(link, current));

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (informationActive) setInformationOpen(true);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, informationActive]);

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

      <nav className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-[#0b1220] p-5 text-slate-100 shadow-2xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7dd3fc]">
              INSPECTRE NEXUS
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-100">Eksplorasi</h2>
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
        <LinkList items={primaryLinks} current={current} onClose={onClose} />

        {informationLinks.length > 0 && (
          <section className="mt-7">
            <button
              type="button"
              onClick={() => setInformationOpen((value) => !value)}
              aria-expanded={informationOpen}
              aria-controls="drawer-information-links"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7dd3fc] ${
                informationActive ? 'text-[#f5b96b]' : 'text-slate-300'
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#7dd3fc]" aria-hidden="true">
                <NavIcon name="book" className="h-4 w-4" />
              </span>
              <span className="flex-1">Pusat Informasi</span>
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 transition-transform ${informationOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {informationOpen && (
              <div id="drawer-information-links" className="mt-2 border-l border-white/10 pl-3">
                <LinkList items={informationLinks} current={current} onClose={onClose} />
              </div>
            )}
          </section>
        )}

        {utilityLinks.length > 0 && (
          <section className="mt-7">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              AKTIVITAS
            </div>
            <LinkList items={utilityLinks} current={current} onClose={onClose} />
          </section>
        )}

        <p className="mt-auto border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-500">
          Hasil pemeriksaan dan data pemantauan perlu dibaca sesuai sumber, waktu, dan keterbatasannya.
        </p>
      </nav>
    </div>
  );
}
