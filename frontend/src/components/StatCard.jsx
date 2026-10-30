const ICONS = {
  scan: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4M8 11h6M11 8v6" /></>,
  alert: <><path d="m12 3 9 18H3L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  report: <><path d="M5 21V4m0 0h13l-2.5 4L18 12H5" /></>,
};

export default function StatCard({ icon, label, value }) {
  const iconContent = typeof icon === 'string' ? ICONS[icon] : icon;

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-icon" aria-hidden="true">
          {typeof icon === 'string' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {iconContent || ICONS.scan}
            </svg>
          ) : iconContent}
        </span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
