const DOMAINS = [
  {
    number: "01",
    title: "Environmental Intelligence",
    detail: "Hotspot, kualitas udara, cuaca, gempa, dan peringatan BMKG.",
    href: "#/environmental",
    accent: "environment",
  },
  {
    number: "02",
    title: "Security Intelligence",
    detail: "Pemeriksaan indikator keamanan digital.",
    href: "#/fitur/security",
    accent: "security",
  },
  {
    number: "03",
    title: "Threat Intelligence",
    detail: "Berita dan perkembangan ancaman digital.",
    href: "#/fitur/berita",
    accent: "threat",
  },
];

export default function WorldMonitor() {
  return (
    <main className="world-hub">
      <a className="world-hub-back" href="#/">← Kembali ke Nexus</a>
      <header className="world-hub-hero">
        <p className="world-hub-eyebrow">INSPECTRE NEXUS / MONITOR</p>
        <h1>World <span>Monitor</span></h1>
        <p>Pilih domain intelijen untuk membuka ruang kerja yang sesuai.</p>
      </header>
      <section className="world-hub-grid" aria-label="Domain intelijen">
        {DOMAINS.map((domain) => (
          <a
            className={`world-hub-card world-hub-${domain.accent}`}
            href={domain.href}
            key={domain.number}
          >
            <span className="world-hub-number">{domain.number}</span>
            <h2>{domain.title}</h2>
            <p>{domain.detail}</p>
            <span className="world-hub-open">Buka domain ↗</span>
          </a>
        ))}
      </section>
    </main>
  );
}
