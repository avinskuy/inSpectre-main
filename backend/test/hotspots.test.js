'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv, fetchHotspots } = require('../hotspots');

test('CSV hotspot valid diproses', () => {
  const rows = parseCsv(
    'latitude,longitude,acq_date,acq_time,confidence,satellite\n' +
    '-3.8,102.2,2026-10-27,0315,nominal,N'
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].latitude, -3.8);
  assert.equal(rows[0].longitude, 102.2);
  assert.equal(rows[0].observedAt, '2026-10-27T03:15:00Z');
  assert.equal(rows[0].confidence, 'nominal');
});

test('CSV kosong menghasilkan daftar kosong', () => {
  assert.deepEqual(parseCsv(''), []);
});

test('Koordinat di luar rentang ditolak', () => {
  const rows = parseCsv(
    'latitude,longitude,acq_date\n' +
    '95,102,2026-10-27\n' +
    '-3.8,200,2026-10-27'
  );
  assert.deepEqual(rows, []);
});

test('Header wajib yang hilang menghasilkan error', () => {
  assert.throws(
    () => parseCsv('latitude,longitude\n-3.8,102.2'),
    /FORMAT_TIDAK_VALID/
  );
});

test('Mengambil tanggal tersedia NASA lalu meminta hotspot pada tanggal itu', async () => {
  const urls = [];
  const result = await fetchHotspots({
    apiKey: 'test-key',
    fetchImpl: async url => {
      urls.push(url);
      if (url.includes('/data_availability/')) {
        return {
          ok: true,
          text: async () =>
            'data_id,min_date,max_date\nVIIRS_SNPP_NRT,2026-07-01,2026-10-26'
        };
      }
      return {
        ok: true,
        text: async () =>
          'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n' +
          '-3.8,102.2,330,0.4,0.5,2026-10-26,0315,N,VIIRS,nominal,2.0,290,4.2,D\n' +
          '20,150,330,0.4,0.5,2026-10-26,0315,N,VIIRS,nominal,2.0,290,4.2,D'
      };
    }
  });

  assert.equal(urls.length, 2);
  assert.ok(urls[0].includes('/data_availability/'));
  assert.ok(urls[1].endsWith('/90,-12,142,8/1/2026-10-26'));
  assert.equal(result.status, 'ok');
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].confidence, 'nominal');
});

test('Tanggal ketersediaan yang tidak valid ditolak', async () => {
  await assert.rejects(
    () => fetchHotspots({
      apiKey: 'test-key',
      fetchImpl: async () => ({
        ok: true,
        text: async () => 'data_id,min_date,max_date\nVIIRS_SNPP_NRT,2026-07-01,'
      })
    }),
    /TANGGAL_TIDAK_TERSEDIA/
  );
});
