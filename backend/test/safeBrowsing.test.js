'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkUrlReputation } = require('../safeBrowsing');

const originalKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

function setTestKey() {
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key-not-real';
}

function restoreKey() {
  if (originalKey === undefined) {
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  } else {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = originalKey;
  }
}

test('Google Safe Browsing mendeteksi kategori ancaman', async () => {
  setTestKey();
  try {
    const result = await checkUrlReputation('https://example.org', {
      fetch: async () => ({
        ok: true,
        json: async () => ({
          matches: [
            { threatType: 'SOCIAL_ENGINEERING' },
            { threatType: 'MALWARE' }
          ]
        })
      })
    });

    assert.equal(result.status, 'threat');
    assert.deepEqual(
      result.threats.sort(),
      ['MALWARE', 'SOCIAL_ENGINEERING']
    );
  } finally {
    restoreKey();
  }
});

test('respons tanpa kecocokan bukan bukti keamanan mutlak', async () => {
  setTestKey();
  try {
    const result = await checkUrlReputation('https://example.org', {
      fetch: async () => ({
        ok: true,
        json: async () => ({})
      })
    });

    assert.deepEqual(result, { status: 'no_match' });
  } finally {
    restoreKey();
  }
});

test('HTTP error tidak dianggap sebagai hasil aman', async () => {
  setTestKey();
  try {
    const result = await checkUrlReputation('https://example.org', {
      fetch: async () => ({ ok: false, status: 403 })
    });

    assert.equal(result.status, 'unavailable');
    assert.equal(result.reason, 'HTTP_403');
  } finally {
    restoreKey();
  }
});

test('kegagalan jaringan tidak dianggap sebagai hasil aman', async () => {
  setTestKey();
  try {
    const result = await checkUrlReputation('https://example.org', {
      fetch: async () => {
        throw new Error('simulasi jaringan terputus');
      }
    });

    assert.equal(result.status, 'unavailable');
    assert.equal(result.reason, 'NETWORK_ERROR');
  } finally {
    restoreKey();
  }
});

test('API key kosong menghasilkan status unavailable', async () => {
  delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  try {
    const result = await checkUrlReputation('https://example.org', {
      fetch: async () => {
        throw new Error('Fetch tidak boleh dipanggil');
      }
    });

    assert.equal(result.status, 'unavailable');
    assert.equal(result.reason, 'API_KEY_MISSING');
  } finally {
    restoreKey();
  }
});
