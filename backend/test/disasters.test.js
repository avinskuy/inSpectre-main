const test = require('node:test');
const assert = require('node:assert/strict');
const { getDisasters, clearCache } = require('../disasters');

test.beforeEach(() => {
  clearCache();
});

const originalFetch = global.fetch;

function quake(overrides = {}) {
  return {
    Tanggal: '27 Okt 2026',
    Jam: '21:43:13 WIB',
    DateTime: '2026-10-27T14:43:13+00:00',
    Coordinates: '-9.20,110.39',
    Lintang: '9.20 LS',
    Bujur: '110.39 BT',
    Magnitude: '5.4',
    Kedalaman: '10 km',
    Wilayah: '136 km BaratDaya GUNUNGKIDUL-DIY',
    Potensi: 'Tidak berpotensi tsunami',
    ...overrides,
  };
}

function response(item, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => item,
  };
}

function feed(item) {
  return response({ Infogempa: { gempa: item } });
}

test('menormalkan tiga feed BMKG menjadi data gempa terstruktur', async () => {
  global.fetch = async () => feed(quake());

  try {
    const result = await getDisasters();

    assert.equal(result.status, 'ok');
    assert.equal(result.source, 'BMKG');
    assert.equal(result.latest.magnitude, 5.4);
    assert.equal(result.latest.latitude, -9.2);
    assert.equal(result.latest.longitude, 110.39);
    assert.equal(result.latest.depthKm, 10);
    assert.equal(result.latest.region, '136 km BaratDaya GUNUNGKIDUL-DIY');
    assert.equal(result.significant.length, 1);
    assert.equal(result.felt.length, 1);
    assert.equal(result.errors && Object.keys(result.errors).length, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test('menerima daftar gempa dalam bentuk array', async () => {
  global.fetch = async () => feed([
    quake(),
    quake({
      Coordinates: '-8.45,121.45',
      Magnitude: '4.9',
      DateTime: '2026-10-26T04:53:42+00:00',
    }),
  ]);

  try {
    const result = await getDisasters();
    assert.equal(result.significant.length, 2);
    assert.equal(result.significant[1].longitude, 121.45);
  } finally {
    global.fetch = originalFetch;
  }
});

test('mengabaikan koordinat dan magnitudo yang tidak valid', async () => {
  global.fetch = async (url) => {
    if (url.endsWith('autogempa.json')) return feed(quake());
    return feed([
      quake({ Coordinates: '999,110.39' }),
      quake({ Magnitude: 'NaN' }),
      quake({ Coordinates: '-9.2,110.39', Magnitude: '4.5' }),
    ]);
  };

  try {
    const result = await getDisasters();
    assert.equal(result.significant.length, 1);
    assert.equal(result.significant[0].magnitude, 4.5);
  } finally {
    global.fetch = originalFetch;
  }
});

test('menghasilkan status partial jika satu feed gagal', async () => {
  global.fetch = async (url) => {
    if (url.endsWith('gempaterkini.json')) {
      return response({}, 503);
    }
    return feed(quake());
  };

  try {
    const result = await getDisasters();
    assert.equal(result.status, 'partial');
    assert.ok(result.latest);
    assert.ok(result.errors.significant);
  } finally {
    global.fetch = originalFetch;
  }
});

test('menolak jika seluruh feed gagal', async () => {
  global.fetch = async () => response({}, 503);

  try {
    await assert.rejects(
      getDisasters(),
      (error) => error.statusCode === 502
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('menolak struktur JSON feed terbaru yang tidak valid', async () => {
  global.fetch = async (url) => {
    if (url.endsWith('autogempa.json')) {
      return response({ Infogempa: {} });
    }
    return feed(quake());
  };

  try {
    const result = await getDisasters();
    assert.equal(result.status, 'partial');
    assert.equal(result.latest, null);
    assert.ok(result.errors.latest);
  } finally {
    global.fetch = originalFetch;
  }
});
