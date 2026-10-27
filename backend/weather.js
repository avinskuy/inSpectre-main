const fs = require('node:fs');
const path = require('node:path');

const REGION_FILE = path.join(__dirname, 'data', 'bmkg-regions.csv');
const FORECAST_URL = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';
const WARNING_URL = 'https://www.bmkg.go.id/alerts/nowcast/id';
const REQUEST_TIMEOUT_MS = 10_000;
const FORECAST_TTL_MS = 10 * 60 * 1000;
const WARNING_TTL_MS = 3 * 60 * 1000;

const cache = new Map();

function loadRegions() {
  const text = fs.readFileSync(REGION_FILE, 'utf8');
  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    const comma = line.indexOf(',');
    if (comma < 1) return null;

    const code = line.slice(0, comma).trim();
    const name = line.slice(comma + 1).trim();
    if (!name || !/^\d{2}(?:\.\d{2}){0,2}(?:\.\d{4})?$/.test(code)) {
      return null;
    }

    let level;
    let parentCode = null;
    if (code.length === 2) {
      level = 'provinsi';
    } else if (code.length === 5) {
      level = 'kabupaten';
      parentCode = code.slice(0, 2);
    } else if (code.length === 8) {
      level = 'kecamatan';
      parentCode = code.slice(0, 5);
    } else if (code.length === 13) {
      level = 'desa';
      parentCode = code.slice(0, 8);
    } else {
      return null;
    }

    return { code, name, level, parentCode };
  }).filter(Boolean);
}

const regions = loadRegions();
const regionByCode = new Map(regions.map((region) => [region.code, region]));

function getRegions(parentCode) {
  if (parentCode === undefined || parentCode === null || parentCode === '') {
    return regions.filter((region) => region.level === 'provinsi');
  }
  if (!regionByCode.has(parentCode)) {
    const error = new Error('Kode wilayah tidak dikenal.');
    error.statusCode = 400;
    throw error;
  }
  return regions.filter((region) => region.parentCode === parentCode);
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttl) {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
  return value;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json, application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const error = new Error(`Sumber cuaca merespons HTTP ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
  return response.text();
}

function optionalNumber(value) {
  if (value === null || value === undefined ||
      (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
async function getForecast(adm4) {
  if (typeof adm4 !== 'string' || !regionByCode.has(adm4) ||
      regionByCode.get(adm4).level !== 'desa') {
    const error = new Error('Pilih kode desa/kelurahan yang valid.');
    error.statusCode = 400;
    throw error;
  }

  const key = `forecast:${adm4}`;
  const cached = getCache(key);
  if (cached) return cached;

  const url = `${FORECAST_URL}?adm4=${encodeURIComponent(adm4)}`;
  const raw = await fetchText(url);
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    const error = new Error('Respons prakiraan BMKG tidak valid.');
    error.statusCode = 502;
    throw error;
  }

  if (payload.lokasi?.adm4 !== adm4 || !Array.isArray(payload.data)) {
    const error = new Error('Kode wilayah tidak cocok dengan respons BMKG.');
    error.statusCode = 502;
    throw error;
  }

  const forecasts = payload.data.flatMap((day) =>
    Array.isArray(day.cuaca) ? day.cuaca.flat(Infinity) : []
  ).filter((item) =>
    item && typeof item === 'object' &&
    typeof item.local_datetime === 'string' &&
    typeof item.weather_desc === 'string' &&
    optionalNumber(item.t) !== null
  ).sort((a, b) => a.local_datetime.localeCompare(b.local_datetime));

  if (!forecasts.length) {
    const error = new Error('Prakiraan BMKG belum tersedia untuk wilayah ini.');
    error.statusCode = 502;
    throw error;
  }

  return setCache(key, {
    status: 'ok',
    source: 'BMKG',
    sourceUrl: FORECAST_URL,
    fetchedAt: new Date().toISOString(),
    location: payload.lokasi,
    forecast: forecasts.slice(0, 24).map((item) => ({
      datetime: item.local_datetime,
      utcDatetime: item.utc_datetime,
      temperatureC: optionalNumber(item.t),
      humidityPercent: optionalNumber(item.hu),
      condition: item.weather_desc,
      rainfallMm: optionalNumber(item.tp),
      windSpeedKmh: optionalNumber(item.ws),
      windDirection: item.wd || null,
      cloudCoverPercent: optionalNumber(item.tcc),
    })),
  }, FORECAST_TTL_MS);
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function xmlField(xml, field) {
  const match = xml.match(new RegExp(`<${field}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${field}>`, 'i'));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')) : '';
}

async function getWarnings() {
  const key = 'warnings';
  const cached = getCache(key);
  if (cached) return cached;

  const xml = await fetchText(WARNING_URL);
  if (!/<rss(?:\s|>)/i.test(xml) || !/<channel(?:\s|>)/i.test(xml)) {
    const error = new Error('Respons feed peringatan BMKG tidak valid.');
    error.statusCode = 502;
    throw error;
  }
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const item = match[1];
      return {
        title: xmlField(item, 'title'),
        url: xmlField(item, 'link'),
        description: xmlField(item, 'description'),
        publishedAt: xmlField(item, 'pubDate'),
      };
    })
    .filter((item) => item.title && item.description &&
      /^https:\/\/www\.bmkg\.go\.id\/alerts\/nowcast\/id\//i.test(item.url))
    .slice(0, 50);

  return setCache(key, {
    status: 'ok',
    source: 'BMKG',
    sourceUrl: WARNING_URL,
    fetchedAt: new Date().toISOString(),
    warnings: items,
    note: 'Daftar dari feed peringatan BMKG. Periksa detail dan waktu berlaku pada tautan sumber.',
  }, WARNING_TTL_MS);
}

module.exports = { getRegions, getForecast, getWarnings };
