'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const backendDir = path.resolve(__dirname, '..');

function loadConfig(overrides) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }

  const result = spawnSync(
    process.execPath,
    ['-e', "process.stdout.write(JSON.stringify(require('./config').CORS_ORIGINS))"],
    { cwd: backendDir, encoding: 'utf8', env }
  );

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('produksi tanpa CORS_ORIGIN menonaktifkan CORS lintas origin', () => {
  assert.equal(loadConfig({ NODE_ENV: 'production', CORS_ORIGIN: '' }), false);
  assert.equal(loadConfig({ NODE_ENV: 'production', CORS_ORIGIN: undefined }), false);
});

test('CORS_ORIGIN produksi menerima allowlist eksplisit', () => {
  assert.deepEqual(
    loadConfig({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://inspectre.my.id, https://www.inspectre.my.id',
    }),
    ['https://inspectre.my.id', 'https://www.inspectre.my.id']
  );
});

test('mode non-produksi mempertahankan default pengembangan', () => {
  assert.equal(loadConfig({ NODE_ENV: 'development', CORS_ORIGIN: undefined }), '*');
});
