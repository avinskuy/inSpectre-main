const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectre-route-test-'));
process.env.INSPECTRE_DATA_DIR = tempDir;
process.env.INSPECTRE_DB_PATH = path.join(tempDir, 'test.sqlite');
process.env.INSPECTRE_NUMBERS_FILE = path.join(tempDir, 'numbers.json');

let providerResult = { status: 'AVAILABLE', tagCount: 2 };
let providerCalls = 0;

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === './whotagProvider' &&
      parent?.filename === path.resolve(__dirname, '../server.js')) {
    return {
      lookupWhoTag: async (phone) => {
        providerCalls++;
        assert.match(phone, /^\+62\d{8,13}$/);
        return providerResult;
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { server } = require('../server');
Module._load = originalLoad;

let baseUrl;

test.before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('route mengembalikan reputasi AVAILABLE', async () => {
  providerResult = { status: 'AVAILABLE', tagCount: 2 };
  const before = providerCalls;
  const response = await fetch(`${baseUrl}/api/check/08123456789`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.number, '628123456789');
  assert.equal(body.externalReputation.status, 'AVAILABLE');
  assert.equal(body.externalReputation.tagCount, 2);
  assert.equal(providerCalls, before + 1);
});

test('route mempertahankan NO_DATA', async () => {
  providerResult = { status: 'NO_DATA' };
  const response = await fetch(`${baseUrl}/api/check/08123456780`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.externalReputation.status, 'NO_DATA');
  assert.equal(body.riskLevel, 'BELUM_DIKETAHUI');
});

test('route mempertahankan UNAVAILABLE', async () => {
  providerResult = { status: 'UNAVAILABLE', reason: 'NETWORK_ERROR' };
  const response = await fetch(`${baseUrl}/api/check/08123456781`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.externalReputation.status, 'UNAVAILABLE');
  assert.equal(body.externalReputation.reason, 'NETWORK_ERROR');
  assert.equal(body.riskLevel, 'BELUM_DIKETAHUI');
});

test('nomor tidak valid ditolak tanpa memanggil provider', async () => {
  const before = providerCalls;
  const response = await fetch(`${baseUrl}/api/check/bukan-nomor`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /Nomor tidak valid/);
  assert.equal(providerCalls, before);
});
