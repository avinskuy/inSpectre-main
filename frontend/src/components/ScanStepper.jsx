const STEPS = ['Memeriksa struktur domain…', 'Mencocokkan pola phishing…', 'Menghitung skor risiko…'];

export default function ScanStepper() {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 text-sm"
          style={{ animation: `fadeIn .4s ease ${i * 0.45}s both` }}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyber-accent" />
          <span className="text-cyber-muted">{s}</span>
        </div>
      ))}
    </div>
  );
}
