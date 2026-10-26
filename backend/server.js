const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const { getStats, getRecentScans } = require('./db');
const { initSocket, emitThreat, emitStats } = require('./emitter');
const { checkLink } = require('./linkChecker');
const { checkNumber, isValidPhone } = require('./numberChecker');
const { getNews } = require('./news');
const { analyzeArchive } = require('./archiveScanner');

const app = express();
// Di container production, hanya reverse proxy internal yang boleh meneruskan client IP.
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
const server = http.createServer(app);
let botActive = false;

app.use(cors({ origin: config.CORS_ORIGINS }));
app.use(express.json({ limit: '10kb' }));

/* ─── Rate limit sederhana per IP (tanpa dependensi tambahan) ─── */
function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (now - h.start > windowMs) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const h = hits.get(req.ip);
    if (!h || now - h.start > windowMs) {
      hits.set(req.ip, { start: now, n: 1 });
      return next();
    }
    if (++h.n > max) {
      return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' });
    }
    next();
  };
}
const scanLimiter = rateLimit({ max: 30 });

app.get('/api/stats', (req, res) => {
  res.json(getStats());
});

app.get('/api/recent', (req, res) => {
  res.json(getRecentScans(20));
});

app.get('/api/news', async (req, res) => {
  try {
    const data = await getNews({ force: req.query.refresh === '1' });
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (e) {
    console.error('news error:', e.message);
    res.status(502).json({ articles: [], updatedAt: null, error: 'Berita belum dapat dimuat. Coba lagi beberapa saat.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', bot: botActive, uptime: process.uptime() });
});

app.get('/api/check/:nomor', scanLimiter, (req, res) => {
  const raw = req.params.nomor;
  if (!isValidPhone(raw)) {
    return res.status(400).json({ error: 'Nomor tidak valid. Gunakan format 08xx atau +62xx.' });
  }
  try {
    const result = checkNumber(raw);
    emitThreat({ type: 'scam_number', ...result });
    emitStats();
    res.json(result);
  } catch (e) {
    console.error('check error:', e.message);
    res.status(500).json({ error: 'Pengecekan gagal' });
  }
});

app.post('/api/scan-file', scanLimiter, express.raw({ type: 'application/octet-stream', limit: '25mb' }), (req, res) => {
  const filename = String(req.query.filename || 'upload.zip').slice(0, 180);
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: 'File kosong atau tidak terbaca.' });
  }
  if (req.body.length > 25 * 1024 * 1024) {
    return res.status(413).json({ error: 'Ukuran file melebihi batas 25 MB.' });
  }
  try {
    const result = analyzeArchive(req.body, filename);
    emitThreat({ type: 'apk', fileName: result.fileName, riskLevel: result.riskLevel, threatScore: result.threatScore, scannedAt: result.scannedAt });
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || 'File tidak dapat dianalisis.' });
  }
});

app.post('/api/scan', scanLimiter, (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Parameter "url" wajib diisi' });
  }
  if (url.length > 2048) {
    return res.status(400).json({ error: 'URL terlalu panjang (maks 2048 karakter)' });
  }

  const target = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

  try {
    const result = checkLink(target); // checkLink sudah mencatat ke log
    emitThreat({ type: 'link', ...result });
    emitStats();
    res.json(result);
  } catch (e) {
    console.error('scan error:', e.message);
    res.status(500).json({ error: 'Scan gagal' });
  }
});

initSocket(server);

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ Port ${config.PORT} sudah dipakai. Ubah PORT di .env atau matikan proses lain.`);
  } else {
    console.error('❌ Server error:', e.message);
  }
  process.exit(1);
});

server.listen(config.PORT, () => {
  console.log(`🚀 inSpectre server berjalan di port ${config.PORT}`);
  if (config.TELEGRAM_TOKEN) {
    require('./bot');
    botActive = true;
  } else {
    console.warn('⚠️  TELEGRAM_TOKEN kosong — bot Telegram tidak dijalankan (API & dashboard tetap aktif).');
  }
});
