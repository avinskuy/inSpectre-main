import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import StatCard from '../components/StatCard.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import { getStats } from '../lib/api.js';
import { useLiveFeed } from '../lib/socket.js';

const EMPTY_STATS = [
  { icon: '⌁', label: 'Total pemeriksaan', value: '—' },
  { icon: '⚠', label: 'Indikasi berbahaya', value: '—' },
  { icon: '✓', label: 'Dinilai relatif aman', value: '—' },
  { icon: '↗', label: 'Laporan komunitas', value: '—' },
];
const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
function toCards(data) {
  return [
    { icon: '⌁', label: 'Total pemeriksaan', value: formatNumber(data.total) },
    { icon: '⚠', label: 'Indikasi berbahaya', value: formatNumber(data.bahaya) },
    { icon: '✓', label: 'Dinilai relatif aman', value: formatNumber(data.aman) },
    { icon: '↗', label: 'Laporan komunitas', value: formatNumber(data.reports) },
  ];
}
const EVENT_ICON = { link: '↗', scam_number: '☎', scam_report: '⚑', apk: '▣' };
const EVENT_LEVEL = { AMAN: 'aman', BELUM_DIKETAHUI: 'belum-diketahui', WASPADA: 'curiga', CURIGA: 'curiga', BAHAYA: 'berbahaya', PHISHING: 'berbahaya' };
const eventLabel = (e) => e.url || e.number || e.fileName || '(identitas disamarkan)';
function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export default function Home() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const { events, stats: liveStats, connected } = useLiveFeed(5);
  useEffect(() => {
    let active = true;
    getStats().then((data) => active && setStats(toCards(data))).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => { if (liveStats) setStats(toCards(liveStats)); }, [liveStats]);

  return (
    <main className="page-shell">
      <section className="hero-panel" aria-labelledby="hero-title">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> RUANG AMAN DIGITAL · INDONESIA</div>
          <h1 id="hero-title">Jangan asal klik.<br /><span>Kenali risikonya.</span></h1>
          <p>Periksa tautan yang mencurigakan, pahami tanda bahayanya, dan ambil keputusan digital dengan lebih percaya diri.</p>
          <div className="hero-actions">
            <Button size="lg" onClick={() => (window.location.hash = '#/analisis')}>Mulai pemeriksaan <span aria-hidden="true">↗</span></Button>
            <a className="text-link" href="#/edukasi">Pelajari cara mengenali phishing <span aria-hidden="true">→</span></a>
          </div>
          <div className="hero-trust"><span>✓</span> Tidak membuka tautan yang diperiksa <span className="trust-divider">·</span> <span>✓</span> Hasil disertai alasan</div>
        </div>
        <div className="hero-visual" aria-label="Ilustrasi perlindungan digital">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="shield-illustration"><div className="shield-glow" /><svg viewBox="0 0 120 140" role="img" aria-label="Perisai keamanan"><path d="M60 7 103 24v36c0 31-17 54-43 70C34 114 17 91 17 60V24L60 7Z" fill="currentColor" opacity=".13"/><path d="M60 14 96 28v32c0 27-14 46-36 60C38 106 24 87 24 60V28L60 14Z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="m42 66 12 12 25-28" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <div className="float-chip chip-top"><span className="chip-icon chip-green">✓</span><span><b>Periksa dahulu</b><small>Keamanan dimulai dari sini</small></span></div>
          <div className="float-chip chip-bottom"><span className="chip-icon chip-purple">⌁</span><span><b>Analisis heuristik</b><small>Indikator URL diperiksa</small></span></div>
          <div className="visual-caption">PAUSE <span>·</span> CHECK <span>·</span> PROTECT</div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="stats-title">
        <div className="section-heading"><div><p className="eyebrow">GAMBARAN PLATFORM</p><h2 id="stats-title">Keamanan dimulai dari kesadaran</h2></div><span className={`connection-pill ${connected ? 'is-online' : ''}`}><i />{connected ? 'Live terhubung' : 'Menunggu koneksi'}</span></div>
        <div className="stats-grid">
          {stats.map((s, i) => <div className={`stat-wrap stat-tone-${i}`} key={s.label}><StatCard {...s} /></div>)}
        </div>
      </section>

      <section className="section-block" aria-labelledby="workflow-title">
        <div className="section-heading"><div><p className="eyebrow">DIBUAT UNTUK LEBIH WASPADA</p><h2 id="workflow-title">Tiga langkah sebelum klik</h2></div><p className="section-aside">Singkat, jelas, dan membantu kamu memahami alasannya.</p></div>
        <div className="feature-grid">
          <article className="feature-card feature-a"><div className="feature-top"><span className="feature-icon">↗</span><span className="feature-index">01 / INPUT</span></div><h3>Masukkan tautan</h3><p>Tempel URL yang kamu terima tanpa perlu membukanya terlebih dahulu.</p><a href="#/analisis">Periksa tautan <span>→</span></a></article>
          <article className="feature-card feature-b"><div className="feature-top"><span className="feature-icon">⌕</span><span className="feature-index">02 / ANALISIS</span></div><h3>Kenali indikator</h3><p>Sistem menilai pola domain, protokol, peniruan merek, dan kata kunci berisiko.</p><a href="#/analisis">Lihat cara kerja <span>→</span></a></article>
          <article className="feature-card feature-c"><div className="feature-top"><span className="feature-icon">⛨</span><span className="feature-index">03 / TINDAKAN</span></div><h3>Ambil keputusan</h3><p>Pahami temuan dan gunakan saran praktis sebelum membagikan data sensitif.</p><a href="#/edukasi">Buka panduan <span>→</span></a></article>
        </div>
      </section>

      <section className="live-panel" aria-labelledby="live-title">
        <div className="live-heading"><div><p className="eyebrow">AKTIVITAS TERKINI</p><h2 id="live-title">Sinyal dari sistem</h2><p>Aktivitas terbaru yang diterima oleh server inSpectre.</p></div><a href="#/dashboard" className="text-link">Buka dashboard lengkap <span>→</span></a></div>
        {events.length === 0 ? <div className="empty-feed"><span className="empty-symbol">⌁</span><div><b>Belum ada aktivitas baru</b><p>Hasil pemeriksaan akan muncul di sini ketika sistem menerima event.</p></div></div> : <ul aria-live="polite" className="event-list">{events.map((e, i) => <li key={`${e.scannedAt}-${i}`} className="event-row"><span className="event-symbol">{EVENT_ICON[e.type] || '⌁'}</span><span className="event-main"><b>{eventLabel(e)}</b><small>{e.type || 'aktivitas'} · {formatTime(e.scannedAt)}</small></span>{EVENT_LEVEL[e.riskLevel] ? <RiskBadge level={EVENT_LEVEL[e.riskLevel]} /> : <span className="event-muted">Aktivitas</span>}</li>)}</ul>}
      </section>
      <section className="safety-note"><span className="safety-icon">i</span><p><b>Transparansi adalah bagian dari keamanan.</b> Hasil inSpectre berbasis heuristik dan bukan jaminan bahwa situs aman atau berbahaya. Jika ragu, akses layanan melalui aplikasi atau alamat resmi yang kamu ketik sendiri.</p></section>
    </main>
  );
}
