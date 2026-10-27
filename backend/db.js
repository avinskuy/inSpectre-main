// db.js — SQLite untuk log scan + statistik
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { publicIdentifier } = require('./privacy');

const DATA_DIR = process.env.INSPECTRE_DATA_DIR || __dirname;
fs.mkdirSync(DATA_DIR, { recursive: true });
const NUMBERS_FILE = process.env.INSPECTRE_NUMBERS_FILE || path.join(DATA_DIR, 'numbers.json');
const DB_FILE = process.env.INSPECTRE_DB_PATH || path.join(DATA_DIR, 'inspectre.db');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    identifier TEXT NOT NULL,
    threatScore INTEGER NOT NULL,
    riskLevel TEXT NOT NULL,
    findings TEXT,
    scannedAt TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS whotag_cache (
    phone TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    cachedAt INTEGER NOT NULL
  );
`);

/* ─── Cache reputasi WhoTag.me ─── */
function getWhoTagCache(phone) {
  const row = db.prepare(
    'SELECT value, cachedAt FROM whotag_cache WHERE phone = ?'
  ).get(phone);
  if (!row) return null;
  try {
    return { value: JSON.parse(row.value), cachedAt: row.cachedAt };
  } catch {
    db.prepare('DELETE FROM whotag_cache WHERE phone = ?').run(phone);
    return null;
  }
}

function setWhoTagCache(phone, value, cachedAt) {
  db.prepare(`
    INSERT INTO whotag_cache (phone, value, cachedAt)
    VALUES (?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET
      value = excluded.value,
      cachedAt = excluded.cachedAt
  `).run(phone, JSON.stringify(value), cachedAt);
  // Pembersihan terbatas: hapus entri lama lebih dari 7 hari.
  db.prepare('DELETE FROM whotag_cache WHERE cachedAt < ?')
    .run(cachedAt - 7 * 24 * 60 * 60 * 1000);
}

function clearWhoTagCache(phone) {
  if (phone) {
    db.prepare('DELETE FROM whotag_cache WHERE phone = ?').run(phone);
  } else {
    db.prepare('DELETE FROM whotag_cache').run();
  }
}

/* ─── Simpan hasil scan ke log ─── */
function logScan(type, identifier, threatScore, riskLevel, findings) {
  db.prepare(
    `INSERT INTO scans (type, identifier, threatScore, riskLevel, findings, scannedAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    type,
    identifier,
    threatScore,
    riskLevel,
    JSON.stringify(findings || []),
    new Date().toISOString()
  );
}

/* ─── Statistik untuk /stats dan dashboard ─── */
function getStats() {
  const count = (where) =>
    db.prepare(`SELECT COUNT(*) AS c FROM scans ${where}`).get().c;

  const total = count('');
  const bahaya = count(`WHERE riskLevel IN ('BAHAYA','PHISHING')`);
  const curiga = count(`WHERE riskLevel IN ('CURIGA','WASPADA')`);
  const aman = count(`WHERE riskLevel = 'AMAN'`);

  let reports = 0;
  try {
    const data = JSON.parse(fs.readFileSync(NUMBERS_FILE, 'utf8'));
    reports = Object.values(data.reports || {}).reduce((s, r) => s + (r.count || 0), 0);
  } catch (e) {
    // numbers.json belum ada — abaikan
  }

  return { total, bahaya, curiga, aman, reports };
}

/* ─── Riwayat scan terbaru (identifier sudah disamarkan: nomor di-mask, query URL dibuang) ─── */
function getRecentScans(limit = 20) {
  return db
    .prepare(
      `SELECT type, identifier, threatScore, riskLevel, scannedAt
       FROM scans ORDER BY id DESC LIMIT ?`
    )
    .all(limit)
    .map((r) => ({ ...r, identifier: publicIdentifier(r.type, r.identifier) }));
}

module.exports = { logScan, getStats, getRecentScans, getWhoTagCache, setWhoTagCache, clearWhoTagCache };
