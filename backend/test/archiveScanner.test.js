const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeArchive, parseCentralDirectory } = require('../archiveScanner');

function crc32() { return 0; }
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
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc32(), 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc32(), 16);
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

test('menolak file yang bukan arsip ZIP/APK', () => {
  assert.throws(() => analyzeArchive(Buffer.from('not a zip'), 'sample.zip'), /bukan arsip ZIP\/APK/);
});

test('menolak ekstensi file yang tidak didukung', () => {
  assert.throws(() => analyzeArchive(zip([{ name: 'readme.txt', data: 'hi' }]), 'sample.exe'), /\.apk atau \.zip/);
});

test('ZIP normal menghasilkan hasil statis dan menyatakan keterbatasan', () => {
  const result = analyzeArchive(zip([{ name: 'readme.txt', data: 'dokumen biasa' }]), 'readme.zip');
  assert.equal(result.riskLevel, 'AMAN');
  assert.equal(result.entriesScanned, 1);
  assert.ok(result.explanation.limitations.length >= 3);
});

test('mendeteksi executable di dalam ZIP', () => {
  const result = analyzeArchive(zip([{ name: 'invoice.exe', data: 'MZ' }]), 'invoice.zip');
  assert.ok(result.findings.some((f) => f.rule === 'EXECUTABLE_IN_ARCHIVE'));
  assert.equal(result.threatScore, 25);
  assert.equal(result.riskLevel, 'WASPADA');
});

test('mendeteksi ekstensi ganda yang menyesatkan', () => {
  const result = analyzeArchive(zip([{ name: 'tagihan.pdf.apk', data: 'fake' }]), 'attachment.zip');
  assert.ok(result.findings.some((f) => f.rule === 'DOUBLE_EXTENSION'));
});

test('mendeteksi APK yang tidak memiliki AndroidManifest.xml', () => {
  const result = analyzeArchive(zip([{ name: 'classes.dex', data: 'dex' }]), 'sample.apk');
  assert.ok(result.findings.some((f) => f.rule === 'APK_MANIFEST_MISSING'));
});

test('mendeteksi string kapabilitas sensitif pada file teks APK', () => {
  const result = analyzeArchive(zip([
    { name: 'AndroidManifest.xml', data: 'manifest-placeholder' },
    { name: 'assets/config.txt', data: 'android.permission.READ_SMS android.permission.RECEIVE_SMS' },
  ]), 'sample.apk');
  assert.ok(result.findings.some((f) => f.rule === 'SENSITIVE_ANDROID_CAPABILITIES'));
});

test('parser menolak ZIP yang terpotong atau tidak memiliki direktori pusat', () => {
  assert.throws(() => parseCentralDirectory(Buffer.from('PK\x03\x04')), /tidak valid/);
});

test('batas ukuran unggahan 25 MB diterapkan', () => {
  const large = Buffer.alloc(25 * 1024 * 1024 + 1);
  assert.throws(() => analyzeArchive(large, 'large.zip'), /25 MB/);
});
