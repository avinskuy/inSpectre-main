'use strict';

const { analyzeLink } = require('./linkChecker');
const { checkUrlReputation } = require('./safeBrowsing');
const { logScan } = require('./db');

async function checkLinkWithReputation(url) {
  const result = analyzeLink(url);
  const reputation = await checkUrlReputation(url);

  result.reputation = reputation;

  if (reputation.status === 'threat') {
    const threats = reputation.threats.join(', ');
    const finding = {
      rule: 'GOOGLE_SAFE_BROWSING',
      risk: 'TINGGI',
      points: 70,
      category: 'reputasi eksternal',
      desc: 'Google Safe Browsing melaporkan URL ini sebagai ancaman.',
      evidence: `Kategori ancaman: ${threats}`,
      whyItMatters: 'URL terdeteksi dalam daftar ancaman Google Safe Browsing.',
      recommendation: 'Jangan buka tautan atau masukkan informasi pribadi. Verifikasi melalui kanal resmi.'
    };

    result.findings = result.findings.filter(
      (item) => item.rule !== 'GOOGLE_SAFE_BROWSING'
    );
    result.findings.push(finding);

    const score = Math.min(
      100,
      Math.max(70, result.threatScore + finding.points)
    );

    result.threatScore = score;
    result.riskLevel = 'PHISHING';

    if (result.explanation) {
      result.explanation.assessment = 'ANCAMAN_REPUTASI_TERDETEKSI';
      result.explanation.summary =
        'Google Safe Browsing melaporkan URL ini sebagai ancaman. Hindari membuka tautan.';
      result.explanation.limitations = [
        ...(result.explanation.limitations || []),
        'Hasil reputasi berasal dari Google Safe Browsing; daftar ancaman dapat berubah.'
      ];
      result.explanation.scoreBreakdown = result.findings.map(
        ({ rule, points, risk, evidence }) => ({ rule, points, risk, evidence })
      );
    }
  } else if (result.explanation) {
    result.explanation.limitations = [
      ...(result.explanation.limitations || []),
      reputation.status === 'no_match'
        ? 'Google Safe Browsing tidak mengembalikan kecocokan ancaman untuk URL ini; ini bukan jaminan aman.'
        : 'Pemeriksaan reputasi Google Safe Browsing tidak tersedia; hasil hanya berdasarkan heuristik lokal.'
    ];
  }

  logScan('link', url, result.threatScore, result.riskLevel, result.findings);
  return result;
}

module.exports = { checkLinkWithReputation };
