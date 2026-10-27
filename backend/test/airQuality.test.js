'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchAirQuality, chooseStations } = require('../airQuality');

const NOW = Date.parse('2026-10-27T10:00:00Z');

function locationFixture() {
  return {
    results: [{
      id: 123,
      name: 'Stasiun Uji',
      coordinates: { latitude: -6.2, longitude: 106.8 },
      sensors: [
        { id: 10, parameter: { name: 'pm25', units: 'µg/m³' } },
        { id: 11, parameter: { name: 'temperature', units: 'c' } },
      ],
    }],
  };
}

function mockFetch(latestResults) {
  return async (url) => {
    if (url.includes('/locations?')) return locationFixture();
    if (url.includes('/latest?')) return { results: latestResults };
    throw new Error('URL tidak dikenal');
  };
}

test('hanya mengambil pembacaan dari sensor PM2.5 yang cocok', async () => {
  const fetchImpl = mockFetch([
    {
      sensorsId: 11, value: 29,
      datetime: { utc: '2026-10-27T09:00:00Z' },
    },
    {
      sensorsId: 10, value: 18.5,
      datetime: { utc: '2026-10-27T09:30:00Z' },
    },
  ]);

  const result = await fetchAirQuality({ fetchImpl, apiKey: 'test', now: NOW });
  assert.equal(result.status, 'ok');
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].value, 18.5);
  assert.equal(result.data[0].sensorId, 10);
  assert.equal(result.data[0].status, 'ok');
});

test('menolak nilai negatif dan memilih observasi valid terbaru', async () => {
  const fetchImpl = mockFetch([
    {
      sensorsId: 10, value: -999,
      datetime: { utc: '2026-10-27T09:50:00Z' },
    },
    {
      sensorsId: 10, value: 12,
      datetime: { utc: '2026-10-27T09:00:00Z' },
    },
  ]);

  const result = await fetchAirQuality({ fetchImpl, apiKey: 'test', now: NOW });
  assert.equal(result.data[0].value, 12);
});

test('menandai observasi yang lebih tua dari enam jam sebagai stale', async () => {
  const fetchImpl = mockFetch([{
    sensorsId: 10, value: 20,
    datetime: { utc: '2026-10-27T03:00:00Z' },
  }]);

  const result = await fetchAirQuality({ fetchImpl, apiKey: 'test', now: NOW });
  assert.equal(result.status, 'stale');
  assert.equal(result.data[0].status, 'stale');
});

test('nol diberi tanda pemeriksaan, bukan dianggap bukti udara bersih', async () => {
  const fetchImpl = mockFetch([{
    sensorsId: 10, value: 0,
    datetime: { utc: '2026-10-27T09:00:00Z' },
  }]);

  const result = await fetchAirQuality({ fetchImpl, apiKey: 'test', now: NOW });
  assert.equal(result.data[0].qualityFlag, 'zero_value_check');
});

test('tanpa API key tidak membuat permintaan', async () => {
  let called = false;
  const result = await fetchAirQuality({
    apiKey: '',
    now: NOW,
    fetchImpl: async () => {
      called = true;
      throw new Error('Tidak seharusnya dipanggil');
    },
  });

  assert.equal(called, false);
  assert.equal(result.status, 'unavailable');
  assert.deepEqual(result.data, []);
});

test('kegagalan pencarian menghasilkan status unavailable', async () => {
  const result = await fetchAirQuality({
    apiKey: 'test',
    now: NOW,
    fetchImpl: async () => { throw new Error('simulasi gagal'); },
  });

  assert.equal(result.status, 'unavailable');
  assert.deepEqual(result.data, []);
});

test('pemilihan lokasi mengabaikan koordinat dan sensor yang tidak valid', () => {
  const selected = chooseStations([
    {
      id: 1,
      coordinates: { latitude: -6, longitude: 106 },
      sensors: [{ parameter: { name: 'pm25' } }],
    },
    {
      id: 2,
      coordinates: { latitude: 999, longitude: 106 },
      sensors: [{ parameter: { name: 'pm25' } }],
    },
    {
      id: 3,
      coordinates: { latitude: -6, longitude: 106 },
      sensors: [{ parameter: { name: 'temperature' } }],
    },
    {
      id: 4,
      // Metadata negara bisa salah; koordinat ini berada di Eropa.
      country: { code: 'ID' },
      coordinates: { latitude: 43.6137, longitude: 25.3595 },
      sensors: [{ parameter: { name: 'pm25' } }],
    },
  ]);

  assert.deepEqual(selected.map((item) => item.id), [1]);
});
