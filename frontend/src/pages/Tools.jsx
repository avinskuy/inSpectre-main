import { useRef, useState } from 'react';
import jsQR from 'jsqr';
import { scanArchive, scanUrl } from '../lib/api.js';

const riskStyle = {
  AMAN: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  WASPADA: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  CURIGA: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  PHISHING: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  BAHAYA: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

function RiskResult({ result }) {
  if (!result) return null;
  const level = result.riskLevel || 'WASPADA';
  return <section className="mt-6 rounded-2xl border border-cyber-border bg-cyber-panel p-5 sm:p-6" aria-live="polite">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-cyber-muted">Hasil pemeriksaan statis</p><h2 className="mt-1 text-xl font-bold break-all">{result.fileName}</h2><p className="mt-1 text-sm text-cyber-muted">{result.fileType}{result.fileType === 'URL dari QR code' ? '' : ` · ${Math.ceil((result.fileSize || 0) / 1024)} KB · ${result.entriesScanned} entri`}</p></div>
      <span className={`rounded-full border px-3 py-1.5 text-sm font-bold ${riskStyle[level] || riskStyle.WASPADA}`}>{level}</span>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-[120px_1fr]">
      <div className="flex flex-col items-center justify-center rounded-xl border border-cyber-border p-4"><span className="text-3xl font-black tabular-nums">{result.threatScore}/100</span><span className="mt-1 text-xs text-cyber-muted">Skor indikator</span></div>
      <div className="rounded-xl bg-cyber-bg p-4"><p className="font-semibold">Ringkasan</p><p className="mt-1 text-sm leading-6 text-cyber-muted">{result.explanation?.summary}</p><p className="mt-2 text-xs text-cyber-muted">{result.explanation?.scoreMeaning}</p></div>
    </div>
    <h3 className="mt-6 font-bold">Indikator yang ditemukan ({result.findings?.length || 0})</h3>
    {result.findings?.length ? <div className="mt-3 space-y-3">{result.findings.map((f, i) => <article key={`${f.rule}-${i}`} className="rounded-xl border border-cyber-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-semibold">{f.title || f.rule || 'Indikator terdeteksi'}</h4><span className="rounded-full bg-cyber-bg px-2.5 py-1 text-xs font-bold">+{f.points} poin · {f.risk}</span></div><p className="mt-2 text-sm leading-6 text-cyber-muted">{f.detail || f.whyItMatters || f.desc || 'Periksa indikator ini bersama bukti dan konteks lainnya.'}</p><p className="mt-2 break-words rounded-lg bg-cyber-bg p-2 text-xs"><strong>Bukti:</strong> {f.evidence}</p><p className="mt-2 text-sm"><strong>Tindakan:</strong> {f.recommendation}</p></article>)}</div> : <p className="mt-3 rounded-xl border border-cyber-border p-4 text-sm text-cyber-muted">Tidak ada indikator dari aturan statis yang aktif ditemukan. Ini bukan jaminan file aman.</p>}
    {result.explanation?.limitations?.length > 0 && <aside className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><h3 className="font-semibold">Batasan pemeriksaan</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyber-muted">{result.explanation.limitations.map((x) => <li key={x}>{x}</li>)}</ul></aside>}
  </section>;
}

function isHttpUrl(value) {
  try { const u = new URL(value); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

export default function Tools({ embedded = false }) {
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileResult, setFileResult] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [qrText, setQrText] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const inputRef = useRef(null);

  const chooseFile = (next) => {
    setFileError(''); setFileResult(null); setFile(next || null);
    if (!next) return;
    const ext = next.name.toLowerCase().split('.').pop();
    if (!['apk', 'zip'].includes(ext)) { setFileError('Pilih file dengan ekstensi .apk atau .zip.'); setFile(null); return; }
    if (next.size > 25 * 1024 * 1024) { setFileError('Ukuran maksimum file adalah 25 MB.'); setFile(null); }
  };

  const submitFile = async (e) => {
    e.preventDefault(); if (!file || fileLoading) return;
    setFileLoading(true); setFileError(''); setFileResult(null);
    try { setFileResult(await scanArchive(file)); }
    catch (err) { setFileError(err.message || 'File tidak dapat dianalisis.'); }
    finally { setFileLoading(false); }
  };

  const decodeQr = async (e) => {
    const imageFile = e.target.files?.[0];
    setQrError(''); setQrText(''); setQrResult(null);
    if (!imageFile) return;
    if (!imageFile.type.startsWith('image/')) { setQrError('Pilih gambar PNG, JPG, atau WebP yang berisi QR code.'); return; }
    if (imageFile.size > 10 * 1024 * 1024) { setQrError('Ukuran gambar maksimum 10 MB.'); return; }
    setQrLoading(true);
    try {
      const objectUrl = URL.createObjectURL(imageFile);
      try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error('Resolusi gambar terlalu besar. Gunakan gambar dengan resolusi lebih rendah.');
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
        if (!decoded?.data) throw new Error('QR code tidak terbaca. Coba gambar yang lebih jelas, lurus, dan tidak terpotong.');
        setQrText(decoded.data);
      } finally { URL.revokeObjectURL(objectUrl); }
    } catch (err) { setQrError(err.message || 'Gagal membaca gambar QR.'); }
    finally { setQrLoading(false); e.target.value = ''; }
  };

  const checkQrUrl = async () => {
    if (!isHttpUrl(qrText) || urlLoading) return;
    setUrlLoading(true); setQrError(''); setQrResult(null);
    try { setQrResult(await scanUrl(qrText)); }
    catch (err) { setQrError(err.message || 'URL QR gagal diperiksa.'); }
    finally { setUrlLoading(false); }
  };

  const Wrapper = embedded ? 'div' : 'main';
  return <Wrapper className={embedded ? "space-y-5" : "page-shell mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
    {!embedded && <section className="hero-panel mb-7" aria-labelledby="tools-title"><div className="hero-grid" aria-hidden="true"/><div className="hero-copy"><div className="eyebrow"><span className="status-dot"/> TOOLKIT KEAMANAN DIGITAL</div><h1 id="tools-title">Periksa sebelum <span>dipercaya.</span></h1><p>Analisis struktur APK/ZIP secara statis atau baca QR code sebelum membuka tautan yang disematkan.</p><div className="hero-trust"><span>✓</span> File tidak dijalankan <span className="trust-divider">·</span><span>✓</span> QR diproses di browser</div></div><div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="shield-illustration"><div className="shield-glow"/><svg viewBox="0 0 120 140"><path d="M60 7 103 24v36c0 31-17 54-43 70C34 114 17 91 17 60V24L60 7Z" fill="currentColor" opacity=".13"/><path d="M60 14 96 28v32c0 27-14 46-36 60C38 106 24 87 24 60V28L60 14Z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="m42 66 12 12 25-28" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="float-chip chip-top"><span className="chip-icon chip-green">✓</span><span><b>Static analysis</b><small>No execution</small></span></div><div className="float-chip chip-bottom"><span className="chip-icon chip-purple">▦</span><span><b>QR inspection</b><small>Decode before opening</small></span></div><div className="visual-caption">INSPECT <span>·</span> VERIFY <span>·</span> PROTECT</div></div></section>}

    <div className="scan-mode-switch" role="tablist" aria-label="Jenis pemeriksaan"><button role="tab" aria-selected={mode === 'file'} type="button" className={mode === 'file' ? 'active' : ''} onClick={() => setMode('file')}>▣ Periksa APK / ZIP</button><button role="tab" aria-selected={mode === 'qr'} type="button" className={mode === 'qr' ? 'active' : ''} onClick={() => setMode('qr')}>▦ QR Code Checker</button></div>

    {mode === 'file' ? <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-cyber-border bg-cyber-panel p-5 sm:p-7"><h2 className="text-xl font-bold">Pemeriksaan APK / ZIP</h2><p className="mt-2 text-sm leading-6 text-cyber-muted">Pemindai memeriksa nama entri, struktur arsip, dan string yang dapat dibaca. File tidak dieksekusi maupun diekstrak ke disk.</p>
        <form onSubmit={submitFile} className="mt-5 space-y-4"><label htmlFor="archive-file" className="block cursor-pointer rounded-2xl border-2 border-dashed border-cyber-border p-7 text-center transition hover:border-cyber-accent hover:bg-cyber-accent/5"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyber-bg text-2xl">⇧</span><span className="mt-3 block font-semibold">{file ? file.name : 'Pilih atau jatuhkan file di sini'}</span><span className="mt-1 block text-xs text-cyber-muted">APK atau ZIP · Maksimum 25 MB</span><input ref={inputRef} id="archive-file" type="file" accept=".apk,.zip,application/zip,application/vnd.android.package-archive" className="sr-only" onChange={(e) => chooseFile(e.target.files?.[0])}/></label>
          {file && <div className="flex items-center justify-between rounded-lg bg-cyber-bg px-3 py-2 text-sm"><span className="truncate">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span><button type="button" onClick={() => { chooseFile(null); if (inputRef.current) inputRef.current.value = ''; }} className="ml-3 text-cyber-accent">Hapus</button></div>}
          {fileError && <p role="alert" className="text-sm text-rose-600">{fileError}</p>}
          <button type="submit" disabled={!file || fileLoading} className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{fileLoading ? 'Menganalisis struktur…' : 'Analisis file'}</button>
        </form>
      </div>
      <aside className="rounded-2xl border border-cyber-border bg-cyber-panel p-5"><h3 className="font-bold">Apa yang diperiksa?</h3><ul className="mt-3 space-y-3 text-sm text-cyber-muted"><li><b className="text-cyber-text">Struktur arsip</b><br/>Entri, ukuran, rasio kompresi, dan jalur berbahaya.</li><li><b className="text-cyber-text">Nama dan ekstensi</b><br/>File executable, ekstensi ganda, dan paket bersarang.</li><li><b className="text-cyber-text">Indikator statis APK</b><br/>String terkait kapabilitas Android sensitif bila terbaca.</li></ul><div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-cyber-muted">Bukan antivirus. Jangan menginstal APK hanya karena hasilnya AMAN. Analisis ini belum memeriksa perilaku aplikasi saat dijalankan.</div></aside>
      <div className="lg:col-span-2"><RiskResult result={fileResult}/></div>
    </section> : <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-cyber-border bg-cyber-panel p-5 sm:p-7"><h2 className="text-xl font-bold">QR Code Checker</h2><p className="mt-2 text-sm leading-6 text-cyber-muted">Unggah tangkapan layar atau gambar QR. Dekode berlangsung di browser; gambar tidak dikirim ke backend. QR tidak akan dibuka otomatis.</p>
        <label htmlFor="qr-image" className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-cyber-border p-7 text-center transition hover:border-cyber-accent hover:bg-cyber-accent/5"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyber-bg text-2xl">▦</span><span className="mt-3 block font-semibold">Pilih gambar yang berisi QR code</span><span className="mt-1 block text-xs text-cyber-muted">PNG, JPG, WebP</span><input id="qr-image" type="file" accept="image/png,image/jpeg,image/webp,image/*" className="sr-only" onChange={decodeQr}/></label>
        {qrLoading && <p role="status" className="mt-4 text-sm text-cyber-muted">Membaca QR code…</p>}{qrError && <p role="alert" className="mt-4 text-sm text-rose-600">{qrError}</p>}
        {qrText && <div className="mt-5 rounded-xl border border-cyber-border p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-bold">Konten QR berhasil dibaca</h3><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">Decoded</span></div><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-cyber-bg p-3 text-sm">{qrText}</pre>{isHttpUrl(qrText) ? <><p className="mt-3 text-sm text-cyber-muted">QR berisi URL web. Periksa URL ini dengan analisis heuristik sebelum membukanya.</p><button type="button" onClick={checkQrUrl} disabled={urlLoading} className="mt-3 w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">{urlLoading ? 'Memeriksa URL…' : 'Analisis URL dari QR'}</button></> : <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-cyber-muted">Konten ini bukan URL HTTP/HTTPS yang dikenali. Jangan salin ke aplikasi atau jalankan jika kamu tidak mengetahui sumbernya.</p>}</div>}
      </div>
      <aside className="rounded-2xl border border-cyber-border bg-cyber-panel p-5"><h3 className="font-bold">Sebelum memindai</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-cyber-muted"><li>Ambil tangkapan layar atau pilih gambar QR.</li><li>Periksa konten yang berhasil didekode.</li><li>Jika berupa URL, jalankan pemeriksaan sebelum membuka.</li></ol><div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-cyber-muted">Pemindai ini mendekode gambar yang diunggah, bukan menggunakan kamera langsung. Hasil URL memakai heuristik yang sama dengan fitur Analisis.</div></aside>
      {qrResult && <div className="lg:col-span-2"><RiskResult result={{...qrResult, fileName: qrText, fileType: 'URL dari QR code', fileSize: 0, entriesScanned: 0, explanation: {...qrResult.explanation, summary: qrResult.explanation?.summary || `Hasil pemeriksaan URL dari QR: ${qrResult.riskLevel}.`}}}/></div>}
    </section>}
    <p className="mt-7 text-xs leading-6 text-cyber-muted">inSpectre memberikan indikator awal, bukan jaminan keamanan. Skor bukan probabilitas malware/phishing. Jangan mengunggah file yang berisi informasi rahasia jika tidak diizinkan oleh pemiliknya.</p>
  </Wrapper>;
}
