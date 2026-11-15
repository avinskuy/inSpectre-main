// config.js — memuat variabel environment dari .env
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const configuredOrigin = process.env.CORS_ORIGIN;
const rawOrigin = (
  configuredOrigin === undefined
    ? (isProduction ? '' : '*')
    : configuredOrigin
).trim();

// Produksi tanpa allowlist tidak mengirim header CORS.
// Frontend same-origin tetap bekerja; deployment lintas origin harus
// mengonfigurasi CORS_ORIGIN secara eksplisit.
const corsOrigins = rawOrigin === '*'
  ? '*'
  : rawOrigin
    ? rawOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
    : false;

module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  CORS_ORIGINS: corsOrigins,
};
