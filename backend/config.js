// config.js — memuat variabel environment dari .env
require('dotenv').config();

const rawOrigin = (process.env.CORS_ORIGIN || '*').trim();

module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  // '*' = semua origin (aman untuk demo). Produksi: CORS_ORIGIN=https://domain-anda.com
  CORS_ORIGINS: rawOrigin === '*' ? '*' : rawOrigin.split(',').map((s) => s.trim()).filter(Boolean),
};
