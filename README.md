# 🛡️ inSpectre

**Real-Time Anti-Phishing Ecosystem — Live Dashboard** · ISCOMFEST 2026

Penipuan lewat link palsu, nomor tak dikenal, dan file APK "undangan/paket/tilang" terus memakan korban di Indonesia.
inSpectre membantu siapa pun memeriksa ketiganya **sebelum** terlambat, lewat situs web dan bot Telegram,
dengan hasil yang tampil real-time di dashboard.

## Fitur

| Fitur | Di mana | Cara kerja |
|---|---|---|
| 🔗 Cek link phishing | Web + Bot | 8 aturan heuristik: TLD berisiko, peniruan brand, kata kunci, IP langsung, subdomain berlapis, homoglyph, shortener, HTTPS |
| 📱 Cek nomor scam | Web + Bot + API | Pemeriksaan nomor terhadap laporan warga yang tersedia; pelaporan dan moderasi laporan melalui bot |
| 📦 Scan APK / ZIP | Web + Bot | Pemeriksaan statis struktur arsip, jalur, ekstensi, string dan indikator APK yang dapat dibaca; bukan antivirus |
| ▦ QR Code Checker | Web | Dekode gambar QR lokal di browser; URL HTTP/HTTPS dapat diperiksa dengan mesin analisis tautan tanpa membuka URL otomatis |
| 📡 Dashboard real-time | Web | Statistik, ringkasan proporsi hasil, visualisasi skor risiko, dan aktivitas terbaru lewat Socket.IO |
| 📚 Edukasi | Web | Ciri phishing, studi kasus, checklist interaktif, dan kuis pemahaman |
| 🧾 Riwayat & ekspor | Web | Cari/filter riwayat pemeriksaan dan ekspor CSV dari data yang ditampilkan |
| ♿ Aksesibilitas | Web | Tema terang/gelap, ukuran font, kurangi animasi, navigasi keyboard |

## Arsitektur

```
Telegram ──► bot.js ─┐
                     ├─► linkChecker / numberChecker / scanner ──► SQLite (inspectre.db)
Web (React) ─► REST ─┘                                   │
      ▲                                                  ▼
      └──────────── Socket.IO (new_threat, stats_update) ┘
```

- `backend/` — Node.js, Express, Socket.IO, better-sqlite3, node-telegram-bot-api
- `frontend/` — React 18, Vite, Tailwind CSS

### Scan file & QR di web
- Buka menu **File & QR** (`#/tools`). APK/ZIP diproses di memori backend, tidak diekstrak ke disk atau dijalankan.
- QR checker menerima gambar QR; gambar didekode di browser dan tidak diunggah ke backend. Jika hasilnya URL HTTP/HTTPS, pengguna dapat memilih untuk memeriksanya.
- Pemeriksaan APK/ZIP bersifat statis dan heuristik, bukan antivirus; manifest APK biner tidak diurai penuh. ZIP64, arsip terenkripsi, atau kompresi yang tidak didukung dapat ditolak atau tidak sepenuhnya dianalisis. Skor bukan probabilitas malware.

### Scan APK (opsional)
Server perlu `aapt`: `sudo apt install aapt` (Linux), atau set `AAPT_PATH` / `ANDROID_HOME`.
Tanpa `aapt`, bot akan menjawab bahwa scan APK dilewati.

## Privasi

- Nomor HP di riwayat dan dashboard publik disamarkan (`6281*****890`).
- Query dan hash URL dibuang sebelum ditampilkan/disiarkan (token dan data pribadi tidak bocor).
- ID Telegram pelapor disimpan sebagai hash, bukan ID asli.
- File APK yang diunggah dihapus dari server segera setelah dipindai.
- URL **tidak dibuka/diunduh** oleh server, jadi tidak ada risiko SSRF.

## Keterbatasan (jujur)

- Deteksi link berbasis heuristik, bukan daftar hitam global: ada kemungkinan false positive/negative.
- Pencocokan brand untuk nama pendek (bca, bri, bni, ovo, dana) hanya mengenali label domain yang persis sama.
- Scan APK bersifat statis dan ringan; bukan pengganti antivirus.
- Bot Telegram hanya bisa mengunduh file hingga 20 MB.

## Lisensi

Lihat [LICENSE](LICENSE).
