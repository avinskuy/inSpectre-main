import { useEffect, useState } from 'react';
import Card from '../components/Card.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import Button from '../components/Button.jsx';
import { getHistory } from '../lib/api.js';

const RISK_MAP = {
  AMAN: 'aman',
  BELUM_DIKETAHUI: 'belum-diketahui',
  CURIGA: 'curiga',
  WASPADA: 'curiga',
  BAHAYA: 'berbahaya',
  PHISHING: 'berbahaya',
};
const RISK_LABEL = {
  AMAN: 'AMAN',
  BELUM_DIKETAHUI: 'BELUM DIKETAHUI',
  CURIGA: 'CURIGA',
  WASPADA: 'WASPADA',
  BAHAYA: 'BAHAYA',
  PHISHING: 'PHISHING',
};
const TYPE_ICON = { link: '🔗', scam_number: '📱', apk: '📦' };

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('SEMUA');
  const [typeFilter, setTypeFilter] = useState('SEMUA');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getHistory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat riwayat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredItems = items.filter((item) => {
    const text = `${item.identifier || ''} ${item.type || ''}`.toLowerCase();
    const matchesQuery = text.includes(query.trim().toLowerCase());
    const matchesRisk = riskFilter === 'SEMUA' || item.riskLevel === riskFilter;
    const matchesType = typeFilter === 'SEMUA' || item.type === typeFilter;
    return matchesQuery && matchesRisk && matchesType;
  });

  const exportCsv = () => {
    const rows = [
      ['Waktu', 'Jenis', 'Identitas', 'Skor risiko', 'Status'],
      ...filteredItems.map((item) => [item.scannedAt || '', item.type || '', item.identifier || '', item.threatScore ?? '', item.riskLevel || '']),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inspectre-riwayat-scan.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page-shell history-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">JEJAK PEMERIKSAAN</p>
          <h1 className="text-3xl font-bold">Riwayat <span style={{ color: 'var(--accent)' }}>Scan</span></h1>
          <p className="mt-2 text-cyber-muted">Daftar situs dan nomor yang telah diperiksa, terbaru di atas.</p>
        </div>
        <div className="history-actions">
          {items.length > 0 && <Button variant="outline" onClick={exportCsv} disabled={!filteredItems.length}>↓ Ekspor CSV</Button>}
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Memuat…' : '↻ Segarkan'}</Button>
        </div>
      </div>

      {error && <p role="alert" className="inline-alert mt-4">{error}</p>}

      {items.length > 0 && (
        <>
          <section className="history-filter surface-card" aria-label="Cari dan filter riwayat">
            <label className="filter-search">
              <span>Cari riwayat</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari domain atau jenis aktivitas…" />
            </label>
            <label>
              <span>Status risiko</span>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                <option value="SEMUA">Semua status</option>
                <option value="BELUM_DIKETAHUI">Belum diketahui</option>
                <option value="AMAN">Aman</option>
                <option value="WASPADA">Waspada</option>
                <option value="CURIGA">Curiga</option>
                <option value="PHISHING">Phishing</option>
                <option value="BAHAYA">Bahaya</option>
              </select>
            </label>
            <label>
              <span>Jenis</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="SEMUA">Semua jenis</option>
                <option value="link">Tautan</option>
                <option value="scam_number">Nomor scam</option>
                <option value="apk">APK</option>
              </select>
            </label>
          </section>
          <div className="history-result-count">Menampilkan <b>{filteredItems.length}</b> dari <b>{items.length}</b> catatan</div>
        </>
      )}

      <div className="mt-6 space-y-2">
        {loading && items.length === 0 && (
          <Card><p className="text-sm text-cyber-muted">Memuat riwayat…</p></Card>
        )}

        {!loading && items.length === 0 && !error && (
          <Card className="history-empty-card">
            <div className="empty-feed">
              <span className="empty-symbol">⌁</span>
              <div>
                <b>Belum ada riwayat pemeriksaan</b>
                <p>Hasil analisis yang tersimpan akan muncul di sini. Mulai pemeriksaan pertama untuk membangun riwayat keamananmu.</p>
                <a className="text-link" href="#/analisis">Mulai analisis →</a>
              </div>
            </div>
          </Card>
        )}

        {filteredItems.map((item, i) => (
          <Card key={`${item.scannedAt}-${i}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{TYPE_ICON[item.type] || '🔍'} {item.identifier}</p>
                <p className="mt-1 text-xs text-cyber-muted">{formatTime(item.scannedAt)} · skor bahaya {item.threatScore}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <RiskBadge level={RISK_MAP[item.riskLevel] || 'belum-diketahui'} />
                <span className="text-[10px] text-cyber-muted">{RISK_LABEL[item.riskLevel] || item.riskLevel}</span>
              </div>
            </div>
          </Card>
        ))}

        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <Card>
            <div className="empty-feed">
              <span className="empty-symbol">⌕</span>
              <div><b>Tidak ada catatan yang cocok</b><p>Coba ubah kata kunci atau filter status.</p></div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
