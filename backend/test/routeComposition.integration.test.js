'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectre-route-composition-'));
process.env.INSPECTRE_DATA_DIR = tempDir;
process.env.INSPECTRE_DB_PATH = path.join(tempDir, 'routes.sqlite');
process.env.INSPECTRE_NUMBERS_FILE = path.join(tempDir, 'numbers.json');
delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
delete process.env.OPENROUTER_API_KEY;

const { server } = require('../server');
let baseUrl;

function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = Buffer.from(entry.data || '');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const centralBuffer = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuffer, eocd]);
}

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

test('platform and environment routers remain mounted under /api', async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  const healthBody = await health.json();
  assert.equal(health.status, 200);
  assert.equal(healthBody.status, 'ok');

  const regions = await fetch(`${baseUrl}/api/environment/regions`);
  const regionsBody = await regions.json();
  assert.equal(regions.status, 200);
  assert.equal(regionsBody.status, 'ok');
  assert.ok(Array.isArray(regionsBody.data));
  assert.ok(regionsBody.data.length > 0);
});

test('assistant route preserves validation and missing-key responses', async () => {
  const invalid = await fetch(`${baseUrl}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '   ' }),
  });
  assert.equal(invalid.status, 400);

  const unavailable = await fetch(`${baseUrl}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Bagaimana mengenali phishing?' }),
  });
  assert.equal(unavailable.status, 503);
});

test('file router scans ZIP and enters the APK manifest path', async () => {
  const zipResponse = await fetch(`${baseUrl}/api/scan-file?filename=readme.zip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: zip([{ name: 'readme.txt', data: 'dokumen biasa' }]),
  });
  const zipBody = await zipResponse.json();
  assert.equal(zipResponse.status, 200);
  assert.equal(zipBody.fileType, 'Arsip ZIP');
  assert.equal(zipBody.entriesScanned, 1);

  const apkResponse = await fetch(`${baseUrl}/api/scan-file?filename=sample.apk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: zip([
      { name: 'AndroidManifest.xml', data: 'manifest-placeholder' },
      { name: 'classes.dex', data: 'dex-placeholder' },
    ]),
  });
  const apkBody = await apkResponse.json();
  assert.equal(apkResponse.status, 200);
  assert.equal(apkBody.fileType, 'APK Android');
  assert.ok(['ANALYZED', 'UNAVAILABLE'].includes(apkBody.manifestAnalysis));
});
