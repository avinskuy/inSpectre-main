const STYLES = {
  aman: {
    icon: '✅',
    label: 'Aman',
    cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  curiga: {
    icon: '⚠️',
    label: 'Curiga',
    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  berbahaya: {
    icon: '🚨',
    label: 'Berbahaya',
    cls: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800',
  },
};

export default function RiskBadge({ level = 'aman' }) {
  const s = STYLES[level] || STYLES.aman;
  return (
    <span
      role="status"
      aria-label={`Status: ${s.label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${s.cls}`}
    >
      <span aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
}
