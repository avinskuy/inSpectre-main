// Satu-satunya tempat yang tahu alamat backend.
// Dev: '/api' (diteruskan oleh proxy Vite). Produksi lintas domain: set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || '/api';

// Origin backend untuk Socket.IO (sama dengan origin halaman bila BASE relatif)
export const API_ORIGIN = new URL(BASE, window.location.origin).origin;

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server membalas dengan error (${res.status})`);
  }
  return res.json();
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Pastikan backend sedang berjalan.');
  }
  return handle(res);
}

export function apiGet(path) {
  return request(path);
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const getStats = () => apiGet('/stats');
export const getHistory = () => apiGet('/recent');
export const scanUrl = (url) => apiPost('/scan', { url });
export const checkNumber = (number) => apiGet(`/check/${encodeURIComponent(number)}`);

export async function scanArchive(file) {
  let res;
  try {
    res = await fetch(`${BASE}/scan-file?filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Pastikan backend sedang berjalan.');
  }
  return handle(res);
}
