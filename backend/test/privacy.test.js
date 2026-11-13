const test = require('node:test');
const assert = require('node:assert/strict');
const { maskNumber, publicUrl, publicIdentifier } = require('../services/storage/privacy');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');

test('nomor disamarkan', () => {
  assert.equal(maskNumber('6281234567890'), '6281******890');
});

test('query & hash URL dibuang', () => {
  assert.equal(publicUrl('https://a.com/path?token=rahasia#x'), 'a.com/path');
});

test('publicIdentifier memilih aturan sesuai tipe', () => {
  assert.equal(publicIdentifier('scam_number', '6281234567890'), '6281******890');
  assert.equal(publicIdentifier('link', 'https://x.com/a?b=1'), 'x.com/a');
  assert.equal(publicIdentifier('apk', 'file.apk'), 'file.apk');
});


test('URL tidak valid tidak mengembalikan input mentah', () => {
  assert.equal(publicUrl('https://[invalid]?token=rahasia'), 'URL tidak valid');
});

test('log scan menyimpan URL tanpa query dan membersihkan catatan lama', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectre-privacy-'));
  const dbPath = path.join(tempDir, 'privacy.sqlite');
  const previous = {
    dataDir: process.env.INSPECTRE_DATA_DIR,
    dbPath: process.env.INSPECTRE_DB_PATH,
    numbersFile: process.env.INSPECTRE_NUMBERS_FILE,
  };

  try {
    process.env.INSPECTRE_DATA_DIR = tempDir;
    process.env.INSPECTRE_DB_PATH = dbPath;
    process.env.INSPECTRE_NUMBERS_FILE = path.join(tempDir, 'numbers.json');

    const legacy = new Database(dbPath);
    legacy.exec(`
      CREATE TABLE scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        identifier TEXT NOT NULL,
        threatScore INTEGER NOT NULL,
        riskLevel TEXT NOT NULL,
        findings TEXT,
        scannedAt TEXT NOT NULL,
        user_id INTEGER
      );
    `);
    legacy.prepare(
      'INSERT INTO scans (type, identifier, threatScore, riskLevel, findings, scannedAt, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'link',
      'https://example.com/old?token=legacy-secret#section',
      10,
      'WASPADA',
      JSON.stringify([{ evidence: 'query=legacy-secret' }]),
      new Date().toISOString(),
      null
    );
    legacy.close();

    const storage = require('../services/storage/db');
    const check = new Database(dbPath);
    const oldRow = check.prepare('SELECT identifier, findings FROM scans WHERE id = 1').get();
    assert.equal(oldRow.identifier, 'example.com/old');
    assert.equal(oldRow.findings, '[]');

    storage.logScan(
      'link',
      'https://example.com/new?session=current-secret#fragment',
      5,
      'AMAN',
      [{ evidence: 'session=current-secret' }],
      null
    );
    const newRow = check.prepare('SELECT identifier, findings FROM scans WHERE id = 2').get();
    assert.equal(newRow.identifier, 'example.com/new');
    assert.equal(newRow.findings, '[]');
    check.close();
  } finally {
    if (previous.dataDir === undefined) delete process.env.INSPECTRE_DATA_DIR;
    else process.env.INSPECTRE_DATA_DIR = previous.dataDir;
    if (previous.dbPath === undefined) delete process.env.INSPECTRE_DB_PATH;
    else process.env.INSPECTRE_DB_PATH = previous.dbPath;
    if (previous.numbersFile === undefined) delete process.env.INSPECTRE_NUMBERS_FILE;
    else process.env.INSPECTRE_NUMBERS_FILE = previous.numbersFile;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
