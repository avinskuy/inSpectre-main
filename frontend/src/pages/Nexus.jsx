const MODULES = [
  {
    id: "security",
    icon: "◈",
    status: "READY",
    title: "Security Center",
    description: "Analisis URL, deteksi indikator phishing, dan pahami risiko digital sebelum bertindak.",
    href: "#/security",
    action: "Buka Security Center",
    tone: "nexus-cyan",
  },
  {
    id: "world",
    icon: "◎",
    status: "FOUNDATION",
    title: "World Monitor",
    description: "Pusat pemantauan lingkungan Indonesia. Data hotspot, kualitas udara, dan cuaca akan diintegrasikan bertahap.",
    href: "#/world-monitor",
    action: "Jelajahi World Monitor",
    tone: "nexus-amber",
  },
];

export default function Nexus() {
  return (
    <main className="nexus-shell">
      <section className="nexus-hero">
        <div className="nexus-kicker"><span /> INSPECTRE NEXUS / PLATFORM GATEWAY</div>
        <p className="nexus-overline">ONE PLATFORM. MULTIPLE REALITIES.</p>
        <h1>See the signals.<br /><span>Understand the world.</span></h1>
        <p className="nexus-intro">
          Satu platform untuk memahami ancaman digital dan memantau sinyal
          lingkungan yang memengaruhi dunia nyata.
        </p>
        <div className="nexus-meta">
          <span><i /> MODULAR INTELLIGENCE</span>
          <span>INDONESIA · GLOBAL OUTLOOK</span>
        </div>
      </section>

      <section className="nexus-modules" aria-labelledby="modules-title">
        <div className="nexus-section-head">
          <div>
            <p className="nexus-label">PILIH RUANG KERJA</p>
            <h2 id="modules-title">Intelligence modules</h2>
          </div>
          <span className="nexus-module-count">02 MODULES</span>
        </div>

        <div className="nexus-card-grid">
          {MODULES.map((module, index) => (
            <article className={`nexus-card ${module.tone}`} key={module.id}>
              <div className="nexus-card-top">
                <span className="nexus-module-icon" aria-hidden="true">{module.icon}</span>
                <span className="nexus-module-status">{module.status}</span>
              </div>
              <p className="nexus-card-index">MODULE / 0{index + 1}</p>
              <h3>{module.title}</h3>
              <p className="nexus-card-description">{module.description}</p>
              <a className="nexus-card-link" href={module.href}>
                {module.action} <span aria-hidden="true">↗</span>
              </a>
              <div className="nexus-card-decoration" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="nexus-integrity">
        <span aria-hidden="true">ⓘ</span>
        <p><strong>Data integrity matters.</strong> Informasi yang belum terhubung ke sumber data langsung tidak akan ditampilkan sebagai kondisi terkini.</p>
      </section>
    </main>
  );
}
