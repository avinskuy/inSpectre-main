const LAYERS = [
  { number: "01", title: "Hotspot & karhutla", detail: "Titik panas satelit dan informasi kebakaran dari sumber resmi." },
  { number: "02", title: "Kualitas udara", detail: "Pengukuran kualitas udara dengan waktu observasi dan sumber yang jelas." },
  { number: "03", title: "Cuaca & kondisi", detail: "Informasi cuaca dan peringatan resmi setelah integrasi data tersedia." },
];

export default function WorldMonitor() {
  return (
    <main className="world-shell">
      <header className="world-heading">
        <a className="world-back" href="#/">← KEMBALI KE NEXUS</a>
        <p className="world-kicker"><span /> ENVIRONMENTAL INTELLIGENCE</p>
        <h1>World <span>Monitor</span></h1>
        <p className="world-intro">
          Pemantauan lingkungan Indonesia dalam satu ruang kerja.
          Sumber, waktu observasi, dan status data akan ditampilkan secara transparan.
        </p>
      </header>

      <section className="world-status-panel" aria-labelledby="world-status-title">
        <div className="world-panel-head">
          <div>
            <p className="world-label">DATA SOURCE STATUS</p>
            <h2 id="world-status-title">Pusat data lingkungan</h2>
          </div>
          <span className="world-status-badge">BELUM TERHUBUNG</span>
        </div>
        <div className="world-map-placeholder" role="img" aria-label="Area peta menunggu integrasi sumber data">
          <div className="world-map-grid" />
          <div className="world-map-cross">+</div>
          <div className="world-map-message">
            <span className="world-map-symbol">◎</span>
            <strong>Peta intelijen lingkungan</strong>
            <span>Menunggu integrasi sumber data terverifikasi</span>
          </div>
          <span className="world-map-coordinate">INDONESIA / DATA LAYER: OFFLINE</span>
        </div>
        <p className="world-disclaimer">
          Belum ada data real-time yang ditampilkan. Titik panas satelit bukan
          konfirmasi otomatis adanya kebakaran, dan estimasi satelit bukan pengganti
          pengukuran kualitas udara di permukaan.
        </p>
      </section>

      <section className="world-layers" aria-labelledby="world-layers-title">
        <p className="world-label">PLANNED DATA LAYERS</p>
        <h2 id="world-layers-title">Lapisan pemantauan</h2>
        <div className="world-layer-grid">
          {LAYERS.map((layer) => (
            <article className="world-layer-card" key={layer.number}>
              <span>{layer.number}</span>
              <h3>{layer.title}</h3>
              <p>{layer.detail}</p>
              <small>DALAM PENGEMBANGAN</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
