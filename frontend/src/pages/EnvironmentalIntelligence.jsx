const FEATURES = [
  {
    number: "01",
    title: "Hotspot & karhutla",
    detail: "Pantau indikasi termal dari NASA FIRMS.",
    href: "#/environment/hotspots",
    accent: "hotspot",
  },
  {
    number: "02",
    title: "Kualitas udara",
    detail: "Pantau PM2.5, stasiun, dan waktu observasi.",
    href: "#/environment/air-quality",
    accent: "air",
  },
  {
    number: "03",
    title: "Cuaca",
    detail: "Lihat prakiraan cuaca berdasarkan wilayah.",
    href: "#/environment/weather",
    accent: "weather",
  },
  {
    number: "04",
    title: "Peringatan BMKG",
    detail: "Periksa feed peringatan resmi BMKG.",
    href: "#/environment/warnings",
    accent: "warning",
  },
  {
    number: "05",
    title: "Gempa bumi",
    detail: "Lihat informasi gempa bumi Indonesia.",
    href: "#/environment/earthquakes",
    accent: "earthquake",
  },
];

export default function EnvironmentalIntelligence() {
  return (
    <main className="environment-hub">
      <a className="environment-back" href="#/world-monitor">
        ← Kembali ke World Monitor
      </a>

      <header className="environment-hero">
        <p className="environment-eyebrow">INSPECTRE / WORLD MONITOR</p>
        <h1>Environmental <span>Intelligence</span></h1>
        <p>
          Pilih ruang kerja untuk memantau kondisi lingkungan dan kejadian
          di Indonesia.
        </p>
      </header>

      <section className="environment-grid" aria-label="Ruang kerja lingkungan">
        {FEATURES.map((feature) => (
          <a
            className={`environment-card environment-${feature.accent}`}
            href={feature.href}
            key={feature.number}
          >
            <span className="environment-number">{feature.number}</span>
            <h2>{feature.title}</h2>
            <p>{feature.detail}</p>
            <span className="environment-open">Buka ruang kerja ↗</span>
          </a>
        ))}
      </section>
    </main>
  );
}
