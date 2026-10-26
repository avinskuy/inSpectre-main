import { useState } from 'react';

const SEV = {
  tinggi: { label: 'TINGGI', cls: 'bg-cyber-danger/15 text-cyber-danger border-cyber-danger/40' },
  sedang: { label: 'SEDANG', cls: 'bg-cyber-warn/15 text-cyber-warn border-cyber-warn/40' },
  rendah: { label: 'RENDAH', cls: 'bg-cyber-safe/15 text-cyber-safe border-cyber-safe/40' },
};

export default function FindingCard({ severity, title, detail, points, evidence, recommendation, category }) {
  const [open, setOpen] = useState(false);
  const s = SEV[severity] ?? SEV.rendah;

  return (
    <article className="rounded-lg border border-cyber-border bg-cyber-panel p-3">
      <button type="button" onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}>
        <span className={`rounded border px-2 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
        <span className="flex-1 text-sm font-medium">{title}</span>
        {Number.isFinite(points) && <span className="whitespace-nowrap rounded-md border border-cyber-border px-2 py-1 text-xs font-bold">+{points} poin</span>}
        <span className="text-cyber-muted" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-cyber-border pt-3 text-sm">
          {category && <p><span className="font-semibold">Kategori: </span>{category}</p>}
          <p className="text-cyber-muted">{detail}</p>
          {evidence && <div className="rounded-md border border-cyber-border bg-black/5 p-2 dark:bg-white/5"><p className="mb-1 text-xs font-bold uppercase tracking-wide">Bukti yang terdeteksi</p><code className="break-words text-xs">{evidence}</code></div>}
          {recommendation && <p><span className="font-semibold">Saran: </span>{recommendation}</p>}
        </div>
      )}
    </article>
  );
}
