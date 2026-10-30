import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import Button from '../components/Button.jsx';
import { getHistory, getStats } from '../lib/api.js';
import { useLiveFeed } from '../lib/socket.js';

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);
const levelMap = { AMAN: 'aman', BELUM_DIKETAHUI: 'belum-diketahui', WASPADA: 'curiga', CURIGA: 'curiga', PHISHING: 'berbahaya', BAHAYA: 'berbahaya' };
const typeLabel = { link: 'Tautan', scam_number: 'Nomor', scam_report: 'Laporan', apk: 'APK' };
const time = (value) => {
  try {
    return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, bahaya: 0, aman: 0, reports: 0 });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const { events, stats: liveStats, connected } = useLiveFeed(8);

  const refresh = async () => {
    setError('');
    try {
      const [s, h] = await Promise.all([getStats(), getHistory()]);
      setStats(s);
      setHistory(Array.isArray(h) ? h : []);
    } catch (e) {
      setError(e.message || 'Data dashboard tidak dapat dimuat.');
    }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (liveStats) setStats(liveStats); }, [liveStats]);

  const suspicious = history.filter((x) => ['PHISHING', 'BAHAYA', 'CURIGA', 'WASPADA'].includes(x.riskLevel)).length;
  const hasScans = Number(stats.total) > 0;
  const safePct = hasScans ? Math.round((Number(stats.aman || 0) / Number(stats.total)) * 100) : 0;

  return (
    <main className="page-shell dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">PUSAT PEMANTAUAN</p>
          <h1>Dashboard <span>inSpectre</span></h1>
          <p>Pantau aktivitas pemeriksaan dan sinyal risiko secara real-time.</p>
        </div>
        <div className="dashboard-actions">
          <span className={`connection-pill ${connected ? 'is-online' : ''}`}><i />{connected ? 'Socket aktif' : 'Socket offline'}</span>
          <Button variant="outline" onClick={refresh}>↻ Segarkan</Button>
        </div>
      </section>

      {error && <p className="inline-alert" role="alert">{error}</p>}

      <section className="stats-grid dashboard-stats" aria-label="Statistik ringkas">
        <div className="stat-wrap stat-tone-0"><StatCard icon="scan" label="Total pemeriksaan" value={fmt(stats.total)} /></div>
        <div className="stat-wrap stat-tone-1"><StatCard icon="alert" label="Indikasi berbahaya" value={fmt(stats.bahaya)} /></div>
        <div className="stat-wrap stat-tone-2"><StatCard icon="check" label="Dinilai relatif aman" value={fmt(stats.aman)} /></div>
        <div className="stat-wrap stat-tone-3"><StatCard icon="report" label="Laporan komunitas" value={fmt(stats.reports)} /></div>
      </section>

      <section className="dashboard-grid">
        <article className="surface-card chart-card">
          <div className="panel-heading">
            <div><p className="eyebrow">7 PEMERIKSAAN TERAKHIR</p><h2>Distribusi skor risiko</h2></div>
            <span className="mini-label">Skor 0–100</span>
          </div>
          {history.length ? (
            <div className="bar-chart" role="img" aria-label="Diagram batang skor risiko untuk pemeriksaan terbaru">
              {history.slice(0, 7).reverse().map((item, i) => {
                const score = Math.max(0, Math.min(100, Number(item.threatScore) || 0));
                return (
                  <div className="bar-item" key={`${item.scannedAt}-${i}`}>
                    <div className="bar-track"><div className={`bar-fill ${score >= 60 ? 'bar-danger' : score >= 35 ? 'bar-warn' : 'bar-safe'}`} style={{ height: `${Math.max(score, 3)}%` }} title={`Skor ${score}`} /></div>
                    <span>{score}</span><small>{time(item.scannedAt).split(',')[0]}</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-chart">
              <span>⌁</span>
              <b>Belum ada data pemeriksaan</b>
              <p>Hasil analisis akan divisualisasikan di sini setelah pemeriksaan pertama.</p>
              <a href="#/analisis">Mulai analisis →</a>
            </div>
          )}
          <div className="chart-legend">
            <span><i className="legend-safe" /> 0–34 rendah</span>
            <span><i className="legend-warn" /> 35–59 sedang</span>
            <span><i className="legend-danger" /> 60–100 tinggi</span>
          </div>
        </article>

        <article className="surface-card health-card">
          <div className="panel-heading">
            <div><p className="eyebrow">RINGKASAN</p><h2>Gambaran aktivitas</h2></div>
            <span className="health-symbol">◉</span>
          </div>
          {hasScans ? (
            <>
              <div className="progress-ring-wrap">
                <div className="progress-ring" style={{ '--progress': `${safePct}%` }}>
                  <div><b>{safePct}%</b><small>relatif aman</small></div>
                </div>
              </div>
              <p className="health-description">Proporsi hasil berlabel AMAN dari total pemeriksaan yang tercatat. Ini bukan ukuran pasti keamanan internet.</p>
              <div className="mini-metrics">
                <div><span>Aktivitas tersimpan</span><b>{fmt(history.length)}</b></div>
                <div><span>Perlu ditinjau*</span><b>{fmt(suspicious)}</b></div>
              </div>
              <small className="fine-print">*Dihitung dari riwayat yang dimuat pada halaman ini.</small>
            </>
          ) : (
            <div className="empty-feed">
              <span className="empty-symbol">◉</span>
              <div><b>Belum ada pemeriksaan</b><p>Ringkasan risiko akan tersedia setelah data analisis tercatat.</p></div>
            </div>
          )}
        </article>
      </section>

      <section className="surface-card recent-card">
        <div className="panel-heading">
          <div><p className="eyebrow">MONITORING</p><h2>Aktivitas terbaru</h2><p>Event yang masuk lewat koneksi real-time.</p></div>
          <a className="text-link" href="#/history">Lihat riwayat lengkap →</a>
        </div>
        {events.length ? (
          <div className="table-wrap">
            <table className="activity-table">
              <thead><tr><th>Aktivitas</th><th>Jenis</th><th>Waktu</th><th>Status</th></tr></thead>
              <tbody>
                {events.map((event, i) => (
                  <tr key={`${event.scannedAt}-${i}`}>
                    <td className="table-identifier">{event.url || event.number || event.fileName || 'Data disamarkan'}</td>
                    <td>{typeLabel[event.type] || event.type || '—'}</td>
                    <td>{time(event.scannedAt)}</td>
                    <td>{levelMap[event.riskLevel] ? <RiskBadge level={levelMap[event.riskLevel]} /> : event.riskLevel || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-feed">
            <span className="empty-symbol">⌁</span>
            <div><b>Menunggu aktivitas</b><p>Aktivitas baru akan muncul saat pemeriksaan dijalankan.</p></div>
          </div>
        )}
      </section>
    </main>
  );
}
