'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const MAX_APK_SIZE = 25 * 1024 * 1024;
const MAX_OUTPUT = 2 * 1024 * 1024;
const TIMEOUT_MS = 12000;

function parseQuotedValue(line) {
  const match = line?.match(/=\s*["']([^"']*)["']/);
  return match ? match[1] : null;
}

function parseBooleanValue(line) {
  if (!line) return null;

  if (/=\s*["']true["']/i.test(line)) return true;
  if (/=\s*["']false["']/i.test(line)) return false;

  const hex = line.match(/=\s*\(type 0x12\)\s*(0x[0-9a-f]+)/i);
  if (hex) return parseInt(hex[1], 16) !== 0;

  const decimal = line.match(/=\s*(?:0|1)\s*$/);
  if (decimal) return decimal[0].trim().endsWith('1');

  return null;
}

function parseManifestOutput({ badging = '', permissions = '', xmltree = '' }) {
  const packageMatch = badging.match(/package: name='([^']+)'/);
  const versionCodeMatch = badging.match(/versionCode='([^']*)'/);
  const versionNameMatch = badging.match(/versionName='([^']*)'/);
  const minSdkMatch = badging.match(/(?:sdkVersion|minSdkVersion):\s*'([^']+)'/);
  const targetSdkMatch = badging.match(/targetSdkVersion:\s*'([^']+)'/);
  const labelMatch = badging.match(/application-label:'([^']*)'/);

  const permissionSet = new Set();

  for (const line of `${permissions}\n${xmltree}`.split(/\r?\n/)) {
    if (!/uses-permission(?:-sdk-\d+)?\b/i.test(line) &&
        !/android\.permission\.[A-Z0-9_]+/i.test(line)) continue;

    const match = line.match(/android\.permission\.[A-Z0-9_]+/i);
    if (match) permissionSet.add(match[0]);
  }

  const components = [];
  let current = null;

  for (const line of xmltree.split(/\r?\n/)) {
    const element = line.match(/^\s*E:\s*(activity-alias|activity|service|receiver|provider)\b/);

    if (element) {
      if (current) components.push(current);
      current = {
        type: element[1],
        name: null,
        exported: null,
        permission: null,
      };
      continue;
    }

    if (!current || !/^\s*A:\s*android:/.test(line)) continue;

    if (/android:name(?:\([^)]*\))?=/.test(line)) {
      current.name = parseQuotedValue(line);
    } else if (/android:exported(?:\([^)]*\))?=/.test(line)) {
      current.exported = parseBooleanValue(line);
    } else if (/android:permission(?:\([^)]*\))?=/.test(line)) {
      current.permission = parseQuotedValue(line);
    }
  }

  if (current) components.push(current);

  const xmlLines = xmltree.split(/\r?\n/);
  const appIndex = xmlLines.findIndex((line) => /^\s*E:\s*application\b/.test(line));
  const appAttrs = [];

  if (appIndex >= 0) {
    for (let i = appIndex + 1; i < xmlLines.length; i++) {
      if (/^\s*E:/.test(xmlLines[i])) break;
      if (/^\s*A:/.test(xmlLines[i])) appAttrs.push(xmlLines[i]);
    }
  }

  const getAppBoolean = (name) => {
    const line = appAttrs.find((item) =>
      new RegExp(`android:${name}(?:\\([^)]*\\))?=`).test(item)
    );
    return parseBooleanValue(line);
  };

  return {
    packageName: packageMatch?.[1] || null,
    versionCode: versionCodeMatch?.[1] || null,
    versionName: versionNameMatch?.[1] || null,
    label: labelMatch?.[1] || null,
    minSdkVersion: minSdkMatch?.[1] || null,
    targetSdkVersion: targetSdkMatch?.[1] || null,
    permissions: [...permissionSet].sort(),
    application: {
      debuggable: getAppBoolean('debuggable'),
      allowBackup: getAppBoolean('allowBackup'),
      usesCleartextTraffic: getAppBoolean('usesCleartextTraffic'),
    },
    components,
  };
}

async function analyzeApkManifest(buffer, options = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    throw new Error('File APK kosong atau tidak valid.');
  }

  if (buffer.length > MAX_APK_SIZE) {
    throw new Error('Ukuran APK melebihi batas 25 MB.');
  }

  const aaptPath = options.aaptPath || process.env.AAPT_PATH || '/usr/bin/aapt';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'inspectre-apk-'));
  const apkPath = path.join(tempDir, 'sample.apk');

  const runAapt = async (args) => {
    const result = await execFileAsync(aaptPath, args, {
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT,
      windowsHide: true,
    });
    return result.stdout || '';
  };

  try {
    await fs.writeFile(apkPath, buffer, { mode: 0o600 });

    const [badging, permissions, xmltree] = await Promise.all([
      runAapt(['dump', 'badging', apkPath]),
      runAapt(['dump', 'permissions', apkPath]),
      runAapt(['dump', 'xmltree', apkPath, 'AndroidManifest.xml']),
    ]);

    const manifest = parseManifestOutput({ badging, permissions, xmltree });

    if (!manifest.packageName) {
      throw new Error('Identitas package APK tidak berhasil dibaca.');
    }

    return {
      status: 'ANALYZED',
      tool: 'aapt',
      manifest,
    };
  } catch (error) {
    return {
      status: 'UNAVAILABLE',
      tool: 'aapt',
      manifest: null,
      reason: error.killed
        ? 'AAPT_TIMEOUT'
        : error.code === 'ENOENT'
          ? 'AAPT_NOT_FOUND'
          : 'MANIFEST_PARSE_FAILED',
      message: error.message,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}


function evaluateApkManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Data Manifest APK tidak valid.');
  }

  const findings = [];
  let threatScore = 0;

  const add = (rule, severity, points, title, evidence, recommendation, context) => {
    findings.push({
      rule,
      severity,
      points,
      title,
      evidence,
      recommendation,
      context,
    });
    threatScore += points;
  };

  const app = manifest.application || {};

  if (app.debuggable === true) {
    add(
      'APPLICATION_DEBUGGABLE',
      'SEDANG',
      20,
      'Mode debugging aplikasi aktif',
      'AndroidManifest menetapkan android:debuggable=true.',
      'Hindari memasang versi debug untuk penggunaan sehari-hari. Gunakan rilis resmi dari pengembang.',
      'Mode debug dapat membuka kemampuan inspeksi aplikasi. Ini merupakan risiko konfigurasi, bukan bukti malware.'
    );
  }

  if (app.usesCleartextTraffic === true) {
    add(
      'CLEARTEXT_TRAFFIC_ENABLED',
      'SEDANG',
      10,
      'Komunikasi tanpa enkripsi diizinkan',
      'AndroidManifest menetapkan android:usesCleartextTraffic=true.',
      'Pastikan aplikasi menggunakan HTTPS dan verifikasi konfigurasi keamanan jaringan.',
      'Pengaturan ini mengizinkan trafik cleartext, tetapi tidak membuktikan bahwa aplikasi benar-benar mengirim data sensitif tanpa enkripsi.'
    );
  }

  if (app.allowBackup === true) {
    add(
      'APPLICATION_BACKUP_ENABLED',
      'INFO',
      0,
      'Fitur backup aplikasi diizinkan',
      'AndroidManifest menetapkan android:allowBackup=true.',
      'Tinjau aturan backup dan jenis data yang boleh dicadangkan.',
      'Dampaknya bergantung pada versi Android, aturan backup, dan implementasi aplikasi. Ini bukan bukti kebocoran data.'
    );
  }

  const sensitivePermissions = (manifest.permissions || []).filter((permission) =>
    /(?:READ_SMS|RECEIVE_SMS|SEND_SMS|READ_CALL_LOG|WRITE_CALL_LOG|READ_CONTACTS|RECORD_AUDIO|CAMERA|ACCESS_FINE_LOCATION|ACCESS_BACKGROUND_LOCATION|REQUEST_INSTALL_PACKAGES|SYSTEM_ALERT_WINDOW|BIND_ACCESSIBILITY_SERVICE|BIND_DEVICE_ADMIN)$/.test(permission)
  );

  if (sensitivePermissions.length) {
    add(
      'SENSITIVE_ANDROID_CAPABILITIES',
      'INFO',
      0,
      'Kapabilitas Android sensitif diminta',
      sensitivePermissions.join(', '),
      'Cocokkan setiap permission dengan fungsi aplikasi. Tolak aplikasi yang meminta akses tidak relevan.',
      'Permission menunjukkan kemampuan yang diminta, bukan bukti bahwa kemampuan tersebut disalahgunakan.'
    );
  }

  const exposed = (manifest.components || []).filter(
    (component) => component.exported === true
  );

  const unprotected = exposed.filter((component) => !component.permission);

  if (unprotected.length) {
    add(
      'EXPORTED_COMPONENTS_UNPROTECTED',
      'INFO',
      0,
      'Komponen aplikasi dapat diakses aplikasi lain',
      unprotected.slice(0, 10).map((component) =>
        `${component.type}: ${component.name || '(nama tidak terbaca)'}`
      ).join('; '),
      'Tinjau apakah setiap komponen memang perlu diekspos dan apakah akses perlu dibatasi dengan permission.',
      'Komponen exported dapat merupakan bagian normal dari aplikasi, misalnya activity peluncur. Status ini sendiri tidak membuktikan celah keamanan.'
    );
  }

  return {
    threatScore: Math.min(100, threatScore),
    findings,
    summary: findings.length
      ? `${findings.length} indikator konfigurasi atau kapabilitas Manifest ditemukan.`
      : 'Tidak ditemukan indikator dari aturan Manifest yang diperiksa.',
  };
}

module.exports = {
  analyzeApkManifest,
  parseManifestOutput,
  evaluateApkManifest,
};
