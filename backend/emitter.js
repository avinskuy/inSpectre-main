// emitter.js — Socket.IO untuk broadcast threat ke dashboard real-time
const { Server } = require('socket.io');
const config = require('./config');
const { maskNumber, publicUrl } = require('./privacy');

let io = null;

/* ─── Inisialisasi Socket.IO bersama HTTP server ─── */
function initSocket(server) {
  io = new Server(server, { cors: { origin: config.CORS_ORIGINS } });
  console.log('📡 Socket.IO siap menerima koneksi dashboard');
  return io;
}

/* ─── Samarkan data sensitif sebelum disiarkan ke semua client ─── */
function sanitize(report) {
  const out = { ...report };
  if (out.url) out.url = publicUrl(out.url);
  if (out.number) out.number = maskNumber(out.number);
  delete out.findings; // detail temuan tidak perlu disiarkan
  return out;
}

/* ─── Broadcast hasil scan ke semua client dashboard ─── */
function emitThreat(report) {
  if (!io) return; // bot bisa jalan tanpa dashboard (io belum init)
  const safe = sanitize(report);
  io.emit('new_threat', {
    ...safe,
    scannedAt: safe.scannedAt || new Date().toISOString(),
  });
  console.log(`[EMIT] ${safe.type} -> ${safe.riskLevel} (score ${safe.threatScore ?? 0})`);
}

/* ─── Broadcast statistik terbaru (dipanggil setelah emitThreat) ─── */
function emitStats() {
  if (!io) return;
  try {
    const { getStats } = require('./db');
    io.emit('stats_update', getStats());
  } catch (e) { /* abaikan jika db error */ }
}

module.exports = { initSocket, emitThreat, emitStats };
