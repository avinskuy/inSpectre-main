import { useEffect, useRef, useState } from 'react';
import { useA11y } from '../lib/AccessibilityContext.jsx';

const THEMES = [
  { id: 'dark', label: 'Gelap' },
  { id: 'light', label: 'Terang' },
  { id: 'system', label: 'Sistem' },
];

const COLOR_MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'deuteranopia', label: 'Merah-hijau (deuteranopia)' },
  { id: 'protanopia', label: 'Merah-hijau (protanopia)' },
  { id: 'tritanopia', label: 'Biru (tritanopia)' },
];

const FONT_SIZES = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Besar' },
];

function Segmen({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`flex-1 px-2 py-1.5 text-sm transition-colors ${
            value === o.id
              ? 'bg-emerald-500 text-gray-950 font-semibold'
              : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AccessibilityMenu() {
  const { prefs, update } = useA11y();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
    return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Pengaturan aksesibilitas"
        aria-expanded={open}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="4" r="2" />
          <path d="M4 8h16M12 8v6l4 6M12 14l-4 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pengaturan aksesibilitas"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xl"
        >
          <p className="font-semibold">Tampilan</p>

          <p className="mt-3 mb-1 text-xs text-gray-500">Tema</p>
          <Segmen options={THEMES} value={prefs.theme} onChange={(v) => update({ theme: v })} />

          <p className="mt-4 mb-1 text-xs text-gray-500">Ukuran font</p>
          <Segmen options={FONT_SIZES} value={prefs.fontSize} onChange={(v) => update({ fontSize: v })} />

          <p className="mt-4 mb-1 text-xs text-gray-500">Mode buta warna</p>
          <select
            value={prefs.colorMode}
            onChange={(e) => update({ colorMode: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          >
            {COLOR_MODES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>

          <label className="mt-4 flex items-center justify-between text-sm">
            <span>Kurangi animasi</span>
            <input
              type="checkbox"
              checked={prefs.reduceMotion}
              onChange={(e) => update({ reduceMotion: e.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
          </label>
        </div>
      )}
    </div>
  );
}
