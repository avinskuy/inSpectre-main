import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

const LAYERS = [
  { number: "01", title: "Hotspot & karhutla", detail: "Indikasi termal satelit NASA FIRMS." },
  { number: "02", title: "Kualitas udara", detail: "Pemantauan PM2.5 dari stasiun OpenAQ dengan waktu observasi dan penanda data lama." },
  { number: "03", title: "Cuaca & peringatan", detail: "Prakiraan wilayah dan feed peringatan resmi BMKG." },
  { number: "04", title: "Traffic Monitor", detail: "Pemantauan kondisi lalu lintas masih dalam pengembangan." },
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
  const [airResult, setAirResult] = useState(null);
  const [airLoading, setAirLoading] = useState(true);
  const [hotspotsOpen, setHotspotsOpen] = useState(false);
  const [airLastChecked, setAirLastChecked] = useState(null);

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

  const loadAirQuality = useCallback(async () => {
    setAirLoading(true);
    try {
      const response = await fetch("/api/environment/air-quality", {
        headers: { Accept: "application/json" },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Data tidak tersedia");
      setAirResult(body);
    } catch {
      setAirResult({
        data: [],
        status: "unavailable",
        source: "OpenAQ v3",
        error: "Data kualitas udara belum dapat dimuat.",
      });
    } finally {
      setAirLastChecked(new Date().toISOString());
      setAirLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAirQuality();
    const timer = setInterval(loadAirQuality, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadAirQuality]);


  const [weatherRegions, setWeatherRegions] = useState({
    provinces: [], kabupaten: [], kecamatan: [], desa: [],
  });
  const [provinceCode, setProvinceCode] = useState("");
  const [kabupatenCode, setKabupatenCode] = useState("");
  const [kecamatanCode, setKecamatanCode] = useState("");
  const [desaCode, setDesaCode] = useState("");
  const [regionError, setRegionError] = useState("");
  const [weatherResult, setWeatherResult] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [warningsResult, setWarningsResult] = useState(null);
  const [warningsLoading, setWarningsLoading] = useState(true);
  const [warningsError, setWarningsError] = useState("");

  const fetchRegions = useCallback(async (parent = "") => {
    const query = parent ? `?parent=${encodeURIComponent(parent)}` : "";
    const response = await fetch(`/api/environment/regions${query}`, {
      headers: { Accept: "application/json" },
    });
    const body = await response.json();
    if (!response.ok || body.status !== "ok" || !Array.isArray(body.data)) {
      throw new Error(body.error || "Daftar wilayah tidak tersedia.");
    }
    return body.data;
  }, []);

  useEffect(() => {
    let active = true;
    fetchRegions()
      .then((data) => {
        if (active) {
          setWeatherRegions((previous) => ({ ...previous, provinces: data }));
          setRegionError("");
        }
      })
      .catch((error) => {
        if (active) setRegionError(error.message || "Daftar provinsi gagal dimuat.");
      });
    return () => { active = false; };
  }, [fetchRegions]);

  useEffect(() => {
    if (!provinceCode) {
      setWeatherRegions((previous) => ({ ...previous, kabupaten: [] }));
      return undefined;
    }
    let active = true;
    fetchRegions(provinceCode)
      .then((data) => {
        if (active) {
          setWeatherRegions((previous) => ({ ...previous, kabupaten: data }));
          setRegionError("");
        }
      })
      .catch((error) => {
        if (active) setRegionError(error.message || "Daftar kabupaten/kota gagal dimuat.");
      });
    return () => { active = false; };
  }, [provinceCode, fetchRegions]);

  useEffect(() => {
    if (!kabupatenCode) {
      setWeatherRegions((previous) => ({ ...previous, kecamatan: [] }));
      return undefined;
    }
    let active = true;
    fetchRegions(kabupatenCode)
      .then((data) => {
        if (active) {
          setWeatherRegions((previous) => ({ ...previous, kecamatan: data }));
          setRegionError("");
        }
      })
      .catch((error) => {
        if (active) setRegionError(error.message || "Daftar kecamatan gagal dimuat.");
      });
    return () => { active = false; };
  }, [kabupatenCode, fetchRegions]);

  useEffect(() => {
    if (!kecamatanCode) {
      setWeatherRegions((previous) => ({ ...previous, desa: [] }));
      return undefined;
    }
    let active = true;
    fetchRegions(kecamatanCode)
      .then((data) => {
        if (active) {
          setWeatherRegions((previous) => ({ ...previous, desa: data }));
          setRegionError("");
        }
      })
      .catch((error) => {
        if (active) setRegionError(error.message || "Daftar desa/kelurahan gagal dimuat.");
      });
    return () => { active = false; };
  }, [kecamatanCode, fetchRegions]);

  const weatherRequestId = useRef(0);

  const loadWeather = useCallback(async () => {
    const requestId = ++weatherRequestId.current;

    if (!desaCode) {
      setWeatherResult(null);
      setWeatherError("");
      setWeatherLoading(false);
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");

    try {
      const response = await fetch(
        `/api/environment/weather?adm4=${encodeURIComponent(desaCode)}`,
        { headers: { Accept: "application/json" } }
      );
      const body = await response.json();

      if (!response.ok || body.status !== "ok") {
        throw new Error(body.error || "Prakiraan cuaca belum tersedia.");
      }

      if (requestId === weatherRequestId.current) {
        setWeatherResult(body);
      }
    } catch (error) {
      if (requestId === weatherRequestId.current) {
        setWeatherResult(null);
        setWeatherError(error.message || "Prakiraan cuaca gagal dimuat.");
      }
    } finally {
      if (requestId === weatherRequestId.current) {
        setWeatherLoading(false);
      }
    }
  }, [desaCode]);

  useEffect(() => {
    loadWeather();

    return () => {
      weatherRequestId.current += 1;
    };
  }, [loadWeather]);

  const loadWarnings = useCallback(async () => {
    setWarningsLoading(true);
    try {
      const response = await fetch("/api/environment/weather-warnings", {
        headers: { Accept: "application/json" },
      });
      const body = await response.json();
      if (!response.ok || body.status !== "ok" || !Array.isArray(body.warnings)) {
        throw new Error(body.error || "Feed peringatan BMKG tidak tersedia.");
      }
      setWarningsResult(body);
      setWarningsError("");
    } catch (error) {
      setWarningsResult(null);
      setWarningsError(error.message || "Feed peringatan BMKG gagal dimuat.");
    } finally {
      setWarningsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarnings();
    const timer = setInterval(loadWarnings, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadWarnings]);

  const weatherForecast = Array.isArray(weatherResult?.forecast)
    ? weatherResult.forecast : [];
  const weatherWarnings = Array.isArray(warningsResult?.warnings)
    ? warningsResult.warnings : [];

  const airStations = Array.isArray(airResult?.data) ? airResult.data : [];
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
        <button
          type="button"
          aria-expanded={hotspotsOpen}
          aria-controls="world-hotspots-table"
          onClick={() => setHotspotsOpen(open => !open)}
        >
          {hotspotsOpen ? "Tutup koordinat −" : "Buka koordinat +"}
        </button>
        {hotspotsOpen && hotspots.length > 0 && (
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

      <section className="world-air-panel" aria-labelledby="world-air-title">
        <div className="world-panel-head">
          <div>
            <p className="world-label">AIR QUALITY & SMOKE</p>
            <h2 id="world-air-title">Pemantauan PM2.5 Indonesia</h2>
            <p className="world-air-description">
              Konsentrasi partikel halus dari stasiun OpenAQ. Data stasiun dapat memiliki waktu observasi berbeda.
            </p>
          </div>
          <button type="button" onClick={loadAirQuality} disabled={airLoading}>
            {airLoading ? "Memuat..." : "Muat ulang udara"}
          </button>
        </div>

        <div className="world-air-meta">
          <span>Status sumber: {
            airLoading ? "Memuat" :
            airResult?.status === "ok" ? "Ada data terbaru" :
            airResult?.status === "stale" ? "Data kedaluwarsa" :
            "Belum tersedia"
          }</span>
          <span>Pemeriksaan terakhir: {formatTime(airLastChecked)}</span>
          <span>Sumber: OpenAQ v3</span>
        </div>

        {!airLoading && airStations.length === 0 && (
          <p role="status">{airResult?.error || "Belum ada observasi PM2.5 yang tersedia."}</p>
        )}

        {airStations.length > 0 && (
          <div className="world-air-grid">
            {airStations.slice(0, 12).map((station) => (
              <article className="world-air-card" key={`${station.id}-${station.sensorId}`}>
                <div className="world-air-card-head">
                  <h3>{station.name}</h3>
                  <span className={station.status === "ok" ? "world-air-status is-fresh" : "world-air-status is-stale"}>
                    {station.status === "ok" ? "DATA TERBARU" : "DATA LAMA"}
                  </span>
                </div>
                <p className="world-air-value">
                  {Number(station.value).toLocaleString("id-ID", {
                    maximumFractionDigits: 2,
                  })}
                  <span> µg/m³ PM2.5</span>
                </p>
                <p className="world-air-observed">
                  Observasi: {formatTime(station.observedAt)}
                </p>
                {station.qualityFlag === "zero_value_check" && (
                  <p className="world-air-warning">
                    Nilai nol perlu diverifikasi; jangan langsung dianggap udara bersih.
                  </p>
                )}
                <p className="world-air-coords">
                  {station.latitude}, {station.longitude}
                </p>
              </article>
            ))}
          </div>
        )}

        <p className="world-disclaimer">
          Status terbaru berarti observasi berumur maksimal enam jam, bukan jaminan kondisi udara saat ini.
          Panel ini menampilkan PM2.5, bukan indeks AQI. Ikuti panduan resmi setempat untuk keputusan kesehatan.
        </p>
      </section>


      <section className="world-weather-panel" aria-labelledby="world-weather-title">
        <div className="world-panel-head">
          <div>
            <p className="world-label">WEATHER & WARNINGS</p>
            <h2 id="world-weather-title">Cuaca dan peringatan Indonesia</h2>
            <p className="world-air-description">
              Pilih wilayah sampai desa/kelurahan untuk melihat prakiraan BMKG.
              Waktu prakiraan mengikuti waktu lokal yang disediakan BMKG.
            </p>
          </div>
          <button type="button" onClick={loadWeather} disabled={!desaCode || weatherLoading}>
            {weatherLoading ? "Memuat..." : "Muat ulang cuaca"}
          </button>
        </div>

        <div className="world-region-grid">
          <label>
            Provinsi
            <select value={provinceCode} onChange={(event) => {
              setProvinceCode(event.target.value);
              setKabupatenCode("");
              setKecamatanCode("");
              setDesaCode("");
              setWeatherResult(null);
              setWeatherError("");
            }}>
              <option value="">Pilih provinsi</option>
              {weatherRegions.provinces.map((region) => (
                <option key={region.code} value={region.code}>{region.name}</option>
              ))}
            </select>
          </label>

          <label>
            Kabupaten/kota
            <select value={kabupatenCode} disabled={!provinceCode} onChange={(event) => {
              setKabupatenCode(event.target.value);
              setKecamatanCode("");
              setDesaCode("");
              setWeatherResult(null);
              setWeatherError("");
            }}>
              <option value="">Pilih kabupaten/kota</option>
              {weatherRegions.kabupaten.map((region) => (
                <option key={region.code} value={region.code}>{region.name}</option>
              ))}
            </select>
          </label>

          <label>
            Kecamatan
            <select value={kecamatanCode} disabled={!kabupatenCode} onChange={(event) => {
              setKecamatanCode(event.target.value);
              setDesaCode("");
              setWeatherResult(null);
              setWeatherError("");
            }}>
              <option value="">Pilih kecamatan</option>
              {weatherRegions.kecamatan.map((region) => (
                <option key={region.code} value={region.code}>{region.name}</option>
              ))}
            </select>
          </label>

          <label>
            Desa/kelurahan
            <select value={desaCode} disabled={!kecamatanCode} onChange={(event) => {
              setDesaCode(event.target.value);
              setWeatherResult(null);
              setWeatherError("");
            }}>
              <option value="">Pilih desa/kelurahan</option>
              {weatherRegions.desa.map((region) => (
                <option key={region.code} value={region.code}>{region.name}</option>
              ))}
            </select>
          </label>
        </div>

        {regionError && <p className="world-weather-error" role="status">{regionError}</p>}

        {weatherLoading && <p role="status">Memuat prakiraan dari BMKG…</p>}
        {!weatherLoading && weatherError && (
          <p className="world-weather-error" role="status">{weatherError}</p>
        )}
        {!weatherLoading && !weatherError && !desaCode && (
          <p className="world-weather-empty">Pilih wilayah hingga desa/kelurahan untuk memuat prakiraan cuaca.</p>
        )}

        {!weatherLoading && !weatherError && weatherResult && (
          <>
            <div className="world-weather-meta">
              <span>
                Wilayah: {weatherResult.location?.desa || "Desa tidak diketahui"},
                {" "}{weatherResult.location?.kecamatan || ""},
                {" "}{weatherResult.location?.kotkab || ""}
              </span>
              <span>Provinsi: {weatherResult.location?.provinsi || "Tidak tersedia"}</span>
              <span>Data diambil: {formatTime(weatherResult.fetchedAt)}</span>
              <span>Sumber: <a href={weatherResult.sourceUrl || "https://www.bmkg.go.id/"}
                target="_blank" rel="noopener noreferrer">BMKG</a></span>
            </div>

            {weatherForecast.length === 0 ? (
              <p className="world-weather-empty">BMKG tidak mengirim catatan prakiraan untuk wilayah ini.</p>
            ) : (
              <div className="world-weather-grid">
                {weatherForecast.map((item, index) => (
                  <article className="world-weather-card" key={`${item.datetime}-${index}`}>
                    <p className="world-weather-time">{item.datetime || "Waktu tidak tersedia"}</p>
                    <h3>{item.condition || "Kondisi tidak tersedia"}</h3>
                    <p className="world-weather-temp">
                      {item.temperatureC == null ? "—" : `${item.temperatureC}°C`}
                    </p>
                    <dl>
                      <div><dt>Kelembapan</dt><dd>{item.humidityPercent == null ? "—" : `${item.humidityPercent}%`}</dd></div>
                      <div><dt>Hujan</dt><dd>{item.rainfallMm == null ? "—" : `${item.rainfallMm} mm`}</dd></div>
                      <div><dt>Angin</dt><dd>{item.windSpeedKmh == null ? "—" : `${item.windSpeedKmh} km/jam`}</dd></div>
                      <div><dt>Arah angin</dt><dd>{item.windDirection || "—"}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
            <p className="world-disclaimer">
              Prakiraan bukan jaminan kondisi aktual. Ikuti informasi dan arahan resmi BMKG serta pemerintah setempat.
            </p>
          </>
        )}
      </section>

      <section className="world-weather-panel" aria-labelledby="world-warnings-title">
        <div className="world-panel-head">
          <div>
            <p className="world-label">OFFICIAL WEATHER ALERTS</p>
            <h2 id="world-warnings-title">Peringatan BMKG</h2>
            <p className="world-air-description">
              Daftar dari feed peringatan BMKG. Periksa tautan untuk rincian dan waktu berlaku.
            </p>
          </div>
          <button type="button" onClick={loadWarnings} disabled={warningsLoading}>
            {warningsLoading ? "Memuat..." : "Muat ulang peringatan"}
          </button>
        </div>

        {warningsLoading && <p role="status">Mengambil feed peringatan BMKG…</p>}
        {!warningsLoading && warningsError && (
          <p className="world-weather-error" role="status">
            {warningsError} Status peringatan tidak dapat dipastikan karena feed gagal diakses.
          </p>
        )}
        {!warningsLoading && !warningsError && weatherWarnings.length === 0 && (
          <p className="world-weather-empty" role="status">
            Feed BMKG berhasil diperiksa dan saat ini tidak memuat item peringatan.
            Periksa kembali secara berkala.
          </p>
        )}
        {!warningsLoading && !warningsError && weatherWarnings.length > 0 && (
          <div className="world-warning-list">
            {weatherWarnings.map((warning, index) => (
              <article className="world-warning-card" key={`${warning.url}-${index}`}>
                <div className="world-warning-heading">
                  <h3>{warning.title}</h3>
                  <span>Feed BMKG</span>
                </div>
                <p>{warning.description}</p>
                <div className="world-warning-meta">
                  <span>Diterbitkan: {warning.publishedAt || "Waktu tidak tersedia"}</span>
                  <a href={warning.url} target="_blank" rel="noopener noreferrer">
                    Detail resmi BMKG ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
        {warningsResult?.note && !warningsError && (
          <p className="world-disclaimer">{warningsResult.note}</p>
        )}
        <p className="world-disclaimer">
          Item feed tidak otomatis berarti peringatan masih berlaku. Verifikasi waktu dan wilayah pada sumber resmi.
        </p>
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
              <small>{layer.number === "04" ? "DALAM PENGEMBANGAN" : "INTEGRASI AKTIF"}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
