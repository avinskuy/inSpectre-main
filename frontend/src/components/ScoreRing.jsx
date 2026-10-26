export default function ScoreRing({ score, size = 120 }) {
  const color = score >= 70 ? 'var(--safe)' : score >= 40 ? 'var(--warn)' : 'var(--danger)';
  const radius = (size - 14) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const mid = size / 2;

  return (
    <svg width={size} height={size} role="img" aria-label={`Skor keamanan ${score} dari 100`}>
      <circle cx={mid} cy={mid} r={radius} fill="none"
        stroke="var(--border)" strokeWidth="10" />
      <circle cx={mid} cy={mid} r={radius} fill="none"
        stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${mid} ${mid})`}
        style={{ transition: 'stroke-dashoffset 1s ease, stroke .3s' }} />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
        fill="var(--text)" fontSize={size / 4} fontWeight="bold">
        {score}
      </text>
      <text x="50%" y="65%" textAnchor="middle" fill="var(--muted)"
        fontSize={size / 9}>/100</text>
    </svg>
  );
}
