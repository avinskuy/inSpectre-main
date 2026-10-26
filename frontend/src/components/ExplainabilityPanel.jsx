export default function ExplainabilityPanel({ explanation, threatScore = 0, findings = [], reputation = null }) {
  if (!explanation) return null;
  const total = Math.max(0, Math.min(100, Number(threatScore) || 0));
  const breakdown = explanation.scoreBreakdown || findings.map((f) => ({ rule: f.rule, points: f.points || 0, risk: f.risk, evidence: f.evidence }));
  const max = Math.max(1, ...breakdown.map((item) => Number(item.points) || 0));

  return (
    <section className="mt-4 rounded-xl border border-cyber-border bg-cyber-panel p-4" aria-labelledby="explainability-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-cyber-accent">Explainable Threat Detection</p>
          <h3 id="explainability-title" className="mt-1 text-base font-bold">Mengapa hasil ini diberikan?</h3>
        </div>
        <span className="rounded-full border border-cyber-border px-2.5 py-1 text-xs">Model {explanation.modelVersion || 'heuristik'}</span>
      </div>
      <p className="mt-3 text-sm text-cyber-muted">{explanation.summary}</p>
      {reputation && (
        <div className="mt-4 rounded-lg border border-cyber-border p-3">
          <h4 className="text-sm font-semibold">Reputasi URL — Google Safe Browsing</h4>
          {reputation.status === 'threat' ? (
            <div className="mt-2">
              <p className="text-sm font-semibold text-red-400">Ancaman terdeteksi</p>
              <p className="mt-1 text-xs text-cyber-muted">Google melaporkan URL ini sebagai ancaman. Hindari membuka tautan atau memasukkan data pribadi.</p>
              {reputation.threats?.length > 0 && <p className="mt-1 break-words text-xs">Kategori: {reputation.threats.join(', ')}</p>}
            </div>
          ) : reputation.status === 'no_match' ? (
            <div className="mt-2">
              <p className="text-sm font-semibold text-cyber-safe">Tidak ada kecocokan ancaman</p>
              <p className="mt-1 text-xs text-cyber-muted">Google Safe Browsing tidak menemukan kecocokan. Ini bukan jaminan situs aman.</p>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-semibold">Pemeriksaan reputasi tidak tersedia</p>
              <p className="mt-1 text-xs text-cyber-muted">Hasil saat ini hanya mengandalkan indikator heuristik lokal; reputasi URL belum terverifikasi.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-cyber-border p-3">
          <p className="text-xs text-cyber-muted">Skor risiko heuristik</p>
          <p className="mt-1 text-2xl font-bold">{total}<span className="text-sm font-medium text-cyber-muted">/100</span></p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cyber-border" role="img" aria-label={`Skor risiko ${total} dari 100`}>
            <div className="h-full rounded-full bg-cyber-accent transition-all" style={{ width: `${total}%` }} />
          </div>
          <p className="mt-2 text-xs text-cyber-muted">Skor berasal dari penjumlahan aturan yang cocok, dibatasi maksimum 100.</p>
        </div>
        <div className="rounded-lg border border-cyber-border p-3">
          <p className="text-xs text-cyber-muted">Metode dan keyakinan</p>
          <p className="mt-1 font-semibold">{explanation.method || 'Heuristik berbasis aturan'}</p>
          <p className="mt-1 text-sm">{explanation.confidence || 'Terbatas'}</p>
          <p className="mt-2 text-xs text-cyber-muted">Keyakinan bersifat kualitatif, bukan probabilitas terukur.</p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold">Kontribusi tiap indikator</h4>
          <div className="mt-2 space-y-3">
            {breakdown.map((item, index) => (
              <div key={`${item.rule || 'rule'}-${index}`}>
                <div className="mb-1 flex items-start justify-between gap-3 text-xs">
                  <span className="break-all font-medium">{String(item.rule || 'INDIKATOR').replaceAll('_', ' ')}</span>
                  <span className="shrink-0 font-bold">+{Number(item.points) || 0}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-cyber-border">
                  <div className="h-full rounded-full bg-cyber-accent" style={{ width: `${Math.min(100, ((Number(item.points) || 0) / max) * 100)}%` }} />
                </div>
                {item.evidence && <p className="mt-1 break-words text-xs text-cyber-muted">Bukti: {item.evidence}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {explanation.positiveSignals?.length > 0 && (
        <div className="mt-4 rounded-lg border border-cyber-safe/30 p-3">
          <h4 className="text-sm font-semibold">Sinyal positif</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-cyber-muted">
            {explanation.positiveSignals.map((signal, index) => <li key={`${signal.label}-${index}`}>{signal.label}{signal.evidence ? ` — ${signal.evidence}` : ''}</li>)}
          </ul>
        </div>
      )}

      {explanation.limitations?.length > 0 && (
        <details className="mt-4 rounded-lg border border-cyber-border p-3">
          <summary className="cursor-pointer text-sm font-semibold">Batasan pemeriksaan</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyber-muted">
            {explanation.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}
          </ul>
        </details>
      )}
      <p className="mt-3 text-xs text-cyber-muted">{explanation.scoreMeaning}</p>
    </section>
  );
}
