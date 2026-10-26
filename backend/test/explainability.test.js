// Pengujian kontrak Explainable Threat Detection: hasil harus menjelaskan indikator, bukti, dan saran.
const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeLink, MODEL_VERSION } = require('../linkChecker');

test('hasil analisis menyediakan metadata metode dan keterbatasan', () => {
  const result = analyzeLink('https://example.org/about');
  assert.equal(result.explanation.modelVersion, MODEL_VERSION);
  assert.match(result.explanation.method, /heuristik/);
  assert.match(result.explanation.scoreMeaning, /bukan probabilitas/i);
  assert.ok(Array.isArray(result.explanation.limitations));
  assert.ok(result.explanation.limitations.length > 0);
});

test('setiap indikator terdeteksi memiliki poin, bukti, alasan, dan rekomendasi', () => {
  const result = analyzeLink('http://bca-login-verifikasi.xyz/otp');
  assert.equal(result.riskLevel, 'PHISHING');
  assert.ok(result.findings.length >= 3);
  for (const finding of result.findings) {
    assert.equal(typeof finding.points, 'number', `${finding.rule} harus punya points`);
    assert.ok(finding.points > 0, `${finding.rule} harus punya poin positif`);
    assert.ok(finding.evidence, `${finding.rule} harus punya bukti`);
    assert.ok(finding.whyItMatters, `${finding.rule} harus menjelaskan dampak`);
    assert.ok(finding.recommendation, `${finding.rule} harus punya rekomendasi`);
    assert.ok(finding.category, `${finding.rule} harus punya kategori`);
  }
  assert.equal(result.explanation.scoreBreakdown.length, result.findings.length);
});

test('skor risiko adalah penjumlahan poin indikator dengan batas 100', () => {
  const result = analyzeLink('http://bca-login-verifikasi.xyz/otp');
  const sum = result.findings.reduce((total, finding) => total + finding.points, 0);
  assert.equal(result.threatScore, Math.min(100, sum));
  assert.ok(result.threatScore >= 0 && result.threatScore <= 100);
});

test('domain allowlist menjelaskan sinyal positif tanpa menjanjikan keamanan mutlak', () => {
  const result = analyzeLink('https://www.google.com/search?q=login');
  assert.equal(result.threatScore, 0);
  assert.equal(result.explanation.positiveSignals.length, 1);
  assert.match(result.explanation.summary, /bukan jaminan/i);
  assert.ok(result.explanation.limitations.length > 0);
});

test('URL invalid menjelaskan bahwa skor bukan bukti phishing', () => {
  const result = analyzeLink('http://');
  assert.equal(result.explanation.assessment, 'INPUT_TIDAK_VALID');
  assert.match(result.findings[0].whyItMatters, /bukan bukti/i);
  assert.ok(result.findings[0].recommendation);
});

test('URL tanpa indikator tetap menyatakan hasil bukan jaminan aman', () => {
  const result = analyzeLink('https://example.org/about');
  assert.equal(result.riskLevel, 'AMAN');
  assert.equal(result.threatScore, 0);
  assert.match(result.explanation.summary, /bukan jaminan/i);
});
