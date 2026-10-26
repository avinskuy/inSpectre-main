'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv } = require('../hotspots');

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

test('NASA FIRMS memproses respons CSV dan membatasi wilayah Indonesia', async () => {
  const { fetchHotspots } = require('../hotspots');
  let requestedUrl = '';

  const result = await fetchHotspots({
    apiKey: 'test-key',
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        text: async () =>
          'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight\n' +
          '-3.8,102.2,330,0.4,0.5,2026-10-27,0315,N,nominal,2.0,290,4.2,D\n' +
          '20,150,330,0.4,0.5,2026-10-27,0315,N,nominal,2.0,290,4.2,D'
      };
    }
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].confidence, 'nominal');
  assert.ok(!requestedUrl.includes(' '));
});
