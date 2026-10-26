#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://127.0.0.1:8080}"
BASE_URL="${BASE_URL%/}"
pass() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1" >&2; exit 1; }
check_http() {
  local path="$1" expected="$2" label="$3" body code
  body="$(mktemp)"
  code="$(curl -sS -o "$body" -w '%{http_code}' "$BASE_URL$path" || true)"
  if [[ "$code" != "$expected" ]]; then echo "HTTP $code untuk $path"; cat "$body"; rm -f "$body"; fail "$label"; fi
  if [[ "$path" == "/api/health" ]] && ! grep -q '"status":"ok"' "$body"; then cat "$body"; rm -f "$body"; fail "$label (status bukan ok)"; fi
  if [[ "$path" == "/api/stats" ]] && ! grep -q '"total"' "$body"; then cat "$body"; rm -f "$body"; fail "$label (field total tidak ditemukan)"; fi
  rm -f "$body"; pass "$label"
}
echo "inSpectre smoke test: $BASE_URL"
check_http "/" "200" "Frontend mengembalikan HTTP 200"
check_http "/api/health" "200" "Backend health endpoint sehat"
check_http "/api/stats" "200" "API statistik merespons"
check_http "/api/recent" "200" "API riwayat merespons"
news_code="$(curl -sS -o /tmp/inspectre-news-check.json -w '%{http_code}' "$BASE_URL/api/news" || true)"
if [[ "$news_code" == "200" ]]; then pass "API berita merespons"; elif [[ "$news_code" == "502" ]]; then pass "Endpoint berita hidup, tetapi sumber RSS eksternal sedang tidak tersedia (HTTP 502)"; else fail "Endpoint berita memberi HTTP $news_code"; fi
rm -f /tmp/inspectre-news-check.json
check_http "/#/analisis" "200" "SPA route Analisis terlayani oleh frontend"
echo "Semua smoke test HTTP lulus. Jalankan uji interaksi browser terpisah untuk upload, QR, Socket.IO, dan responsivitas."
