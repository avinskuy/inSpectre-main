// numberChecker.js — cek & lapor nomor scam berbasis laporan warga
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logScan } = require('./db');

const NUMBERS_FILE = process.env.INSPECTRE_NUMBERS_FILE || path.join(process.env.INSPECTRE_DATA_DIR || __dirname, 'numbers.json');
fs.mkdirSync(path.dirname(NUMBERS_FILE), { recursive: true });
const REPORTS_NEEDED = 3; // jumlah laporan unik minimum sebelum dianggap CURIGA

/* ─── Validasi nomor HP Indonesia (08xx / +62xx / 62xx) ─── */
function isValidPhone(raw) {
  const clean = String(raw).replace(/[\s\-().]/g, '');
  return /^(\+62|62|0)8\d{7,12}$/.test(clean);
}

/* ─── Baca database laporan warga (JSON sederhana) ─── */
function loadReports() {
  try {
    return JSON.parse(fs.readFileSync(NUMBERS_FILE, 'utf8'));
  } catch (e) {
    return { reports: {} };
  }
}

/* ─── Simpan atomik (tulis file sementara lalu rename → tidak korup jika proses mati) ─── */
function saveReports(data) {
  const tmp = NUMBERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, NUMBERS_FILE);
}

/* ─── Normalisasi nomor Indonesia: 08xxx / +62xxx / 628xxx → 628xxx ─── */
function normalizeNumber(raw) {
  const n = String(raw).replace(/[\s\-().]/g, '');
  if (n.startsWith('+62')) return '62' + n.slice(3);
  if (n.startsWith('0')) return '62' + n.slice(1);
  return n;
}

/* ─── Pelapor disimpan sebagai hash singkat, bukan ID Telegram asli ─── */
function hashReporter(id) {
  return crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 16);
}

/* ─── CEK NOMOR ─── */
function checkNumber(raw) {
  const norm = normalizeNumber(raw);
  const data = loadReports();
  const record = data.reports[norm];
  const count = record ? record.count : 0;

  let threatScore = Math.min(100, count * 20);
  let riskLevel = 'BELUM_DIKETAHUI';
  if (count >= REPORTS_NEEDED * 2) {
    riskLevel = 'BAHAYA';
    threatScore = Math.max(threatScore, 80);
  } else if (count >= REPORTS_NEEDED) {
    riskLevel = 'CURIGA';
    threatScore = Math.max(threatScore, 60);
  } else if (count >= 1) {
    riskLevel = 'WASPADA';
    threatScore = Math.max(threatScore, 20);
  }

  const findings = count > 0
    ? [{ rule: 'CROWD_REPORTS', risk: count >= REPORTS_NEEDED ? 'TINGGI' : 'SEDANG',
         desc: `${count} laporan dari warga terkait nomor ini` }]
    : [];

  const note = count > 0
    ? `⚠️ Ada ${count} laporan warga untuk nomor ini. JANGAN transfer uang atau berikan OTP!`
    : 'ℹ️ Belum ada laporan warga untuk nomor ini. Ini bukan bukti bahwa nomor tersebut aman.';

  logScan('scam_number', norm, threatScore, riskLevel, findings);

  return { number: norm, riskLevel, threatScore, note, findings,
           scannedAt: new Date().toISOString() };
}

/* ─── LAPOR NOMOR — satu pelapor hanya dihitung sekali per nomor (cegah spam/fitnah) ─── */
function reportNumber(raw, reporterId) {
  const norm = normalizeNumber(raw);
  const data = loadReports();
  const now = new Date().toISOString();

  const rec = data.reports[norm] || { count: 0, reporters: [], firstReport: now };
  rec.reporters = rec.reporters || [];

  let duplicate = false;
  if (reporterId !== undefined && reporterId !== null) {
    const h = hashReporter(reporterId);
    if (rec.reporters.includes(h)) {
      duplicate = true;
    } else {
      rec.reporters.push(h);
      rec.count += 1;
    }
  } else {
    rec.count += 1;
  }

  if (!duplicate) {
    rec.lastReport = now;
    data.reports[norm] = rec;
    saveReports(data);
  }
  return { number: norm, count: rec.count, duplicate };
}

module.exports = { checkNumber, reportNumber, normalizeNumber, isValidPhone };
