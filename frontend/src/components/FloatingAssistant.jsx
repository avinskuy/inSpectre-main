import { useEffect, useState } from 'react';

const TIPS = [
  { title: 'Dapat link yang mencurigakan?', text: 'Periksa dulu URL-nya sebelum membuka atau memasukkan data.', action: 'Periksa tautan', href: '#/analisis', icon: '↗' },
  { title: 'Menerima APK dari chat?', text: 'Jangan instal dulu. Periksa file dan sumber pengirimnya.', action: 'Periksa file', href: '#/analisis', icon: '▣' },
  { title: 'Sudah terlanjur tertipu?', text: 'Simpan bukti dan lihat langkah pelaporan yang tepat.', action: 'Lihat cara melapor', href: '#/melapor', icon: '⚑' },
];

export default function FloatingAssistant({ route }) {
  const [open, setOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => { setOpen(false); }, [route]);
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 12000);
    return () => window.clearInterval(timer);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (route === '#/asisten') return null;
  const tip = TIPS[tipIndex];

  return (
    <div className="floating-assistant" aria-label="Saran keamanan inSpectre">
      {open && <section className="assistant-popover" aria-labelledby="floating-assistant-title">
        <div className="assistant-popover-head"><div className="assistant-avatar">i<span>•</span></div><div><p className="assistant-overline">INSPECTRE ASSIST</p><h2 id="floating-assistant-title">Ada yang bisa dibantu?</h2></div><button type="button" className="assistant-close" onClick={() => setOpen(false)} aria-label="Tutup saran">×</button></div>
        <p className="assistant-intro">Pilih langkah yang paling sesuai dengan situasimu.</p>
        <div className="assistant-tip-card" key={tip.title}><div className="assistant-tip-icon">{tip.icon}</div><div><strong>{tip.title}</strong><p>{tip.text}</p></div></div>
        <a className="assistant-primary-action" href={tip.href}>{tip.action}<span aria-hidden="true">→</span></a>
        <div className="assistant-quick-links"><a href="#/asisten">Tanya asisten</a><span>·</span><a href="#/melapor">Cara melapor</a></div>
        <div className="assistant-dots" aria-label={`Saran ${tipIndex + 1} dari ${TIPS.length}`}>{TIPS.map((t, i) => <button key={t.title} type="button" className={i === tipIndex ? 'active' : ''} aria-label={`Tampilkan saran ${i + 1}`} onClick={() => setTipIndex(i)} />)}</div>
      </section>}
      <button type="button" className={`assistant-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Tutup asisten keamanan' : 'Buka saran keamanan'}>
        {open ? <span className="launcher-x">×</span> : <><span className="launcher-orbit"/><span className="launcher-spark">✦</span><span className="launcher-label">Bantuan</span></>}
      </button>
    </div>
  );
}
