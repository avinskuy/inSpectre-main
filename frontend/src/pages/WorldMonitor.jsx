import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

const LAYERS = [
  { number: "01", title: "Hotspot & karhutla", detail: "Indikasi termal satelit NASA FIRMS." },
  { number: "02", title: "Kualitas udara", detail: "Integrasi data kualitas udara belum tersedia." },
  { number: "03", title: "Cuaca & kondisi", detail: "Integrasi cuaca dan peringatan resmi belum tersedia." },
];

function formatTime(value) {
  if (!value) return "Belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Waktu tidak valid";
  return `${date.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;
}

function FitIndonesia() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[-11.5, 94], [6.5, 141]], { padding: [12, 12] });
  }, [map]);
  return null;
}

function markerColor(confidence) {
  const value = String(confidence ?? "").toLowerCase();
  if (value === "h" || value === "high" || value === "nominal") return "#ff554d";
  if (value === "n" || value === "nom" || value === "medium") return "#ffb547";
  if (value === "l" || value === "low") return "#45d6e8";
  return "#d4e1eb";
}

export default function WorldMonitor() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const loadHotspots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/environment/hotspots", {
        headers: { Accept: "application/json" },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Data tidak tersedia");
      setResult(body);
    } catch {
      setResult((previous) => ({
        ...(previous || {}),
        status: "unavailable",
        error: "API hotspot belum dapat dihubungi. Coba muat ulang.",
      }));
    } finally {
      setLastChecked(new Date().toISOString());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotspots();
    const timer = setInterval(loadHotspots, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadHotspots]);

  const hotspots = Array.isArray(result?.data) ? result.data : [];
  const connected = result?.status === "ok";

  return (
    <main className="world-shell">
      <header className="world-heading">
        <a className="world-back" href="#/">← KEMBALI KE NEXUS</a>
        <p className="world-kicker"><span /> ENVIRONMENTAL INTELLIGENCE</p>
        <h1>World <span>Monitor</span></h1>
        <p className="world-intro">
          Pemantauan lingkungan Indonesia dengan sumber dan waktu data yang transparan.
        </p>
      </header>

      <section className="world-status-panel" aria-labelledby="world-status-title">
        <div className="world-panel-head">
          <div>
            <p className="world-label">DATA SOURCE STATUS</p>
            <h2 id="world-status-title">Hotspot & karhutla Indonesia</h2>
          </div>
          <span className="world-status-badge">
            {loading ? "MEMUAT" : connected ? "SUMBER TERHUBUNG" : "BELUM TERSEDIA"}
          </span>
        </div>

        <div className="world-map-frame">
          <div className="world-map-toolbar">
            <strong>PETA HOTSPOT INDONESIA</strong>
            <span>{hotspots.length.toLocaleString("id-ID")} titik diterima</span>
          </div>
          <MapContainer
            className="world-leaflet-map"
            center={[-2.5, 118]}
            zoom={4}
            minZoom={3}
            maxZoom={12}
            scrollWheelZoom
            style={{ height: "min(65vh, 620px)", minHeight: "360px", width: "100%" }}
          >
            <FitIndonesia />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hotspots.map((point, index) => {
              const lat = Number(point.latitude);
              const lng = Number(point.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              if (lat < -12 || lat > 7 || lng < 93 || lng > 142) return null;
              const color = markerColor(point.confidence);
              return (
                <CircleMarker
                  key={`${lat}-${lng}-${point.observedAt}-${index}`}
                  center={[lat, lng]}
                  radius={5}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1 }}
                >
                  <Popup>
                    <strong>Indikasi hotspot</strong>
                    <br />Lintang: {lat}
                    <br />Bujur: {lng}
                    <br />Observasi: {formatTime(point.observedAt)}
                    <br />Confidence: {point.confidence || "Tidak tersedia"}
                    <br />Satelit: {point.satellite || "Tidak tersedia"}
                    <br />Sumber: NASA FIRMS
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          <div className="world-map-legend">
            <strong>Legenda confidence</strong>
            <span><i style={{ background: "#ff554d" }} /> Tinggi / high</span>
            <span><i style={{ background: "#ffb547" }} /> Nominal / sedang</span>
            <span><i style={{ background: "#45d6e8" }} /> Rendah / low</span>
            <span><i style={{ background: "#d4e1eb" }} /> Lainnya</span>
          </div>
        </div>

        <div className="world-panel-head world-observation">
          <div>
            <p className="world-label">OBSERVATION STATUS</p>
            <p>Data diperbarui: {formatTime(result?.updatedAt)}</p>
            <p>Pemeriksaan terakhir: {formatTime(lastChecked)}</p>
            <p>Status: {loading ? "Sedang memuat data" : connected ? "API terhubung" : "Data tidak tersedia"}</p>
          </div>
          <button type="button" onClick={loadHotspots} disabled={loading}>
            {loading ? "Memuat..." : "Muat ulang"}
          </button>
        </div>

        {!loading && !connected && (
          <p role="status">{result?.error || "Data hotspot belum tersedia."}</p>
        )}
        {!loading && connected && hotspots.length === 0 && (
          <p role="status">Tidak ada titik dalam respons terbaru. Ini bukan jaminan tidak ada kebakaran.</p>
        )}
        <p className="world-disclaimer">
          Titik panas merupakan indikasi termal satelit, bukan konfirmasi otomatis adanya kebakaran.
          Peta memerlukan koneksi internet untuk memuat ubin OpenStreetMap.
        </p>
      </section>

      <section className="world-layers" aria-labelledby="world-layers-title">
        <p className="world-label">OBSERVED HOTSPOTS</p>
        <h2 id="world-layers-title">Koordinat titik panas</h2>
        {hotspots.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Lintang</th>
                  <th>Bujur</th>
                  <th>Observasi</th>
                  <th>Confidence</th>
                  <th>Satelit</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.slice(0, 100).map((point, index) => (
                  <tr key={`${point.latitude}-${point.longitude}-${point.observedAt}-${index}`}>
                    <td>{point.latitude}</td>
                    <td>{point.longitude}</td>
                    <td>{formatTime(point.observedAt)}</td>
                    <td>{point.confidence || "Tidak tersedia"}</td>
                    <td>{point.satellite || "Tidak tersedia"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hotspots.length > 100 && <p>Menampilkan 100 dari {hotspots.length} titik.</p>}
          </div>
        )}
      </section>

      <section className="world-layers" aria-label="Lapisan lingkungan lainnya">
        <p className="world-label">PLANNED DATA LAYERS</p>
        <h2>Lapisan pemantauan</h2>
        <div className="world-layer-grid">
          {LAYERS.map((layer) => (
            <article className="world-layer-card" key={layer.number}>
              <span>{layer.number}</span>
              <h3>{layer.title}</h3>
              <p>{layer.detail}</p>
              <small>{layer.number === "01" ? "INTEGRASI AWAL" : "DALAM PENGEMBANGAN"}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
