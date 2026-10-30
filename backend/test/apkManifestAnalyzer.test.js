'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseManifestOutput, evaluateApkManifest } = require('../apkManifestAnalyzer');

const sample = {
  badging: [
    "package: name='com.example.test' versionCode='12' versionName='1.2.0'",
    "sdkVersion:'23'",
    "targetSdkVersion:'35'",
    "application-label:'Test App'",
  ].join('\n'),

  permissions: [
    "uses-permission: name='android.permission.READ_SMS'",
    "uses-permission: name='android.permission.INTERNET'",
  ].join('\n'),

  xmltree: [
    'E: manifest',
    '  E: application',
    '    A: android:debuggable(0x0101000f)=(type 0x12)0xffffffff',
    '    A: android:allowBackup(0x01010280)=(type 0x12)0xffffffff',
    '    A: android:usesCleartextTraffic(0x010104ec)=(type 0x12)0xffffffff',
    '    E: activity',
    '      A: android:name(0x01010003)=".MainActivity"',
    '      A: android:exported(0x01010010)=(type 0x12)0xffffffff',
    '    E: service',
    '      A: android:name(0x01010003)=".SyncService"',
    '      A: android:exported(0x01010010)=(type 0x12)0x0',
  ].join('\n'),
};

test('membaca identitas dan versi APK', () => {
  const result = parseManifestOutput(sample);

  assert.equal(result.packageName, 'com.example.test');
  assert.equal(result.versionCode, '12');
  assert.equal(result.versionName, '1.2.0');
  assert.equal(result.label, 'Test App');
  assert.equal(result.minSdkVersion, '23');
  assert.equal(result.targetSdkVersion, '35');
});

test('membaca permission Android', () => {
  const result = parseManifestOutput(sample);

  assert.ok(result.permissions.includes('android.permission.READ_SMS'));
  assert.ok(result.permissions.includes('android.permission.INTERNET'));
});

test('membaca konfigurasi keamanan aplikasi', () => {
  const result = parseManifestOutput(sample);

  assert.equal(result.application.debuggable, true);
  assert.equal(result.application.allowBackup, true);
  assert.equal(result.application.usesCleartextTraffic, true);
});

test('membaca komponen dan status exported', () => {
  const result = parseManifestOutput(sample);

  assert.equal(result.components.length, 2);
  assert.equal(result.components[0].name, '.MainActivity');
  assert.equal(result.components[0].exported, true);
  assert.equal(result.components[1].name, '.SyncService');
  assert.equal(result.components[1].exported, false);
});

test('hasil kosong tidak mengarang identitas atau permission', () => {
  const result = parseManifestOutput({});

  assert.equal(result.packageName, null);
  assert.deepEqual(result.permissions, []);
  assert.deepEqual(result.components, []);
});


test('permission sensitif dicatat sebagai konteks, bukan bukti malware', () => {
  const result = evaluateApkManifest({
    permissions: ['android.permission.READ_SMS'],
    application: {},
    components: [],
  });

  assert.equal(result.threatScore, 0);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].rule, 'SENSITIVE_ANDROID_CAPABILITIES');
  assert.equal(result.findings[0].points, 0);
});

test('debuggable true menghasilkan indikator konfigurasi berisiko', () => {
  const result = evaluateApkManifest({
    permissions: [],
    application: { debuggable: true },
    components: [],
  });

  assert.equal(result.threatScore, 20);
  assert.equal(result.findings[0].rule, 'APPLICATION_DEBUGGABLE');
});

test('cleartext traffic menghasilkan indikator tanpa klaim penyalahgunaan', () => {
  const result = evaluateApkManifest({
    permissions: [],
    application: { usesCleartextTraffic: true },
    components: [],
  });

  assert.equal(result.threatScore, 10);
  assert.equal(result.findings[0].rule, 'CLEARTEXT_TRAFFIC_ENABLED');
  assert.match(result.findings[0].context, /tidak membuktikan/i);
});

test('allowBackup dan komponen exported tidak otomatis menaikkan skor', () => {
  const result = evaluateApkManifest({
    permissions: [],
    application: { allowBackup: true },
    components: [
      {
        type: 'activity',
        name: '.MainActivity',
        exported: true,
        permission: null,
      },
    ],
  });

  assert.equal(result.threatScore, 0);
  assert.ok(result.findings.some((item) => item.rule === 'APPLICATION_BACKUP_ENABLED'));
  assert.ok(result.findings.some((item) => item.rule === 'EXPORTED_COMPONENTS_UNPROTECTED'));
});
