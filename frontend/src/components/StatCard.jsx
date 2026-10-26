export default function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top"><span className="stat-icon" aria-hidden="true">{icon}</span><span className="stat-trend" aria-hidden="true">↗</span></div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
