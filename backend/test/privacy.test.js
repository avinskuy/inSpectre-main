const test = require('node:test');
const assert = require('node:assert/strict');
const { maskNumber, publicUrl, publicIdentifier } = require('../privacy');

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
