const FEEDS = {
  latest: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
  significant: 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
  felt: 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
};

const SOURCE_URL = 'https://data.bmkg.go.id/gempabumi/';
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 60_000;
let cache = null;

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

function normalizeQuake(item, feed) {
  if (!item || typeof item !== 'object') return null;

  const coordinates = typeof item.Coordinates === 'string'
    ? item.Coordinates.split(',').map((part) => Number(part.trim()))
    : [];

  const [latitude, longitude] = coordinates;
  const magnitude = numberOrNull(item.Magnitude);

  if (
    coordinates.length !== 2 ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180 ||
    magnitude === null || magnitude < 0 || magnitude > 10
  ) {
    return null;
  }

  const depthMatch = String(item.Kedalaman || '')
    .match(/(-?\d+(?:[.,]\d+)?)\s*km/i);

  const depthKm = depthMatch ? numberOrNull(depthMatch[1]) : null;
  const occurredAt = typeof item.DateTime === 'string' &&
    Number.isFinite(Date.parse(item.DateTime))
    ? new Date(item.DateTime).toISOString()
    : null;

  return {
    id: `${item.DateTime || item.Tanggal || 'unknown'}:${latitude},${longitude}:${magnitude}`,
    latitude,
    longitude,
    magnitude,
    depthKm: depthKm !== null && depthKm >= 0 ? depthKm : null,
    occurredAt,
    date: typeof item.Tanggal === 'string' ? item.Tanggal : null,
    time: typeof item.Jam === 'string' ? item.Jam : null,
    region: typeof item.Wilayah === 'string' ? item.Wilayah : 'Wilayah tidak diketahui',
    potential: typeof item.Potensi === 'string' ? item.Potensi : null,
    felt: typeof item.Dirasakan === 'string' ? item.Dirasakan : null,
    shakemap: typeof item.Shakemap === 'string' ? item.Shakemap : null,
    source: 'BMKG',
    feed,
  };
}

async function fetchFeed(name, url) {
  let response;

  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    const error = new Error(`Feed BMKG ${name} tidak dapat dihubungi.`);
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Feed BMKG ${name} merespons HTTP ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }

  let body;
  try {
    body = await response.json();
  } catch {
    const error = new Error(`Respons JSON BMKG ${name} tidak valid.`);
    error.statusCode = 502;
    throw error;
  }

  const raw = body?.Infogempa?.gempa;
  if (!raw || typeof raw !== 'object') {
    const error = new Error(`Struktur data BMKG ${name} tidak valid.`);
    error.statusCode = 502;
    throw error;
  }

  const items = (Array.isArray(raw) ? raw : [raw])
    .map((item) => normalizeQuake(item, name))
    .filter(Boolean);

  // Data kosong boleh valid untuk feed daftar, tetapi tidak untuk gempa terbaru.
  if (name === 'latest' && items.length === 0) {
    const error = new Error('Data gempa terbaru BMKG tidak valid.');
    error.statusCode = 502;
    throw error;
  }

  return items;
}

async function getDisasters() {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const names = Object.keys(FEEDS);
  const settled = await Promise.allSettled(
    names.map((name) => fetchFeed(name, FEEDS[name]))
  );

  const data = {};
  const errors = {};

  settled.forEach((result, index) => {
    const name = names[index];

    if (result.status === 'fulfilled') {
      data[name] = result.value;
    } else {
      errors[name] = result.reason?.message || 'Feed tidak tersedia.';
    }
  });

  const successCount = Object.keys(data).length;

  if (successCount === 0) {
    const error = new Error('Data gempa BMKG sementara tidak tersedia.');
    error.statusCode = 502;
    throw error;
  }

  const value = {
    status: successCount === names.length ? 'ok' : 'partial',
    source: 'BMKG',
    sourceUrl: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    latest: data.latest?.[0] || null,
    significant: data.significant || [],
    felt: data.felt || [],
    errors,
  };

  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

function clearCache() {
  cache = null;
}

module.exports = { getDisasters, clearCache };
