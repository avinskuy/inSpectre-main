// Jalankan: npm test  (memakai node:test bawaan Node 18+, tanpa dependensi tambahan)
const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeLink } = require('../linkChecker');

const level = (u) => analyzeLink(u).riskLevel;

test('domain resmi (whitelist) → AMAN', () => {
  assert.equal(level('https://www.google.com/search?q=login'), 'AMAN');
  assert.equal(level('https://m.bca.co.id'), 'AMAN');
});

test('peniruan brand + TLD berisiko + keyword → PHISHING', () => {
  assert.equal(level('http://bca-login.xyz/verify?otp=1'), 'PHISHING');
});

test('brand pendek tidak salah cocok dengan kata lain (bridge ≠ bri)', () => {
  const r = analyzeLink('https://bridge-capital.com');
  assert.equal(r.riskLevel, 'AMAN');
  assert.ok(!r.findings.some((f) => f.rule === 'BRAND_IMPERSONATION'));
});

test('brand dipakai sebagai subdomain domain asing → terdeteksi', () => {
  const r = analyzeLink('https://bca.co.id.akun-aman.xyz/');
  assert.ok(r.findings.some((f) => f.rule === 'BRAND_IMPERSONATION'));
});

test('IP langsung tanpa HTTPS → CURIGA', () => {
  assert.equal(level('http://192.168.1.1/login'), 'CURIGA');
});

test('URL shortener minimal WASPADA', () => {
  assert.equal(level('https://bit.ly/abc123'), 'WASPADA');
});

test('huruf Cyrillic yang menyerupai latin (b\u0441a) terdeteksi sebagai homoglyph', () => {
  const r = analyzeLink('https://b\u0441a-login.top');
  assert.ok(r.findings.some((f) => f.rule === 'HOMOGLYPH'));
});

test('URL tidak valid → PHISHING dengan INVALID_URL', () => {
  const r = analyzeLink('http://');
  assert.equal(r.riskLevel, 'PHISHING');
  assert.equal(r.findings[0].rule, 'INVALID_URL');
});

test('keyword hanya dicek di path/query, bukan di nama domain', () => {
  const r = analyzeLink('https://login-kopi.com/menu');
  assert.ok(!r.findings.some((f) => f.rule === 'PHISH_KEYWORD'));
});
