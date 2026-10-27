const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectre-number-test-'));

process.env.INSPECTRE_DATA_DIR = tempDir;
process.env.INSPECTRE_NUMBERS_FILE = path.join(tempDir, 'numbers.json');
process.env.INSPECTRE_DB_PATH = path.join(tempDir, 'test.db');

const { checkNumber, reportNumber } = require('../numberChecker');

test('nomor tanpa laporan bukan AMAN', () => {
  const result = checkNumber('081234567890');
  assert.equal(result.riskLevel, 'BELUM_DIKETAHUI');
  assert.equal(result.threatScore, 0);
  assert.match(result.note, /bukan bukti.*aman/i);
});

test('1–2 laporan menghasilkan WASPADA', () => {
  reportNumber('081111111111', 'pelapor-1');
  assert.equal(checkNumber('081111111111').riskLevel, 'WASPADA');
  reportNumber('081111111111', 'pelapor-2');
  assert.equal(checkNumber('081111111111').threatScore, 40);
});

test('3 laporan menghasilkan CURIGA', () => {
  for (let i = 1; i <= 3; i++) {
    reportNumber('081222222222', `pelapor-${i}`);
  }
  assert.equal(checkNumber('081222222222').riskLevel, 'CURIGA');
});

test('6 laporan menghasilkan BAHAYA', () => {
  for (let i = 1; i <= 6; i++) {
    reportNumber('081333333333', `pelapor-${i}`);
  }
  assert.equal(checkNumber('081333333333').riskLevel, 'BAHAYA');
});

test('laporan dari pelapor yang sama tidak dihitung dua kali', () => {
  reportNumber('081444444444', 'pelapor-sama');
  const duplicate = reportNumber('081444444444', 'pelapor-sama');
  assert.equal(duplicate.count, 1);
  assert.equal(duplicate.duplicate, true);
});

test.after(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});
