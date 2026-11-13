// db.js — SQLite untuk log scan + statistik
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { publicIdentifier } = require('./privacy');

const DATA_DIR = process.env.INSPECTRE_DATA_DIR || path.resolve(__dirname, '../..');
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
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`);

const scanColumns = db.prepare('PRAGMA table_info(scans)').all().map((column) => column.name);
if (!scanColumns.includes('user_id')) {
  db.exec('ALTER TABLE scans ADD COLUMN user_id INTEGER REFERENCES users(id)');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id, id DESC)');

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
function logScan(type, identifier, threatScore, riskLevel, findings, userId = null) {
  db.prepare(
    `INSERT INTO scans (type, identifier, threatScore, riskLevel, findings, scannedAt, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    type,
    identifier,
    threatScore,
    riskLevel,
    JSON.stringify(findings || []),
    new Date().toISOString(),
    userId || null
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
function getRecentScans(limit = 20, userId) {
  if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) return [];
  return db.prepare(
    `SELECT type, identifier, threatScore, riskLevel, scannedAt
     FROM scans WHERE user_id = ? ORDER BY id DESC LIMIT ?`
  ).all(Number(userId), limit)
    .map((r) => ({ ...r, identifier: publicIdentifier(r.type, r.identifier) }));
}

function createUser({ email, displayName, passwordHash, role = 'user' }) {
  const result = db.prepare(
    `INSERT INTO users (email, display_name, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(email, displayName, passwordHash, role, new Date().toISOString());
  return getUserById(result.lastInsertRowid);
}
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email) || null;
}
function getUserById(id) {
  return db.prepare(
    'SELECT id, email, display_name AS displayName, role, created_at AS createdAt FROM users WHERE id = ?'
  ).get(id) || null;
}
function createSession(tokenHash, userId, expiresAt) {
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(tokenHash, userId, expiresAt, new Date().toISOString());
}
function getSessionUser(tokenHash, now = Date.now()) {
  return db.prepare(
    `SELECT u.id, u.email, u.display_name AS displayName, u.role,
            u.created_at AS createdAt, s.expires_at AS expiresAt
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  ).get(tokenHash, now) || null;
}
function deleteSession(tokenHash) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}
function deleteExpiredSessions(now = Date.now()) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
}

module.exports = { logScan, getStats, getRecentScans, getWhoTagCache, setWhoTagCache, clearWhoTagCache, createUser, getUserByEmail, getUserById, createSession, getSessionUser, deleteSession, deleteExpiredSessions };
