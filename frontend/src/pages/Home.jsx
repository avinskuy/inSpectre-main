import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import StatCard from '../components/StatCard.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import { getStats } from '../lib/api.js';
import { useLiveFeed } from '../lib/socket.js';

function Icon({ name, size = 20 }) {
  const paths = {
    scan: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4M8 11h6M11 8v6" /></>,
    alert: <><path d="m12 3 9 18H3L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    report: <><path d="M5 21V4m0 0h13l-2.5 4L18 12H5" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" /></>,
    phone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
    apk: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.3 2.3 4.7-5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.activity}</svg>;
}

const EMPTY_STATS = [
  { icon: <Icon name="scan" />, label: 'Total pemeriksaan', value: '—' },
  { icon: <Icon name="alert" />, label: 'Indikasi berbahaya', value: '—' },
  { icon: <Icon name="check" />, label: 'Dinilai relatif aman', value: '—' },
  { icon: <Icon name="report" />, label: 'Laporan komunitas', value: '—' },
];
const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
function toCards(data) {
  return [
    { icon: <Icon name="scan" />, label: 'Total pemeriksaan', value: formatNumber(data.total) },
    { icon: <Icon name="alert" />, label: 'Indikasi berbahaya', value: formatNumber(data.bahaya) },
    { icon: <Icon name="check" />, label: 'Dinilai relatif aman', value: formatNumber(data.aman) },
    { icon: <Icon name="report" />, label: 'Laporan komunitas', value: formatNumber(data.reports) },
  ];
}
const EVENT_ICON = { link: 'link', scam_number: 'phone', scam_report: 'report', apk: 'apk' };
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
            <Button size="lg" onClick={() => (window.location.hash = '#/analisis')}>Mulai pemeriksaan <Icon name="arrow" size={16} /></Button>
            <a className="text-link" href="#/edukasi">Pelajari cara mengenali phishing <span aria-hidden="true">→</span></a>
          </div>
          <div className="hero-trust"><Icon name="check" size={14} /> Tidak membuka tautan yang diperiksa <span className="trust-divider">·</span> <Icon name="check" size={14} /> Hasil disertai alasan</div>
        </div>
        <div className="hero-visual" aria-label="Ilustrasi perlindungan digital">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="shield-illustration"><div className="shield-glow" /><svg viewBox="0 0 120 140" role="img" aria-label="Perisai keamanan"><path d="M60 7 103 24v36c0 31-17 54-43 70C34 114 17 91 17 60V24L60 7Z" fill="currentColor" opacity=".13"/><path d="M60 14 96 28v32c0 27-14 46-36 60C38 106 24 87 24 60V28L60 14Z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="m42 66 12 12 25-28" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <div className="float-chip chip-top"><span className="chip-icon chip-green"><Icon name="shield" size={17} /></span><span><b>Periksa dahulu</b><small>Keamanan dimulai dari sini</small></span></div>
          <div className="float-chip chip-bottom"><span className="chip-icon chip-purple"><Icon name="scan" size={17} /></span><span><b>Analisis heuristik</b><small>Indikator URL diperiksa</small></span></div>
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
          <article className="feature-card feature-a"><div className="feature-top"><span className="feature-icon"><Icon name="link" size={21} /></span><span className="feature-index">01 / INPUT</span></div><h3>Masukkan tautan</h3><p>Tempel URL yang kamu terima tanpa perlu membukanya terlebih dahulu.</p><a href="#/analisis">Periksa tautan <Icon name="arrow" size={14} /></a></article>
          <article className="feature-card feature-b"><div className="feature-top"><span className="feature-icon"><Icon name="search" size={21} /></span><span className="feature-index">02 / ANALISIS</span></div><h3>Kenali indikator</h3><p>Sistem menilai pola domain, protokol, peniruan merek, dan kata kunci berisiko.</p><a href="#/analisis">Lihat cara kerja <Icon name="arrow" size={14} /></a></article>
          <article className="feature-card feature-c"><div className="feature-top"><span className="feature-icon"><Icon name="shield" size={21} /></span><span className="feature-index">03 / TINDAKAN</span></div><h3>Ambil keputusan</h3><p>Pahami temuan dan gunakan saran praktis sebelum membagikan data sensitif.</p><a href="#/edukasi">Buka panduan <Icon name="arrow" size={14} /></a></article>
        </div>
      </section>

      <section className="live-panel" aria-labelledby="live-title">
        <div className="live-heading"><div><p className="eyebrow">AKTIVITAS TERKINI</p><h2 id="live-title">Sinyal dari sistem</h2><p>Aktivitas terbaru yang diterima oleh server inSpectre.</p></div><a href="#/dashboard" className="text-link">Buka dashboard lengkap <Icon name="arrow" size={14} /></a></div>
        {events.length === 0 ? <div className="empty-feed"><span className="empty-symbol"><Icon name="activity" size={22} /></span><div><b>Belum ada aktivitas baru</b><p>Hasil pemeriksaan akan muncul di sini ketika sistem menerima event.</p></div></div> : <ul aria-live="polite" className="event-list">{events.map((e, i) => <li key={`${e.scannedAt}-${i}`} className="event-row"><span className="event-symbol"><Icon name={EVENT_ICON[e.type] || 'activity'} /></span><span className="event-main"><b>{eventLabel(e)}</b><small>{e.type || 'aktivitas'} · {formatTime(e.scannedAt)}</small></span>{EVENT_LEVEL[e.riskLevel] ? <RiskBadge level={EVENT_LEVEL[e.riskLevel]} /> : <span className="event-muted">Aktivitas</span>}</li>)}</ul>}
      </section>
      <section className="safety-note"><span className="safety-icon"><Icon name="info" size={15} /></span><p><b>Transparansi adalah bagian dari keamanan.</b> Hasil inSpectre berbasis heuristik dan bukan jaminan bahwa situs aman atau berbahaya. Jika ragu, akses layanan melalui aplikasi atau alamat resmi yang kamu ketik sendiri.</p></section>
    </main>
  );
}
