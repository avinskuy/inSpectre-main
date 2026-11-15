const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createWhoTagProvider,
  CACHE_TTL_MS,
} = require('../services/phones/whotagProvider');

function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function setup(options = {}) {
  let timestamp = options.timestamp ?? 1_800_000_000_000;
  const store = new Map();
  const cacheStore = {
    get: (phone) => store.get(phone) || null,
    set: (phone, value, cachedAt) => store.set(phone, { value, cachedAt }),
    clear: (phone) => phone ? store.delete(phone) : store.clear(),
  };
  let calls = 0;
  let response = mockResponse(200, {
    success: true,
    data: {
      result: {
        badge: 'example',
        trust: { level: 'unknown' },
        spamInfo: { degree: 'green' },
        profile: { tagCount: 4 },
        comments: { commentCount: 0 },
      },
    },
  });
  let fetchImpl = async (url, init) => {
    if (options.fetchImpl) return options.fetchImpl(url, init);
    return response;
  };
  const provider = createWhoTagProvider({
    cacheStore,
    fetchImpl: (...args) => {
      calls++;
      return fetchImpl(...args);
    },
    now: () => timestamp,
    getApiKey: () => options.apiKey === undefined ? 'test-key' : options.apiKey,
    getAccountId: () => options.accountId || '',
  });
  return {
    provider, store,
    setResponse: (next) => { response = next; },
    setFetch: (fn) => { fetchImpl = fn; },
    setTime: (next) => { timestamp = next; },
    calls: () => calls,
  };
}

test('hasil tersedia tersimpan dan dipakai dari cache', async () => {
  const t = setup();
  const first = await t.provider.lookupWhoTag('+628123456789');
  const second = await t.provider.lookupWhoTag('+628123456789');
  assert.equal(first.status, 'AVAILABLE');
  assert.equal(first.tagCount, 4);
  assert.equal(first.cache, 'MISS');
  assert.equal(second.cache, 'HIT');
  assert.equal(t.calls(), 1);
});


test('akun Premium mengambil dan memetakan detail tag dari endpoint gc/info', async () => {
  const requests = [];
  const t = setup({
    accountId: 'premium-account-id',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (url.endsWith('/v1/gc/look')) {
        return mockResponse(200, {
          success: true,
          data: { result: { profile: { tagCount: 4 }, trust: {}, spamInfo: {}, comments: {} } },
        });
      }
      if (url.endsWith('/v1/gc/info')) {
        return mockResponse(200, {
          success: true,
          data: {
            result: {
              tags: [
                { tag: 'Contact', count: 47 },
                { tag: 'Kak Depi', count: 45 },
                { tag: '', count: 2 },
                null,
              ],
            },
          },
        });
      }
      throw new Error('Unexpected provider URL');
    },
  });

  const result = await t.provider.lookupWhoTag('+628123456789');
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'https://api.whotag.me/v1/gc/look');
  assert.equal(requests[1].url, 'https://api.whotag.me/v1/gc/info');
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    phoneNumber: '+628123456789',
    accountId: 'premium-account-id',
  });
  assert.equal(result.tagsStatus, 'AVAILABLE');
  assert.deepEqual(result.tags, [
    { tag: 'Contact', count: 47 },
    { tag: 'Kak Depi', count: 45 },
  ]);
  assert.equal(result.tagCount, 4);
});

test('tanpa account ID, lookup lama tetap berjalan tanpa memanggil endpoint info', async () => {
  const t = setup();
  const result = await t.provider.lookupWhoTag('+628123456789');
  assert.equal(result.status, 'AVAILABLE');
  assert.equal(result.tagsStatus, 'NOT_CONFIGURED');
  assert.equal(t.calls(), 1);
});

test('cache kedaluwarsa setelah 24 jam dan melakukan lookup baru', async () => {
  const t = setup();
  await t.provider.lookupWhoTag('+628123456789');
  t.setTime(1_800_000_000_000 + CACHE_TTL_MS);
  const result = await t.provider.lookupWhoTag('+628123456789');
  assert.equal(result.cache, 'MISS');
  assert.equal(t.calls(), 2);
});

test('HTTP 429 tidak dianggap aman dan tidak di-cache', async () => {
  const t = setup();
  t.setResponse(mockResponse(429, { success: false }));
  const result = await t.provider.lookupWhoTag('+628123456780');
  assert.equal(result.status, 'UNAVAILABLE');
  assert.equal(result.reason, 'QUOTA_OR_RATE_LIMIT');
  assert.equal(t.store.size, 0);
});

test('kegagalan jaringan tidak dianggap aman', async () => {
  const t = setup();
  t.setFetch(async () => { throw new Error('simulated network failure'); });
  const result = await t.provider.lookupWhoTag('+628123456781');
  assert.equal(result.status, 'UNAVAILABLE');
  assert.equal(result.reason, 'NETWORK_ERROR');
  assert.equal(t.store.size, 0);
});

test('timeout provider tidak dianggap aman', async () => {
  const t = setup();
  t.setFetch(async () => {
    const error = new Error('simulated timeout');
    error.name = 'TimeoutError';
    throw error;
  });
  const result = await t.provider.lookupWhoTag('+628123456784');
  assert.equal(result.status, 'UNAVAILABLE');
  assert.equal(result.reason, 'TIMEOUT');
});

test('respons sukses tanpa bukti dikategorikan NO_DATA dan tidak di-cache', async () => {
  const t = setup();
  t.setResponse(mockResponse(200, {
    success: true,
    data: { result: {} },
  }));
  const result = await t.provider.lookupWhoTag('+628123456783');
  assert.equal(result.status, 'NO_DATA');
  assert.equal(t.store.size, 0);
});

test('API key kosong menghasilkan unavailable tanpa request', async () => {
  const t = setup({ apiKey: '' });
  const result = await t.provider.lookupWhoTag('+628123456782');
  assert.equal(result.status, 'UNAVAILABLE');
  assert.equal(result.reason, 'CONFIG_MISSING');
  assert.equal(t.calls(), 0);
});

test('input tidak valid tidak memanggil API', async () => {
  const t = setup();
  const result = await t.provider.lookupWhoTag('nomor-tidak-valid');
  assert.equal(result.status, 'INVALID_INPUT');
  assert.equal(t.calls(), 0);
});

test('cache tidak dipakai bila timestamp berada di masa depan', async () => {
  const t = setup();
  await t.provider.lookupWhoTag('+628123456789');
  t.setTime(1_800_000_000_000 - 1000);
  const result = await t.provider.lookupWhoTag('+628123456789');
  assert.equal(result.cache, 'MISS');
  assert.equal(t.calls(), 2);
});
