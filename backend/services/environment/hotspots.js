'use strict';

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_ROWS = 10000;

let cache = {
  data: [],
  source: 'NASA FIRMS',
  status: 'unavailable',
  updatedAt: null,
  error: 'Data hotspot belum dimuat.',
};
let cacheAt = 0;
let inFlight = null;

function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      fields.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  fields.push(value);
  return fields;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase()
  );

  const index = Object.fromEntries(
    headers.map((header, i) => [header, i])
  );

  for (const field of ['latitude', 'longitude', 'acq_date']) {
    if (index[field] === undefined) {
      throw new Error('FORMAT_TIDAK_VALID');
    }
  }

  return lines.slice(1, MAX_ROWS + 1).flatMap((line) => {
    if (!line.trim()) return [];

    const fields = parseCsvLine(line);
    const number = (name) => Number(fields[index[name]]);
    const latitude = number('latitude');
    const longitude = number('longitude');
    const acqDate = fields[index.acq_date]?.trim();
    const acqTime = fields[index.acq_time]?.trim() || '';
    const confidence =
      index.confidence === undefined
        ? null
        : fields[index.confidence]?.trim() || null;

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(acqDate || '') ||
      Number.isNaN(Date.parse(acqDate))
    ) {
      return [];
    }

    return [{
      latitude,
      longitude,
      observedAt: `${acqDate}T${String(acqTime).padStart(4, '0').slice(0, 2)}:${String(acqTime).padStart(4, '0').slice(2, 4)}:00Z`,
      confidence,
      satellite:
        index.satellite === undefined
          ? null
          : fields[index.satellite]?.trim() || null,
      instrument:
        index.instrument === undefined
          ? null
          : fields[index.instrument]?.trim() || null,
      source: 'NASA FIRMS',
    }];
  });
}

async function fetchHotspots({apiKey=process.env.NASA_FIRMS_MAP_KEY, fetchImpl=fetch}={}) {
  if (!apiKey) return {...cache,status:'unavailable',error:'NASA FIRMS belum dikonfigurasi.'};

  const base = 'https://firms.modaps.eosdis.nasa.gov/api';
  const headers = {Accept:'text/csv'};
  const options = {signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),headers};

  const availabilityUrl =
    `${base}/data_availability/csv/${encodeURIComponent(apiKey)}/VIIRS_SNPP_NRT`;
  const availabilityResponse = await fetchImpl(availabilityUrl, options);
  if (!availabilityResponse.ok) {
    throw new Error(`KETERSEDIAAN_HTTP_${availabilityResponse.status}`);
  }

  const availability = (await availabilityResponse.text()).trim().split(/\r?\n/);
  if (availability.length < 2) throw new Error('TANGGAL_TIDAK_TERSEDIA');

  const availabilityHeaders = parseCsvLine(availability[0]).map(x => x.trim().toLowerCase());
  const availabilityIndex = Object.fromEntries(
    availabilityHeaders.map((name, i) => [name, i])
  );
  for (const field of ['data_id', 'max_date']) {
    if (availabilityIndex[field] === undefined) throw new Error('FORMAT_KETERSEDIAAN_TIDAK_VALID');
  }

  let latestDate = null;
  for (const line of availability.slice(1)) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (fields[availabilityIndex.data_id]?.trim() === 'VIIRS_SNPP_NRT') {
      latestDate = fields[availabilityIndex.max_date]?.trim();
      break;
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(latestDate || '') ||
      Number.isNaN(Date.parse(latestDate))) {
    throw new Error('TANGGAL_TIDAK_TERSEDIA');
  }

  const areaUrl =
    `${base}/area/csv/${encodeURIComponent(apiKey)}/VIIRS_SNPP_NRT/90,-12,142,8/1/${latestDate}`;
  const response = await fetchImpl(areaUrl, options);
  if (!response.ok) throw new Error(`SUMBER_HTTP_${response.status}`);

  const rows = parseCsv(await response.text());
  const data = rows.filter(row =>
    row.latitude >= -12 && row.latitude <= 8 &&
    row.longitude >= 90 && row.longitude <= 142
  );

  return {
    data,
    source: 'NASA FIRMS VIIRS_SNPP_NRT',
    status: 'ok',
    updatedAt: new Date().toISOString(),
    error: null,
  };
}
async function getHotspots(options = {}) {
  const now = Date.now();

  if (
    !options.force &&
    cacheAt &&
    now - cacheAt < CACHE_TTL_MS
  ) {
    return { ...cache, cached: true };
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const result = await fetchHotspots(options);
      cache = result;
      cacheAt = Date.now();
      return { ...cache, cached: false };
    } catch (error) {
      return {
        ...cache,
        status: 'unavailable',
        error:
          error.name === 'TimeoutError'
            ? 'Sumber hotspot melewati batas waktu.'
            : 'Sumber hotspot tidak dapat diakses atau datanya tidak valid.',
        cached: false,
      };
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

module.exports = { getHotspots, parseCsv, fetchHotspots };
