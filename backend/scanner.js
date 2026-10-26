// scanner.js — analisis statis APK memakai aapt
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logScan } = require('./db');

/* ─── Jalankan command eksternal dengan timeout & output bersih ─── */
function run(cmd, args, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err && !stdout) return reject(err);
        resolve(stdout + '\n' + (stderr || ''));
      });
  });
}

/* ─── Cari aapt: AAPT_PATH → /usr/bin → build-tools terbaru di Android SDK ─── */
function findAapt() {
  const candidates = [process.env.AAPT_PATH, '/usr/bin/aapt', '/usr/bin/aapt2'];

  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk) {
    const root = path.join(sdk, 'build-tools');
    try {
      fs.readdirSync(root)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        .forEach((v) => candidates.push(path.join(root, v, 'aapt'), path.join(root, v, 'aapt.exe')));
    } catch (e) { /* SDK tidak punya build-tools */ }
  }

  return candidates.filter(Boolean).find((c) => fs.existsSync(c)) || null;
}

/* ─── Catat + kembalikan hasil untuk file yang tidak bisa dinilai ─── */
function invalid(fileName, score, finding) {
  logScan('apk', fileName, score, 'TIDAK_VALID', [finding]);
  return { fileName, riskLevel: 'TIDAK_VALID', threatScore: score, findings: [finding],
           scannedAt: new Date().toISOString() };
}

const DANGEROUS_PERMS = {
  'android.permission.SEND_SMS':        { pts: 10, desc: 'Mengirim SMS tanpa sepengetahuan (biasanya kirim ke nomor premium)' },
  'android.permission.RECEIVE_SMS':     { pts: 8,  desc: 'Membaca SMS masuk — bisa mencuri OTP' },
  'android.permission.READ_SMS':        { pts: 10, desc: 'Membaca seluruh isi SMS — sangat berbahaya' },
  'android.permission.READ_CONTACTS':   { pts: 5,  desc: 'Membaca kontak — potensi penyebaran ke kenalan' },
  'android.permission.CAMERA':          { pts: 5,  desc: 'Mengakses kamera' },
  'android.permission.RECORD_AUDIO':    { pts: 6,  desc: 'Merekam audio (mata-mata suara)' },
  'android.permission.ACCESS_FINE_LOCATION': { pts: 6, desc: 'Melacak lokasi presisi' },
  'android.permission.READ_CALL_LOG':   { pts: 8,  desc: 'Membaca riwayat panggilan' },
  'android.permission.CALL_PHONE':      { pts: 7,  desc: 'Bisa melakukan panggilan langsung' },
  'android.permission.SYSTEM_ALERT_WINDOW': { pts: 6, desc: 'Overlay layar — teknik phishing menyamar aplikasi resmi' },
  'android.permission.REQUEST_INSTALL_PACKAGES': { pts: 8, desc: 'Bisa menginstal APK lain — indikasi malware penyebar' },
  'android.permission.BIND_ACCESSIBILITY_SERVICE': { pts: 12, desc: 'Aksesibilitas penuh — bisa mencuri input/OTP di layar' },
};

const SUSPICIOUS_NAMES = ['mod', 'cheat', 'inject', 'crack', 'vip', 'hack', 'free'];
// Nama yang sering dipakai APK penipuan yang disebar lewat chat (bukan Play Store)
const SOCIAL_ENGINEERING_NAMES = ['undangan', 'tilang', 'resi', 'paket', 'bpjs', 'pajak', 'kurir', 'surat'];

async function analyzeApk(filePath, fileName) {
  const findings = [];
  let score = 0;

  if (!fs.existsSync(filePath)) {
    return invalid(fileName, 100,
      { rule: 'FILE_MISSING', risk: 'TINGGI', desc: 'File tidak ditemukan setelah diunduh' });
  }

  const aapt = findAapt();
  if (!aapt) {
    return invalid(fileName, 0,
      { rule: 'NO_AAPT', risk: 'RENDAH', desc: 'aapt tidak tersedia di server — scan dilewati' });
  }

  let aaptOut = '';
  try {
    aaptOut = await run(aapt, ['dump', 'badging', filePath]);
  } catch (err) {
    return invalid(fileName, 50,
      { rule: 'PARSE_FAIL', risk: 'SEDANG', desc: 'Gagal membaca manifest — kemungkinan file korup/bukan APK' });
  }

  /* Rule 1 — izin berbahaya */
  const perms = [...new Set(
    (aaptOut.match(/uses-permission[^\n]*/g) || [])
      .map((entry) => { const m = entry.match(/'([^']+)'/); return m ? m[1] : null; })
      .filter(Boolean)
  )];

  for (const p of perms) {
    if (DANGEROUS_PERMS[p]) {
      score += DANGEROUS_PERMS[p].pts;
      findings.push({ rule: 'DANGEROUS_PERM', risk: 'TINGGI', desc: DANGEROUS_PERMS[p].desc });
    }
  }

  /* Rule 2 — izin berlebihan */
  if (perms.length > 25) {
    score += 10;
    findings.push({ rule: 'PERM_BLOAT', risk: 'SEDANG', desc: `${perms.length} izin diminta — jumlah tidak wajar` });
  }

  /* Rule 3 — debuggable (aapt badging menampilkan "application-debuggable") */
  if (aaptOut.includes('application-debuggable')) {
    score += 5;
    findings.push({ rule: 'DEBUGGABLE', risk: 'SEDANG', desc: 'Aplikasi debuggable (bukan build release)' });
  }

  /* Rule 4 — pola mencurigakan di dalam binary.
     Catatan: isi APK itu ZIP terkompresi, jadi pencarian string mentah ini hanya menangkap
     sebagian kecil kasus. Untuk deteksi serius, ekstrak classes.dex lalu analisis stringnya. */
  try {
    const text = fs.readFileSync(filePath).toString('latin1');
    if (text.includes('http://')) {
      score += 5;
      findings.push({ rule: 'PLAINTEXT_HTTP', risk: 'SEDANG', desc: 'Mengandung koneksi HTTP plaintext (bukan HTTPS)' });
    }
    if (/\d{8,10}:AA[\w-]{30,}/.test(text)) {
      score += 15;
      findings.push({ rule: 'EMBEDDED_TOKEN', risk: 'TINGGI', desc: 'Menyimpan bot token Telegram di dalam APK — pola malware C2' });
    }
  } catch (e) { /* file terlalu besar untuk dibaca — lewati */ }

  /* Rule 5 — nama file mencurigakan (dipecah per kata agar "model.apk" tidak kena "mod") */
  const tokens = (fileName || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.some((t) => SUSPICIOUS_NAMES.includes(t))) {
    score += 10;
    findings.push({ rule: 'SUSPICIOUS_NAME', risk: 'SEDANG', desc: 'Nama file mengandung kata mod/cheat/crack/hack' });
  }
  if (tokens.some((t) => SOCIAL_ENGINEERING_NAMES.includes(t))) {
    score += 10;
    findings.push({ rule: 'SOCIAL_ENGINEERING_NAME', risk: 'SEDANG',
      desc: 'Nama file meniru undangan/paket/tilang/surat — modus APK penipuan yang umum di Indonesia' });
  }

  const threatScore = Math.min(100, score);
  let riskLevel = 'AMAN';
  if (threatScore >= 60) riskLevel = 'BAHAYA';
  else if (threatScore >= 35) riskLevel = 'CURIGA';
  else if (threatScore >= 15) riskLevel = 'WASPADA';

  logScan('apk', fileName, threatScore, riskLevel, findings);
  return { fileName, riskLevel, threatScore, findings, scannedAt: new Date().toISOString() };
}

/* ─── SCAN APK — file hasil unduhan SELALU dihapus, apa pun hasilnya ─── */
async function scanApk(filePath, fileName) {
  try {
    return await analyzeApk(filePath, fileName);
  } finally {
    try { fs.unlinkSync(filePath); } catch (e) { /* abaikan */ }
  }
}

module.exports = { scanApk };
