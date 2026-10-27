import { useCallback, useEffect, useState } from "react";

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
    status: "LIVE DATA",
    title: "World Monitor",
    description: "Pantau hotspot, kualitas udara, gempa, dan peringatan cuaca dari sumber data yang terhubung.",
    href: "#/world-monitor",
    action: "Jelajahi World Monitor",
    tone: "nexus-amber",
  },
];

const SOURCES = [
  { id: "hotspots", label: "Hotspot", source: "NASA FIRMS", url: "/api/environment/hotspots" },
  { id: "air", label: "Kualitas udara", source: "OpenAQ", url: "/api/environment/air-quality" },
  { id: "disasters", label: "Gempa bumi", source: "BMKG", url: "/api/environment/disasters" },
  { id: "warnings", label: "Peringatan cuaca", source: "BMKG", url: "/api/environment/weather-warnings" },
];

function sourceStatus(result) {
  if (!result) return { label: "Memuat", tone: "loading" };
  if (result.status === "unavailable") return { label: "Tidak tersedia", tone: "unavailable" };
  if (result.status === "stale" || result.status === "partial") {
    return { label: "Data terbatas/lama", tone: "stale" };
  }
  return { label: "Terhubung", tone: "ok" };
}

function formatTime(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Waktu belum tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value)) + " WIB";
}

function metricValue(result, id) {
  if (!result) return "—";
  if (result.status === "unavailable") return "N/A";

  if (id === "hotspots") {
    return Array.isArray(result.data) ? result.data.length.toLocaleString("id-ID") : "—";
  }
  if (id === "air") {
    const data = Array.isArray(result.data) ? result.data : [];
    const fresh = data.filter((station) => station.status === "ok").length;
    const stale = data.filter((station) => station.status === "stale").length;
    return `${fresh} segar${stale ? ` · ${stale} lama` : ""}`;
  }
  if (id === "disasters") {
    return result.latest?.magnitude
      ? `M ${result.latest.magnitude}`
      : result.latest?.mag
        ? `M ${result.latest.mag}`
        : result.latest
          ? "Tersedia"
          : "Belum ada data";
  }
  if (id === "warnings") {
    return Array.isArray(result.warnings) ? result.warnings.length.toLocaleString("id-ID") : "—";
  }
  return "—";
}

function metricDetail(result, id) {
  if (!result) return "Menunggu respons sumber data";
  if (result.status === "unavailable") return result.error || "Sumber belum dapat diakses";

  if (id === "hotspots") return `Titik termal dalam respons · ${formatTime(result.updatedAt)}`;
  if (id === "air") {
    const data = Array.isArray(result.data) ? result.data : [];
    const newest = data.find((station) => station.observedAt)?.observedAt;
    return `${data.length} stasiun dengan pembacaan · observasi terbaru: ${formatTime(newest)}`;
  }
  if (id === "disasters") {
    const latest = result.latest;
    const place = latest?.place || latest?. wilayah || latest?.lokasi || latest?.location;
    return place || `Gempa signifikan: ${(result.significant || []).length} · dirasakan: ${(result.felt || []).length}`;
  }
  if (id === "warnings") return `Peringatan dalam feed BMKG · ${formatTime(result.fetchedAt)}`;
  return "Informasi sumber";
}

export default function Nexus() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshError, setRefreshError] = useState(false);

  const refresh = useCallback(async () => {
    const responses = await Promise.all(
      SOURCES.map(async (source) => {
        try {
          const response = await fetch(source.url, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          const body = await response.json();
          if (!response.ok && body.status !== "unavailable") {
            return [source.id, { ...body, status: "unavailable" }];
          }
          return [source.id, body];
        } catch {
          return [source.id, { status: "unavailable", error: "Gagal menghubungi sumber data." }];
        }
      })
    );

    setData(Object.fromEntries(responses));
    setLastRefresh(new Date().toISOString());
    setRefreshError(responses.every(([, result]) => result.status === "unavailable"));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const availableCount = SOURCES.filter(
    (source) => data[source.id] && data[source.id].status !== "unavailable"
  ).length;

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

      <section className="nexus-brief" aria-labelledby="situation-title">
        <div className="nexus-section-head">
          <div>
            <p className="nexus-label">SITUATIONAL AWARENESS / INDONESIA</p>
            <h2 id="situation-title">Situation Brief</h2>
          </div>
          <button className="nexus-refresh" type="button" onClick={refresh} disabled={loading}>
            {loading ? "MEMUAT..." : "↻ REFRESH"}
          </button>
        </div>

        <div className="nexus-brief-meta">
          <span className={`nexus-live-dot ${availableCount ? "is-live" : ""}`} />
          {loading
            ? "Menghubungkan sumber data..."
            : `${availableCount} dari ${SOURCES.length} sumber terhubung`}
          <span className="nexus-brief-updated">
            {lastRefresh ? `Pemeriksaan: ${formatTime(lastRefresh)}` : "Belum diperbarui"}
          </span>
        </div>

        <div className="nexus-situation-grid">
          {SOURCES.map((source) => {
            const result = data[source.id];
            const status = sourceStatus(result);
            return (
              <article className="nexus-situation-card" key={source.id}>
                <div className="nexus-situation-top">
                  <span>{source.label}</span>
                  <span className={`nexus-source-status is-${status.tone}`}>{status.label}</span>
                </div>
                <p className="nexus-situation-value">
                  {loading && !result ? "…" : metricValue(result, source.id)}
                </p>
                <p className="nexus-situation-detail">{metricDetail(result, source.id)}</p>
                <span className="nexus-situation-source">SOURCE / {source.source}</span>
              </article>
            );
          })}
        </div>

        {refreshError && (
          <p className="nexus-brief-note">
            Semua sumber belum dapat diakses. Coba refresh lagi nanti; data tidak dianggap sebagai kondisi terkini.
          </p>
        )}
        <p className="nexus-brief-disclaimer">
          Angka mengikuti respons sumber masing-masing dan bukan skor risiko gabungan.
          Waktu pemeriksaan tidak selalu sama dengan waktu observasi data.
        </p>
        <a className="nexus-card-link nexus-brief-link" href="#/world-monitor">
          Buka pemantauan lengkap <span aria-hidden="true">↗</span>
        </a>
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
        <p><strong>Data integrity matters.</strong> Status sumber dan waktu observasi dibedakan agar data lama atau tidak tersedia tidak disalahartikan sebagai kondisi terkini.</p>
      </section>
    </main>
  );
}
