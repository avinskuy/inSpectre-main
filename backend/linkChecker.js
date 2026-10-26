// linkChecker.js — analisis heuristik URL dengan alasan dan kontribusi skor yang dapat dijelaskan.
// Catatan: skor adalah indikator berbasis aturan, bukan probabilitas bahwa URL adalah phishing.

const MODEL_VERSION = '1.1.0';
const WHITELIST = [
  'google.com', 'facebook.com', 'instagram.com', 'whatsapp.com',
  'shopee.co.id', 'shopee.com', 'tokopedia.com', 'tokopedia.co.id',
  'bca.co.id', 'bri.co.id', 'mandiri.co.id', 'bni.co.id',
  'dana.co.id', 'ovo.id', 'jne.co.id', 'jnt.co.id', 'jet.co.id',
  'github.com', 'youtube.com', 'twitter.com', 'x.com',
  'gojek.com', 'grab.com', 'lazada.co.id', 'bukalapak.com',
];
const PHISH_KEYWORDS = [
  'login', 'verify', 'verifikasi', 'secure', 'account', 'update',
  'confirm', 'otp', 'kode', 'password', 'sandi', 'hadiah',
  'undian', 'menang', 'klaim', 'refund', 'penarikan', 'tarik-dana',
  'blokir', 'pemblokiran', 'rekber', 'freefire',
];
const RISKY_TLDS = ['tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'buzz', 'click'];
const BRANDS = [
  'bca', 'bri', 'mandiri', 'bni', 'dana', 'ovo', 'shopee', 'tokopedia',
  'jne', 'gopay', 'gojek', 'lazada', 'bukalapak', 'linkaja',
];
const SHORTENERS = ['bit.ly', 'tinyurl.com', 's.id', 'cutt.ly', 'shorturl.at', 't.co', 'is.gd'];

function isWhitelisted(host) {
  return WHITELIST.some((domain) => host === domain || host.endsWith('.' + domain));
}

function riskFromScore(score) {
  if (score >= 60) return 'PHISHING';
  if (score >= 35) return 'CURIGA';
  if (score >= 15) return 'WASPADA';
  return 'AMAN';
}

function makeFinding({ rule, risk, points, desc, evidence, whyItMatters, recommendation, category }) {
  return {
    rule, risk, points, desc, evidence,
    whyItMatters, recommendation, category,
  };
}

function analyzeLink(url) {
  const findings = [];
  let score = 0;
  const scannedAt = new Date().toISOString();
  const add = (finding) => {
    findings.push(makeFinding(finding));
    score += finding.points;
  };

  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('Unsupported URL');
  } catch (e) {
    const finding = makeFinding({
      rule: 'INVALID_URL', risk: 'TINGGI', points: 100,
      desc: 'URL tidak valid atau protokol tidak didukung',
      evidence: String(url || '(kosong)').slice(0, 180),
      whyItMatters: 'Sistem tidak dapat memeriksa alamat ini dengan benar. Skor 100 di sini menandai input yang tidak dapat dianalisis, bukan bukti bahwa situs tersebut phishing.',
      recommendation: 'Periksa kembali format URL. Gunakan alamat lengkap yang dimulai dengan http:// atau https://.',
      category: 'validasi',
    });
    return {
      url, riskLevel: 'PHISHING', threatScore: 100, findings: [finding], scannedAt,
      explanation: {
        modelVersion: MODEL_VERSION, method: 'heuristik berbasis aturan',
        scoreMeaning: 'Skor indikator 0–100; bukan probabilitas phishing.',
        assessment: 'INPUT_TIDAK_VALID', confidence: 'Tidak dapat dinilai',
        summary: 'Alamat tidak dapat dianalisis. Perbaiki URL sebelum mengambil keputusan keamanan.',
        positiveSignals: [], limitations: ['Karena URL tidak valid, reputasi dan konten situs tidak diperiksa.'],
      },
    };
  }

  const host = parsed.hostname.toLowerCase();
  const normalizedUrl = parsed.toString();
  if (isWhitelisted(host)) {
    return {
      url, normalizedUrl, riskLevel: 'AMAN', threatScore: 0, findings: [], scannedAt,
      explanation: {
        modelVersion: MODEL_VERSION, method: 'heuristik berbasis aturan',
        scoreMeaning: 'Skor indikator 0–100; bukan probabilitas phishing.',
        assessment: 'TIDAK_ADA_INDIKATOR_HEURISTIK', confidence: 'Terbatas',
        summary: `Domain ${host} cocok dengan daftar domain yang diizinkan. Ini bukan jaminan bahwa setiap halaman atau tautannya bebas risiko.`,
        positiveSignals: [{ label: 'Domain cocok dengan daftar izin', evidence: host }],
        limitations: ['Daftar izin tidak menggantikan pemeriksaan reputasi real-time.', 'URL redirect, konten halaman, dan file unduhan tidak diperiksa.'],
      },
    };
  }

  const tld = host.split('.').pop();
  if (RISKY_TLDS.includes(tld)) {
    add({ rule: 'RISKY_TLD', risk: 'TINGGI', points: 30, category: 'domain',
      desc: `Domain menggunakan akhiran .${tld} yang masuk daftar TLD berisiko pada aturan inSpectre`,
      evidence: `Hostname: ${host}; TLD: .${tld}`,
      whyItMatters: 'Sebagian kampanye penipuan menggunakan domain yang murah atau mudah didaftarkan. Namun TLD ini juga dapat digunakan untuk keperluan yang sah.',
      recommendation: 'Pastikan domain tercantum pada kanal resmi organisasi sebelum memasukkan data.' });
  }

  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    add({ rule: 'IP_HOST', risk: 'TINGGI', points: 25, category: 'domain',
      desc: 'Alamat menggunakan IP langsung, bukan nama domain', evidence: `Hostname: ${host}`,
      whyItMatters: 'Tautan berbahaya kadang memakai IP langsung agar domain lebih sulit dikenali; ini bukan bukti tunggal adanya penipuan.',
      recommendation: 'Jangan masukkan kredensial. Verifikasi identitas layanan melalui situs atau aplikasi resminya.' });
  }

  if (parsed.protocol !== 'https:') {
    add({ rule: 'NO_HTTPS', risk: 'SEDANG', points: 15, category: 'koneksi',
      desc: 'URL menggunakan HTTP, bukan HTTPS', evidence: `Protokol: ${parsed.protocol}`,
      whyItMatters: 'Koneksi HTTP tidak mengenkripsi komunikasi transport seperti HTTPS. Situs HTTP tidak otomatis phishing, tetapi berisiko saat bertukar data.',
      recommendation: 'Hindari mengirim kata sandi, OTP, atau data pribadi melalui halaman ini.' });
  }

  const labels = host.split(/[.\-]/).filter(Boolean);
  const brandHit = BRANDS.find((brand) => brand.length <= 4 ? labels.includes(brand) : labels.some((label) => label.includes(brand)));
  if (brandHit) {
    add({ rule: 'BRAND_IMPERSONATION', risk: 'TINGGI', points: 35, category: 'identitas domain',
      desc: `Nama brand "${brandHit}" muncul pada domain yang tidak cocok dengan daftar izin`,
      evidence: `Brand terdeteksi: ${brandHit}; hostname: ${host}`,
      whyItMatters: 'Penipu dapat menambahkan kata seperti login atau verifikasi pada domain yang bukan milik brand tersebut untuk membuatnya tampak resmi.',
      recommendation: 'Bandingkan domain dengan alamat resmi yang diketik sendiri atau dari aplikasi resmi. Jangan mengandalkan logo atau tampilan halaman.' });
  }

  const pathAndQuery = (parsed.pathname + parsed.search).toLowerCase();
  const hits = PHISH_KEYWORDS.filter((keyword) => pathAndQuery.includes(keyword));
  if (hits.length) {
    const points = Math.min(25, hits.length * 8);
    add({ rule: 'PHISH_KEYWORD', risk: 'SEDANG', points, category: 'pola URL',
      desc: `Kata yang sering muncul pada alur phishing ditemukan: ${hits.join(', ')}`,
      evidence: `Path/query: ${(parsed.pathname + parsed.search).slice(0, 180)}; kata cocok: ${hits.join(', ')}`,
      whyItMatters: 'Kata-kata ini juga dapat muncul pada halaman sah; nilainya meningkat karena digabungkan dengan indikator lain.',
      recommendation: 'Waspadai halaman yang meminta login, OTP, pembayaran, atau verifikasi setelah membuka tautan dari pesan.' });
  }

  if (host.split('.').length >= 5) {
    add({ rule: 'DEEP_SUBDOMAIN', risk: 'SEDANG', points: 10, category: 'domain',
      desc: 'Hostname memiliki banyak lapisan subdomain', evidence: `Hostname: ${host}; jumlah label: ${host.split('.').length}`,
      whyItMatters: 'Subdomain panjang dapat mengalihkan perhatian dari domain registrable yang sebenarnya, meskipun struktur ini juga memiliki penggunaan sah.',
      recommendation: 'Baca domain dari kanan ke kiri dan pastikan nama domain utama benar-benar milik layanan yang dimaksud.' });
  }

  if (host.includes('xn--') || /[^\x00-\x7F]/.test(host)) {
    add({ rule: 'HOMOGLYPH', risk: 'TINGGI', points: 20, category: 'identitas domain',
      desc: 'Hostname memakai punycode atau karakter non-ASCII yang dapat menyerupai huruf lain', evidence: `Hostname ter-normalisasi: ${host}`,
      whyItMatters: 'Karakter yang mirip secara visual dapat membuat domain tiruan tampak seperti domain resmi.',
      recommendation: 'Jangan percaya hanya dari tampilan teks. Buka situs resmi melalui bookmark atau ketik alamatnya secara manual.' });
  }

  if (SHORTENERS.includes(host)) {
    add({ rule: 'URL_SHORTENER', risk: 'SEDANG', points: 15, category: 'pengalihan',
      desc: 'URL menggunakan layanan pemendek tautan', evidence: `Hostname: ${host}`,
      whyItMatters: 'Tujuan akhir tidak terlihat dari URL pendek. Layanan pemendek juga memiliki penggunaan sah, jadi indikator ini perlu konteks.',
      recommendation: 'Konfirmasi pengirim dan tujuan tautan sebelum membukanya; jangan masukkan data sensitif pada halaman tujuan.' });
  }

  const threatScore = Math.min(100, score);
  const riskLevel = riskFromScore(threatScore);
  const limitations = [
    'Analisis ini menggunakan heuristik URL; bukan pemindaian isi halaman atau file yang diunduh.',
    'Tidak ada pemeriksaan reputasi real-time atau verifikasi pemilik domain pada hasil ini.',
    'Skor bukan probabilitas dan domain baru dapat belum memiliki indikator yang dikenali.',
  ];
  return {
    url, normalizedUrl, riskLevel, threatScore, findings, scannedAt,
    explanation: {
      modelVersion: MODEL_VERSION,
      method: 'heuristik berbasis aturan',
      scoreMeaning: 'Skor indikator 0–100; bukan probabilitas phishing. Nilai tiap aturan dijumlahkan lalu dibatasi maksimum 100.',
      assessment: findings.length ? 'INDIKATOR_DITEMUKAN' : 'TIDAK_ADA_INDIKATOR_HEURISTIK',
      confidence: findings.length >= 2 ? 'Perlu verifikasi' : 'Terbatas',
      summary: findings.length
        ? `${findings.length} indikator ditemukan dengan skor risiko ${threatScore}/100. Periksa bukti tiap indikator sebelum mengambil keputusan.`
        : 'Tidak ada indikator dari aturan yang aktif terdeteksi. Ini bukan jaminan URL aman.',
      positiveSignals: [],
      scoreBreakdown: findings.map(({ rule, points, risk, evidence }) => ({ rule, points, risk, evidence })),
      limitations,
    },
  };
}

function checkLink(url) {
  const result = analyzeLink(url);
  const { logScan } = require('./db'); // lazy: analyzeLink dapat diuji tanpa SQLite
  logScan('link', url, result.threatScore, result.riskLevel, result.findings);
  return result;
}

module.exports = { checkLink, analyzeLink, isWhitelisted, MODEL_VERSION };
