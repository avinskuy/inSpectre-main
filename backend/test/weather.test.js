const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getRegions, getForecast } = require('../weather');

const csv = fs.readFileSync(
  path.join(__dirname, '..', 'data', 'bmkg-regions.csv'), 'utf8'
);
const villages = csv.split(/\r?\n/)
  .map((line) => line.split(',')[0])
  .filter((code) => /^\d{2}(?:\.\d{2}){2}\.\d{4}$/.test(code));

const validCode = '17.71.01.1001';
const otherCodes = villages.filter((code) => code !== validCode);
assert.ok(villages.includes(validCode), 'kode desa uji harus tersedia');
assert.ok(otherCodes.length >= 3, 'dataset perlu menyediakan kode desa tambahan');

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  };
}

test('daftar wilayah memiliki provinsi dan anak wilayah yang sesuai', () => {
  assert.equal(getRegions().length, 34);
  assert.ok(getRegions('17').length > 0);
  assert.ok(getRegions('17.71').length > 0);
  assert.ok(getRegions('17.71.01').some((item) => item.code === validCode));
});

test('kode induk yang tidak dikenal ditolak', () => {
  assert.throws(
    () => getRegions('99.99'),
    (error) => error.statusCode === 400
  );
});

test('kode non-desa ditolak tanpa request ke BMKG', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return response('{}');
  };
  try {
    await assert.rejects(
      getForecast('17.71.01'),
      (error) => error.statusCode === 400
    );
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test('pemetaan prakiraan menjaga nilai kosong sebagai null', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => response(JSON.stringify({
    lokasi: { adm4: validCode, desa: 'Pagar Dewa' },
    data: [{
      cuaca: [[
        {
          local_datetime: '2026-10-27 18:00:00',
          utc_datetime: '2026-10-27 11:00:00',
          t: '27',
          hu: null,
          weather_desc: 'Hujan Ringan',
          tp: '',
          ws: null,
          wd: '',
          tcc: null,
        },
        {
          local_datetime: '2026-10-27 21:00:00',
          t: null,
          weather_desc: 'Data suhu tidak valid',
        },
      ]],
    }],
  }));

  try {
    const result = await getForecast(validCode);
    assert.equal(result.status, 'ok');
    assert.equal(result.source, 'BMKG');
    assert.equal(result.forecast.length, 1);
    assert.equal(result.forecast[0].temperatureC, 27);
    assert.equal(result.forecast[0].condition, 'Hujan Ringan');
    assert.equal(result.forecast[0].humidityPercent, null);
    assert.equal(result.forecast[0].rainfallMm, null);
    assert.equal(result.forecast[0].windSpeedKmh, null);
    assert.equal(result.forecast[0].windDirection, null);
    assert.equal(result.forecast[0].cloudCoverPercent, null);
  } finally {
    global.fetch = originalFetch;
  }
});

test('respons dengan kode wilayah berbeda ditolak', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => response(JSON.stringify({
    lokasi: { adm4: validCode },
    data: [],
  }));

  try {
    await assert.rejects(
      getForecast(otherCodes[0]),
      (error) => error.statusCode === 502
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('JSON BMKG yang rusak ditolak', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => response('{invalid json');

  try {
    await assert.rejects(
      getForecast(otherCodes[1]),
      (error) => error.statusCode === 502
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('HTTP error dari BMKG tidak dianggap sebagai prakiraan valid', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => response('Service unavailable', 503);

  try {
    await assert.rejects(
      getForecast(otherCodes[2]),
      (error) => error.statusCode === 502
    );
  } finally {
    global.fetch = originalFetch;
  }
});
