const STYLES = {
  aman: {
    label: 'Aman',
    color: 'text-emerald-400',
    path: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z M9 12l2 2 4-4',
  },
  curiga: {
    label: 'Curiga',
    color: 'text-amber-400',
    path: 'M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z M12 9v4 M12 17h.01',
  },
  berbahaya: {
    label: 'Berbahaya',
    color: 'text-red-400',
    path: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z M12 8v4 M12 16h.01',
  },
  'belum-diketahui': {
    label: 'Belum diketahui',
    color: 'text-slate-400',
    path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3 M12 17h.01',
  },
};

export default function RiskBadge({ level = 'belum-diketahui' }) {
  const s = STYLES[level] || STYLES['belum-diketahui'];

  return (
    <span
      role="status"
      aria-label={`Status: ${s.label}`}
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-200 ${s.color}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 shrink-0 ${s.color}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={s.path} />
      </svg>
      <span>{s.label}</span>
    </span>
  );
}
