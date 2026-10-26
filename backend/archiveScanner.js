'use strict';
const zlib = require('node:zlib');

const MAX_ENTRIES = 5000;
const MAX_TOTAL_UNCOMPRESSED = 150 * 1024 * 1024;
const MAX_TEXT_ENTRY = 2 * 1024 * 1024;
const MAX_TEXT_TOTAL = 8 * 1024 * 1024;
const TEXT_EXT = /\.(?:xml|json|txt|js|html?|properties|cfg|ini|smali|yml|yaml)$/i;
const DANGEROUS_EXT = /\.(?:exe|dll|scr|bat|cmd|ps1|vbs|msi|com|hta|jar)$/i;
const NESTED_ARCHIVE = /\.(?:zip|rar|7z|apk|dex|jar)$/i;

function finding(rule, risk, points, title, evidence, recommendation, detail) {
  return { rule, risk, points, title, evidence, recommendation, detail };
}

function findEocd(buf) {
  if (buf.length < 22) return -1;
  const min = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
}

function parseCentralDirectory(buf) {
  const eocd = findEocd(buf);
  if (eocd < 0) throw new Error('Format ZIP tidak valid atau tidak didukung.');
  const disk = buf.readUInt16LE(eocd + 4);
  const centralDisk = buf.readUInt16LE(eocd + 6);
  const entries = buf.readUInt16LE(eocd + 10);
  const centralSize = buf.readUInt32LE(eocd + 12);
  const centralOffset = buf.readUInt32LE(eocd + 16);
  if (disk !== 0 || centralDisk !== 0 || entries === 0xffff || centralOffset === 0xffffffff) {
    throw new Error('ZIP multi-disk atau ZIP64 belum didukung demi pemeriksaan yang aman.');
  }
  if (entries > MAX_ENTRIES) throw new Error(`Arsip memiliki terlalu banyak entri (maksimum ${MAX_ENTRIES}).`);
  if (centralOffset + centralSize > buf.length || centralOffset > eocd) throw new Error('Struktur direktori ZIP tidak valid.');

  const out = [];
  let p = centralOffset;
  let total = 0;
  for (let i = 0; i < entries; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Entri direktori ZIP tidak valid.');
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const uncompressedSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const end = p + 46 + nameLen + extraLen + commentLen;
    if (end > buf.length) throw new Error('Nama atau metadata entri ZIP terpotong.');
    const nameBytes = buf.subarray(p + 46, p + 46 + nameLen);
    const name = nameBytes.toString((flags & 0x800) ? 'utf8' : 'latin1').replace(/\\/g, '/');
    total += uncompressedSize;
    if (total > MAX_TOTAL_UNCOMPRESSED) throw new Error('Ukuran total hasil ekstraksi terlalu besar (maksimum 150 MB).');
    out.push({ name, flags, method, compressedSize, uncompressedSize, localOffset });
    p = end;
  }
  return out;
}

function readEntry(buf, entry) {
  if (entry.flags & 1) throw new Error('Entri terenkripsi tidak dapat diperiksa.');
  if (![0, 8].includes(entry.method)) return null;
  const p = entry.localOffset;
  if (p + 30 > buf.length || buf.readUInt32LE(p) !== 0x04034b50) return null;
  const nameLen = buf.readUInt16LE(p + 26);
  const extraLen = buf.readUInt16LE(p + 28);
  const start = p + 30 + nameLen + extraLen;
  const end = start + entry.compressedSize;
  if (end > buf.length || entry.uncompressedSize > MAX_TEXT_ENTRY) return null;
  if (entry.compressedSize === 0 && entry.uncompressedSize > 0) return null;
  if (entry.compressedSize > 0 && entry.uncompressedSize / entry.compressedSize > 500) return null;
  const compressed = buf.subarray(start, end);
  try {
    const data = entry.method === 0 ? Buffer.from(compressed) : zlib.inflateRawSync(compressed, { maxOutputLength: MAX_TEXT_ENTRY });
    return data.length <= MAX_TEXT_ENTRY ? data : null;
  } catch { return null; }
}

function analyzeArchive(buffer, filename = 'upload.zip') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) throw new Error('File kosong atau tidak valid.');
  if (buffer.length > 25 * 1024 * 1024) throw new Error('Ukuran file melebihi batas 25 MB.');
  const ext = String(filename).toLowerCase().split('.').pop();
  if (!['apk', 'zip'].includes(ext)) throw new Error('Format tidak didukung. Unggah file .apk atau .zip.');
  if (buffer.readUInt32LE(0) !== 0x04034b50 && buffer.readUInt32LE(0) !== 0x06054b50) throw new Error('File bukan arsip ZIP/APK yang valid.');

  const entries = parseCentralDirectory(buffer);
  const isApk = ext === 'apk';
  const findings = [];
  let score = 0;
  const add = (f) => { findings.push(f); score = Math.min(100, score + f.points); };
  const names = entries.map((e) => e.name);

  if (isApk && !names.some((n) => n === 'AndroidManifest.xml')) {
    add(finding('APK_MANIFEST_MISSING', 'TINGGI', 30, 'AndroidManifest.xml tidak ditemukan', 'Arsip berekstensi APK tidak memiliki AndroidManifest.xml pada lokasi standar.', 'Pastikan file berasal dari pengembang resmi. File ini mungkin bukan APK standar atau strukturnya tidak lengkap.', 'Struktur APK tidak sesuai pola umum. Ini bukan bukti tunggal malware.'));
  }

  for (const name of names) {
    if (/(^|\/)\.\.($|\/)/.test(name) || name.startsWith('/')) {
      add(finding('PATH_TRAVERSAL', 'TINGGI', 40, 'Jalur file mencurigakan', name.slice(0, 180), 'Jangan ekstrak arsip ini pada perangkat utama. Jalur relatif yang keluar dari folder tujuan dapat menimpa file jika ditangani oleh ekstraktor yang rentan.', 'Nama entri berisi jalur absolut atau segmen traversal.'));
      break;
    }
  }

  const executable = names.filter((n) => DANGEROUS_EXT.test(n));
  if (executable.length) add(finding('EXECUTABLE_IN_ARCHIVE', 'TINGGI', 25, 'Arsip berisi file executable/script', executable.slice(0, 5).join(', '), 'Jangan jalankan file tersebut. Verifikasi sumber dan pindai dengan antivirus tepercaya.', 'Ekstensi executable dapat memiliki penggunaan sah, tetapi meningkatkan risiko bila tidak diharapkan.'));

  const doubleExt = names.filter((n) => /\.(?:pdf|jpg|jpeg|png|doc|docx)\.(?:apk|exe|scr|js|bat)$/i.test(n));
  if (doubleExt.length) add(finding('DOUBLE_EXTENSION', 'SEDANG', 15, 'Nama file memakai ekstensi ganda yang menyesatkan', doubleExt.slice(0, 5).join(', '), 'Aktifkan tampilan ekstensi file dan jangan buka file yang jenis aslinya tidak sesuai dengan klaim pengirim.', 'Ekstensi ganda sering dipakai untuk menyamarkan tipe file.'));

  const nested = names.filter((n) => NESTED_ARCHIVE.test(n));
  if (nested.length) add(finding('NESTED_ARCHIVE', 'SEDANG', 10, 'Arsip berisi file arsip atau paket lain', nested.slice(0, 5).join(', '), 'Periksa paket bersarang secara terpisah sebelum membukanya.', 'Paket bertingkat dapat menyembunyikan file tambahan yang belum diperiksa.'));

  const suspiciousNames = names.filter((n) => /(?:payload|keylog|stealer|credential|password_dump|inject|rat_client)/i.test(n));
  if (suspiciousNames.length) add(finding('SUSPICIOUS_FILENAME', 'TINGGI', 25, 'Nama file memuat istilah berisiko', suspiciousNames.slice(0, 5).join(', '), 'Jangan jalankan atau instal paket ini. Verifikasi asal file melalui kanal resmi.', 'Nama file mencurigakan merupakan sinyal lemah dan perlu konteks.'));

  let textBudget = 0;
  const textChunks = [];
  for (const entry of entries) {
    if (!TEXT_EXT.test(entry.name) || entry.uncompressedSize > MAX_TEXT_ENTRY) continue;
    if (textBudget >= MAX_TEXT_TOTAL) break;
    const content = readEntry(buffer, entry);
    if (!content) continue;
    const chunk = content.subarray(0, Math.min(content.length, MAX_TEXT_TOTAL - textBudget)).toString('utf8');
    textChunks.push({ name: entry.name, text: chunk });
    textBudget += Buffer.byteLength(chunk);
  }
  const text = textChunks.map((x) => x.text).join('\n').slice(0, MAX_TEXT_TOTAL);
  if (isApk) {
    const permissionPatterns = [
      ['READ_SMS', /android\.permission\.READ_SMS/i, 20],
      ['RECEIVE_SMS', /android\.permission\.RECEIVE_SMS/i, 20],
      ['READ_CALL_LOG', /android\.permission\.READ_CALL_LOG/i, 15],
      ['REQUEST_INSTALL_PACKAGES', /android\.permission\.REQUEST_INSTALL_PACKAGES/i, 10],
      ['SYSTEM_ALERT_WINDOW', /android\.permission\.SYSTEM_ALERT_WINDOW/i, 10],
      ['BIND_ACCESSIBILITY_SERVICE', /android\.accessibilityservice|BIND_ACCESSIBILITY_SERVICE/i, 15],
      ['BIND_DEVICE_ADMIN', /BIND_DEVICE_ADMIN/i, 15],
    ];
    const matched = permissionPatterns.filter(([, re]) => re.test(text));
    if (matched.length) add(finding('SENSITIVE_ANDROID_CAPABILITIES', 'SEDANG', Math.min(35, matched.reduce((s, x) => s + x[2], 0)), 'Indikasi kapabilitas Android sensitif ditemukan', matched.map((x) => x[0]).join(', '), 'Bandingkan izin dengan fungsi aplikasi. Jangan instal APK dari pesan atau situs yang tidak dipercaya.', 'Kapabilitas ini dapat digunakan secara sah, tetapi perlu alasan yang jelas. Pemeriksaan teks statis mungkin melewatkan izin pada manifest biner.'));
    if (/(?:Runtime\.getRuntime\(\)\.exec|DexClassLoader|loadLibrary\(|\/proc\/self\/maps|su\s+-c)/i.test(text)) {
      add(finding('DYNAMIC_OR_SYSTEM_EXECUTION', 'SEDANG', 15, 'Pola eksekusi dinamis atau akses sistem ditemukan', 'Pola string terkait eksekusi dinamis terdeteksi pada file teks yang dapat dibaca.', 'Instal hanya aplikasi dari sumber tepercaya dan tinjau reputasi pengembang.', 'Pola ini dapat muncul pada aplikasi sah dan tidak membuktikan perilaku berbahaya.'));
    }
  } else if (/(?:powershell\s+-enc|cmd\.exe\s+\/c|wscript\.shell|certutil\s+-urlcache|invoke-expression)/i.test(text)) {
    add(finding('SCRIPT_EXECUTION_PATTERN', 'SEDANG', 20, 'Pola perintah/script berisiko ditemukan', 'Konten teks arsip memuat pola perintah yang dapat digunakan untuk menjalankan skrip atau mengunduh file.', 'Jangan jalankan skrip dari sumber tidak dikenal; periksa isi dan asal arsip terlebih dahulu.', 'Pola teks adalah sinyal statis dan bisa memiliki penggunaan sah.'));
  }

  const oversized = entries.filter((e) => e.compressedSize > 0 && e.uncompressedSize / e.compressedSize > 100);
  if (oversized.length) add(finding('HIGH_COMPRESSION_RATIO', 'SEDANG', 20, 'Rasio kompresi sangat tinggi', oversized.slice(0, 3).map((e) => `${e.name} (${Math.round(e.uncompressedSize / e.compressedSize)}:1)`).join(', '), 'Jangan ekstrak pada perangkat dengan sumber daya terbatas. Gunakan alat yang memiliki batas ekstraksi.', 'Rasio tinggi dapat menunjukkan data sangat repetitif atau arsip yang berpotensi menghabiskan sumber daya.'));

  const threatScore = Math.min(100, score);
  const riskLevel = threatScore >= 60 ? 'PHISHING' : threatScore >= 35 ? 'CURIGA' : threatScore >= 15 ? 'WASPADA' : 'AMAN';
  return {
    fileName: String(filename).replace(/[\\/]/g, '').slice(0, 120),
    fileType: isApk ? 'APK Android' : 'Arsip ZIP',
    fileSize: buffer.length,
    entriesScanned: entries.length,
    scannedAt: new Date().toISOString(),
    riskLevel,
    threatScore,
    findings,
    explanation: {
      method: 'Pemeriksaan statis struktur arsip dan string yang dapat dibaca',
      scoreMeaning: 'Skor indikator 0–100, bukan probabilitas malware. Skor dibatasi maksimum 100.',
      summary: findings.length ? `${findings.length} indikator statis ditemukan. Tinjau tiap bukti sebelum mengambil keputusan.` : 'Tidak ada indikator dari aturan statis yang aktif terdeteksi. Ini bukan jaminan file aman.',
      limitations: [
        'File tidak dieksekusi, tidak diinstal, dan tidak diekstrak ke disk oleh pemindai ini.',
        'Bukan antivirus dan tidak memeriksa seluruh bytecode, tanda tangan digital, atau perilaku runtime.',
        'Manifest APK biner tidak diurai penuh; beberapa izin atau indikator dapat terlewat.',
        'File terenkripsi, ZIP64, atau format kompresi yang tidak didukung mungkin tidak dapat diperiksa.',
      ],
    },
  };
}

module.exports = { analyzeArchive, parseCentralDirectory };
