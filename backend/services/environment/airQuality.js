'use strict';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_STATIONS = 24;

let cache = null;
let cacheAt = 0;
let inFlight = null;

async function requestJson(url, apiKey) {
  const response = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OpenAQ HTTP ${response.status}`);
  }

  return response.json();
}

function chooseStations(locations, limit = MAX_STATIONS) {
  const candidates = locations.filter((location) =>
    Number.isFinite(location.coordinates?.latitude) &&
    // Batas geografis luas Indonesia, termasuk pulau terluar.
    // Mencegah metadata negara yang keliru meloloskan stasiun di Eropa.
    location.coordinates.latitude >= -11.5 &&
    location.coordinates.latitude <= 6.5 &&
    Number.isFinite(location.coordinates?.longitude) &&
    location.coordinates.longitude >= 94 &&
    location.coordinates.longitude <= 142 &&
    (location.sensors || []).some(
      (sensor) => sensor.parameter?.name === 'pm25'
    )
  );

  // Sebarkan pilihan berdasarkan koordinat agar tidak hanya memilih
  // sensor yang berdekatan. Setiap lokasi tetap diperlakukan terpisah.
  const selected = [];
  const used = new Set();
  const grid = new Map();

  for (const location of candidates) {
    const lat = location.coordinates.latitude;
    const lon = location.coordinates.longitude;
    const cell = `${Math.floor((lat + 11) / 4)}:${Math.floor((lon - 94) / 5)}`;

    if (!grid.has(cell)) grid.set(cell, []);
    grid.get(cell).push(location);
  }

  for (const group of grid.values()) {
    if (selected.length >= limit) break;
    const location = group[0];
    selected.push(location);
    used.add(location.id);
  }

  // Isi slot tersisa jika jumlah sel geografis masih kurang.
  for (const location of candidates) {
    if (selected.length >= limit) break;
    if (!used.has(location.id)) {
      selected.push(location);
      used.add(location.id);
    }
  }

  return selected;
}

async function fetchAirQuality({
  fetchImpl = requestJson,
  apiKey = process.env.OPENAQ_API_KEY,
  now = Date.now(),
} = {}) {
  if (!apiKey) {
    return {
      data: [],
      source: 'OpenAQ',
      status: 'unavailable',
      fetchedAt: new Date(now).toISOString(),
      error: 'Kunci API kualitas udara belum dikonfigurasi.',
    };
  }

  try {
    const locationsBody = await fetchImpl(
      'https://api.openaq.org/v3/locations?iso=ID&parameters_id=2&limit=100&page=1',
      apiKey
    );

    const locations = Array.isArray(locationsBody?.results)
      ? locationsBody.results
      : [];

    const stations = chooseStations(locations);
    const results = await Promise.all(stations.map(async (location) => {
      try {
        const latestBody = await fetchImpl(
          `https://api.openaq.org/v3/locations/${encodeURIComponent(location.id)}/latest?limit=100`,
          apiKey
        );

        const sensors = (location.sensors || []).filter(
          (sensor) => sensor.parameter?.name === 'pm25'
        );
        const sensorIds = new Set(sensors.map((sensor) => sensor.id));

        const readings = (latestBody?.results || [])
          .filter((reading) =>
            sensorIds.has(reading.sensorsId) &&
            Number.isFinite(reading.value) &&
            reading.value >= 0 &&
            reading.datetime?.utc &&
            Number.isFinite(Date.parse(reading.datetime.utc))
          )
          .sort((a, b) =>
            Date.parse(b.datetime.utc) - Date.parse(a.datetime.utc)
          );

        const reading = readings[0];
        if (!reading) return null;

        const observedAt = new Date(reading.datetime.utc).toISOString();
        const ageMs = now - Date.parse(observedAt);
        const fresh = ageMs >= 0 && ageMs <= MAX_AGE_MS;

        return {
          id: location.id,
          name: location.name || 'Stasiun tanpa nama',
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
          value: reading.value,
          units: sensors.find((sensor) => sensor.id === reading.sensorsId)
            ?.parameter?.units || 'µg/m³',
          sensorId: reading.sensorsId,
          observedAt,
          status: fresh ? 'ok' : 'stale',
          qualityFlag: reading.value === 0 ? 'zero_value_check' : null,
        };
      } catch {
        // Satu stasiun gagal tidak menggagalkan seluruh respons.
        return null;
      }
    }));

    const data = results.filter(Boolean).sort(
      (a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)
    );
    const freshCount = data.filter((item) => item.status === 'ok').length;

    return {
      data,
      source: 'OpenAQ v3',
      status: freshCount > 0 ? 'ok' : data.length > 0 ? 'stale' : 'unavailable',
      fetchedAt: new Date(now).toISOString(),
      error: null,
    };
  } catch {
    return {
      data: [],
      source: 'OpenAQ v3',
      status: 'unavailable',
      fetchedAt: new Date(now).toISOString(),
      error: 'Data kualitas udara belum dapat dimuat.',
    };
  }
}

function getAirQuality(options = {}) {
  const now = Date.now();

  if (cache && now - cacheAt < CACHE_TTL_MS) {
    return Promise.resolve(cache);
  }

  if (inFlight) return inFlight;

  inFlight = fetchAirQuality(options)
    .then((result) => {
      cache = result;
      cacheAt = Date.now();
      return result;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

module.exports = {
  fetchAirQuality,
  getAirQuality,
  chooseStations,
};
