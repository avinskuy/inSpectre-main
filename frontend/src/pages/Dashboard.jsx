import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import Button from '../components/Button.jsx';
import { getStats } from '../lib/api.js';
import { useLiveFeed } from '../lib/socket.js';

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, bahaya: 0, curiga: 0, aman: 0, reports: 0 });
  const [error, setError] = useState('');
  const { stats: liveStats, connected } = useLiveFeed(1);

  const refresh = async () => {
    setError('');
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) {
      setError(e.message || 'Data dashboard tidak dapat dimuat.');
    }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (liveStats) setStats(liveStats); }, [liveStats]);

  const total = Number(stats.total) || 0;
  const hasScans = total > 0;
  const safePct = hasScans ? Math.round((Number(stats.aman || 0) / total) * 100) : 0;
  const categories = [
    { label: 'Relatif aman', value: Number(stats.aman) || 0, color: 'bg-emerald-400' },
    { label: 'Perlu diwaspadai', value: Number(stats.curiga) || 0, color: 'bg-amber-400' },
    { label: 'Indikasi berbahaya', value: Number(stats.bahaya) || 0, color: 'bg-rose-400' },
  ];

  return (
    <main className="page-shell dashboard-shell">
      <section className="page-intro">
        <div>
          <p className="eyebrow">PUSAT PEMANTAUAN PUBLIK</p>
          <h1>Dashboard <span>inSpectre</span></h1>
          <p>Statistik agregat dan kondisi pemantauan inSpectre. Detail riwayat pemeriksaan bersifat pribadi.</p>
        </div>
        <div className="dashboard-actions">
          <span className={`connection-pill ${connected ? 'is-online' : ''}`}><i />{connected ? 'Socket aktif' : 'Socket offline'}</span>
          <Button variant="outline" onClick={refresh}>↻ Segarkan</Button>
        </div>
      </section>

      {error && <p className="inline-alert" role="alert">{error}</p>}

      <section className="stats-grid dashboard-stats" aria-label="Statistik agregat">
        <div className="stat-wrap stat-tone-0"><StatCard icon="scan" label="Total pemeriksaan" value={fmt(stats.total)} /></div>
        <div className="stat-wrap stat-tone-1"><StatCard icon="alert" label="Indikasi berbahaya" value={fmt(stats.bahaya)} /></div>
        <div className="stat-wrap stat-tone-2"><StatCard icon="check" label="Dinilai relatif aman" value={fmt(stats.aman)} /></div>
        <div className="stat-wrap stat-tone-3"><StatCard icon="report" label="Laporan komunitas" value={fmt(stats.reports)} /></div>
      </section>

      <section className="dashboard-grid">
        <article className="surface-card chart-card">
          <div className="panel-heading">
            <div><p className="eyebrow">RINGKASAN GLOBAL</p><h2>Distribusi hasil pemeriksaan</h2></div>
            <span className="mini-label">{fmt(total)} total</span>
          </div>
          {hasScans ? (
            <div className="mt-7 space-y-6">
              {categories.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <b className="tabular-nums text-slate-100">{fmt(item.value)}</b>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, item.value / total * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-chart">
              <span>⌁</span>
              <b>Belum ada data pemeriksaan</b>
              <p>Statistik akan muncul setelah pemeriksaan pertama tercatat.</p>
            </div>
          )}
          <p className="mt-6 text-xs leading-5 text-cyber-muted">Angka ini merupakan agregat seluruh aktivitas, bukan daftar pengguna atau detail pemeriksaan individual.</p>
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
                <div><span>Total pemeriksaan</span><b>{fmt(total)}</b></div>
                <div><span>Laporan komunitas</span><b>{fmt(stats.reports)}</b></div>
              </div>
            </>
          ) : (
            <div className="empty-feed">
              <span className="empty-symbol">◉</span>
              <div><b>Menunggu data pemeriksaan</b><p>Ringkasan risiko akan tersedia setelah aktivitas pertama tercatat.</p></div>
            </div>
          )}
        </article>
      </section>

      <section className="surface-card recent-card">
        <div className="panel-heading">
          <div><p className="eyebrow">PRIVASI AKUN</p><h2>Riwayat pemeriksaan pribadi</h2><p>Detail hasil scan hanya dapat dibuka oleh pemilik akun yang sudah masuk.</p></div>
          <a className="text-link" href="#/login">Masuk / Daftar →</a>
        </div>
        <div className="empty-feed">
          <span className="empty-symbol">⌑</span>
          <div><b>Dashboard tetap terbuka untuk publik</b><p>Pengunjung dapat melihat statistik agregat, sedangkan daftar pemeriksaan dan ekspor riwayat memerlukan akun.</p></div>
        </div>
      </section>
    </main>
  );
}
