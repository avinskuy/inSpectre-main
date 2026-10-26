const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const { getStats, getRecentScans } = require('./db');
const { initSocket, emitThreat, emitStats } = require('./emitter');
const { checkLinkWithReputation } = require('./safeLinkChecker');
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

const assistantLimiter = rateLimit({ windowMs: 60_000, max: 10 });


app.post('/api/assistant', assistantLimiter, async (req, res) => {
  const question = req.body && req.body.question;

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Tulis pertanyaan terlebih dahulu.' });
  }
  if (question.length > 2000) {
    return res.status(400).json({ error: 'Pertanyaan maksimal 2000 karakter.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Asisten AI belum dikonfigurasi di server.' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3.5-lightning:free',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah AsistenAI inSpectre, pendamping keamanan digital berbahasa Indonesia. Jawab jelas, praktis, dan ringkas. Bantu mengenali phishing, penipuan, APK, QR, serta langkah pelaporan. Jangan pernah meminta atau mengulang OTP, PIN, kata sandi, atau data rahasia. Jangan mengklaim telah memindai atau memverifikasi sesuatu jika belum dilakukan. Jika ada dugaan penipuan, anjurkan verifikasi melalui kanal resmi. Berikan saran keselamatan, bukan jaminan bahwa tautan atau file aman.'
          },
          { role: 'user', content: question.trim() }
        ],
        max_tokens: 700,
        reasoning: { enabled: false }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error('OpenRouter API gagal dengan status HTTP', response.status);
      if (response.status === 429 || response.status === 402) {
        return res.status(503).json({ error: 'Batas penggunaan AI gratis tercapai. Coba lagi nanti.' });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({ error: 'OpenRouter menolak API key atau akses model. Periksa konfigurasi key di server.' });
      }
      return res.status(502).json({ error: 'Layanan AI sedang bermasalah. Coba lagi nanti.' });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return res.status(502).json({ error: 'AI belum memberikan jawaban teks. Coba lagi.' });
    }

    res.set('Cache-Control', 'no-store');
    return res.json({ answer: answer.trim() });
  } catch (error) {
    console.error('OpenRouter request gagal:', error.name || 'Error');
    return res.status(502).json({
      error: error.name === 'TimeoutError'
        ? 'AI terlalu lama merespons. Coba lagi.'
        : 'Tidak dapat menghubungi layanan AI saat ini.'
    });
  }
});

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

app.post('/api/scan', scanLimiter, async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Parameter "url" wajib diisi' });
  }
  if (url.length > 2048) {
    return res.status(400).json({ error: 'URL terlalu panjang (maks 2048 karakter)' });
  }

  const target = /^https?:\/\//i.test(url.trim())
    ? url.trim()
    : `https://${url.trim()}`;

  try {
    const result = await checkLinkWithReputation(target);
    emitThreat({ type: 'link', ...result });
    emitStats();
    res.set('Cache-Control', 'no-store');
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

server.listen(config.PORT, '127.0.0.1', () => {
  console.log(`🚀 inSpectre server berjalan di port ${config.PORT}`);
  if (config.TELEGRAM_TOKEN) {
    require('./bot');
    botActive = true;
  } else {
    console.warn('⚠️  TELEGRAM_TOKEN kosong — bot Telegram tidak dijalankan (API & dashboard tetap aktif).');
  }
});
