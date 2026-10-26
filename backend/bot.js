// bot.js — Telegram bot inSpectre
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { scanApk } = require('./scanner');
const { checkLink } = require('./linkChecker');
const { checkNumber, reportNumber, isValidPhone } = require('./numberChecker');
const { getStats } = require('./db');
const { emitThreat, emitStats } = require('./emitter');

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const MAX_APK_SIZE = 20 * 1024 * 1024; // 20MB — batas download Bot API Telegram

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const bot = new TelegramBot(config.TELEGRAM_TOKEN, { polling: true });
const HTML = { parse_mode: 'HTML' };

/* ─── Helper: escape HTML (wajib karena parse_mode HTML) ─── */
function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ─── Helper: ambil URL dari teks bebas, atau domain polos seperti "bca-login.xyz/verif" ─── */
function extractUrl(text) {
  const full = text.match(/https?:\/\/[^\s]+/i);
  if (full) return full[0].replace(/[.,;:!?)\]]+$/, '');
  const bare = text.match(/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]\S*)?$/i);
  return bare ? `https://${bare[0]}` : null;
}

const NUMBER_ICON = { BAHAYA: '🚨', CURIGA: '⚠️', WASPADA: '⚠️', AMAN: '✅' };
const LINK_ICON = { PHISHING: '🎣', CURIGA: '⚠️', WASPADA: '⚠️', AMAN: '✅' };
const APK_ICON = { BAHAYA: '🚨', CURIGA: '⚠️', WASPADA: '⚠️', AMAN: '✅', TIDAK_VALID: '❓' };

/* ─── /start ─── */
bot.onText(/^\/start(?:@\w+)?$/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🛡️ <b>Selamat datang di inSpectre — Sentinel Digital!</b>\n\n` +
    `Saya membantu Anda memeriksa:\n` +
    `📱 Nomor HP — apakah tercatat scam\n` +
    `🔗 Link/URL — apakah phishing\n` +
    `📦 File APK — apakah mengandung kode berbahaya\n\n` +
    `Perintah:\n` +
    `/cek 08xxxxxxx — cek nomor\n` +
    `/lapor 08xxxxxxx — lapor nomor scam\n` +
    `/stats — statistik bot\n` +
    `/help — panduan\n\n` +
    `Atau langsung kirim file APK / link di chat ini.`,
    HTML
  );
});

/* ─── /help ─── */
bot.onText(/^\/help(?:@\w+)?$/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🛡️ <b>Panduan inSpectre</b>\n\n` +
    `/start — mulai\n` +
    `/cek 08xxx — cek nomor scam\n` +
    `/lapor 08xxx — lapor nomor scam\n` +
    `/stats — statistik bot\n\n` +
    `Kirim file APK (maks 20MB) langsung ke chat ini untuk di-scan.\n` +
    `Kirim link/URL (boleh di tengah kalimat) untuk cek phishing.`,
    HTML
  );
});

/* ─── /stats ─── */
bot.onText(/^\/stats(?:@\w+)?$/, (msg) => {
  const s = getStats();
  bot.sendMessage(msg.chat.id,
    `📊 <b>Statistik inSpectre</b>\n\n` +
    `Total scan: <b>${s.total}</b>\n` +
    `🚨 Ancaman kritis: <b>${s.bahaya}</b>\n` +
    `⚠️ Waspada/curiga: <b>${s.curiga}</b>\n` +
    `✅ Aman: <b>${s.aman}</b>\n` +
    `🙋 Laporan warga: <b>${s.reports}</b>`,
    HTML
  );
});

/* ─── /cek <nomor> ─── */
bot.onText(/^\/cek(?:@\w+)?(?:\s+(.+))?$/, (msg, match) => {
  const raw = (match[1] || '').trim();
  if (!raw) {
    return bot.sendMessage(msg.chat.id,
      `❌ Format salah.\nContoh: <code>/cek 081234567890</code>`, HTML);
  }
  if (!isValidPhone(raw)) {
    return bot.sendMessage(msg.chat.id,
      `❌ Nomor tidak valid. Gunakan format 08xx atau +62xx.`, HTML);
  }

  const result = checkNumber(raw);
  emitThreat({ type: 'scam_number', ...result });
  emitStats();

  bot.sendMessage(msg.chat.id,
    `${NUMBER_ICON[result.riskLevel] || '❓'} <b>${esc(result.riskLevel)}</b>\n` +
    `Nomor: <code>${esc(result.number)}</code>\n` +
    `Threat Score: <b>${result.threatScore}/100</b>\n\n` +
    esc(result.note),
    HTML
  );
});

/* ─── /lapor <nomor> ─── */
bot.onText(/^\/lapor(?:@\w+)?(?:\s+(.+))?$/, (msg, match) => {
  const raw = (match[1] || '').trim();
  if (!raw) {
    return bot.sendMessage(msg.chat.id,
      `❌ Format salah.\nContoh: <code>/lapor 081234567890</code>`, HTML);
  }
  if (!isValidPhone(raw)) {
    return bot.sendMessage(msg.chat.id,
      `❌ Nomor tidak valid. Gunakan format 08xx atau +62xx.`, HTML);
  }

  const { number, count, duplicate } = reportNumber(raw, msg.from && msg.from.id);

  if (duplicate) {
    return bot.sendMessage(msg.chat.id,
      `ℹ️ Kamu sudah pernah melaporkan nomor ini.\n` +
      `Total laporan saat ini: <b>${count}</b>`, HTML);
  }

  emitThreat({ type: 'scam_report', number, count, riskLevel: 'LAPOR', threatScore: 0 });
  emitStats();

  bot.sendMessage(msg.chat.id,
    `🚩 <b>Laporan tersimpan!</b>\n` +
    `Nomor: <code>${esc(number)}</code>\n` +
    `Total laporan: <b>${count}</b>\n\n` +
    `<i>Terima kasih telah membantu komunitas.</i>`,
    HTML
  );
});

/* ─── TERIMA FILE APK ─── */
bot.on('document', async (msg) => {
  const doc = msg.document;
  if (!doc.file_name || !doc.file_name.toLowerCase().endsWith('.apk')) {
    return bot.sendMessage(msg.chat.id,
      `❌ Untuk saat ini hanya file <b>APK</b> yang bisa saya scan.\n` +
      `Kirim file .apk langsung ke chat ini.`, HTML);
  }
  if (doc.file_size && doc.file_size > MAX_APK_SIZE) {
    return bot.sendMessage(msg.chat.id,
      `❌ File terlalu besar (maks 20MB — batas unduhan bot Telegram).`, HTML);
  }

  let statusMsg;
  try {
    statusMsg = await bot.sendMessage(msg.chat.id, `📥 Mengunduh file...`);
    const savedPath = await bot.downloadFile(doc.file_id, DOWNLOAD_DIR);

    await bot.editMessageText(`🔬 Scanning...`, {
      chat_id: msg.chat.id, message_id: statusMsg.message_id,
    });

    const result = await scanApk(savedPath, doc.file_name); // file dihapus otomatis
    emitThreat({ type: 'apk', ...result });
    emitStats();

    const findingsText = result.findings.length
      ? result.findings.map((f) => `▸ ${f.desc}`).join('\n')
      : 'Tidak ada indikator berbahaya ditemukan.';

    await bot.editMessageText(
      `${APK_ICON[result.riskLevel] || '❓'} <b>${esc(result.riskLevel)}</b>\n` +
      `File: <code>${esc(result.fileName)}</code>\n` +
      `Threat Score: <b>${result.threatScore}/100</b>\n\n` +
      `<b>Temuan:</b>\n${esc(findingsText)}`,
      { chat_id: msg.chat.id, message_id: statusMsg.message_id, ...HTML }
    );
  } catch (err) {
    console.error('APK scan error:', err.message);
    if (statusMsg) {
      bot.editMessageText(`❌ Gagal memproses file. Coba lagi nanti.`, {
        chat_id: msg.chat.id, message_id: statusMsg.message_id,
      }).catch(() => {});
    }
  }
});

/* ─── TERIMA LINK URL (di mana pun posisinya dalam pesan) ─── */
bot.on('message', (msg) => {
  const text = (msg.text || '').trim();
  if (!text || text.startsWith('/')) return;

  const url = extractUrl(text);
  if (!url) return;

  const result = checkLink(url);
  emitThreat({ type: 'link', ...result });
  emitStats();

  const findingsText = (result.findings || []).length
    ? result.findings.map((f) => `▸ ${f.desc}`).join('\n')
    : 'Tidak ada indikator mencurigakan.';

  bot.sendMessage(msg.chat.id,
    `${LINK_ICON[result.riskLevel] || '❓'} <b>${esc(result.riskLevel)}</b>\n` +
    `URL: ${esc(result.url)}\n` +
    `Threat Score: <b>${result.threatScore}/100</b>\n\n` +
    `<b>Temuan:</b>\n${esc(findingsText)}`,
    { ...HTML, disable_web_page_preview: true }
  );
});

/* ─── Error handler polling (agar bot tidak crash saat jaringan gagal) ─── */
bot.on('polling_error', (err) => {
  console.error('Polling error:', err.code, err.message);
});

console.log('🤖 inSpectre bot aktif. Menunggu event...');
