// privacy.js — samarkan data sensitif sebelum dikirim ke publik (API riwayat & socket dashboard)

/* 6281234567890 → 6281*****890 */
function maskNumber(n) {
  const s = String(n ?? '');
  if (s.length <= 7) return s;
  return s.slice(0, 4) + '*'.repeat(s.length - 7) + s.slice(-3);
}

/* https://a.com/path?token=rahasia#x → a.com/path (query & hash dibuang) */
function publicUrl(u) {
  try {
    const p = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
    const path = p.pathname === '/' ? '' : p.pathname;
    return (p.host + path).slice(0, 100);
  } catch {
    return String(u ?? '').slice(0, 100);
  }
}

function publicIdentifier(type, id) {
  if (type === 'link' || type === 'url') return publicUrl(id);
  if (type === 'scam_number') return maskNumber(id);
  return String(id ?? '');
}

module.exports = { maskNumber, publicUrl, publicIdentifier };
