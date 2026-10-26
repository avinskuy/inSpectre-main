# 🛡️ inSpectre

**Real-Time Anti-Phishing Ecosystem — Telegram Bot + Live Dashboard** · ISCOMFEST 2026

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

## Pembaruan UI/UX untuk kompetisi

- Beranda dengan identitas visual keamanan digital, CTA yang jelas, statistik, dan status koneksi live.
- Dashboard khusus di `#/dashboard` dengan statistik, diagram skor risiko 7 pemeriksaan terbaru, dan feed real-time.
- Riwayat mendukung pencarian, filter status/jenis, serta ekspor CSV berdasarkan hasil filter aktif.
- Halaman analisis menyediakan contoh URL sintetis untuk demonstrasi dan kontrol untuk membersihkan input.
- Halaman `#/tools` menyediakan pemindaian statis file APK/ZIP (maks. 25 MB) dan dekode QR dari gambar (maks. 10 MB); gambar QR diproses lokal di browser.
- Edukasi dilengkapi checklist kebiasaan aman dan kuis interaktif dengan penjelasan jawaban.
- Komponen responsif, status koneksi, fokus keyboard, reduced-motion, dan catatan keterbatasan hasil tetap dipertahankan.

## Menjalankan (development)

Butuh Node.js ≥ 18. Buka **dua terminal**.

**1. Backend**
```bash
cd backend
cp .env.example .env        # isi TELEGRAM_TOKEN dari @BotFather (opsional)
npm install
npm run dev                 # http://localhost:5000
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000  (otomatis proxy /api & /socket.io ke :5000)
```

Tanpa `TELEGRAM_TOKEN`, API dan dashboard tetap berjalan; hanya bot yang nonaktif.

### Scan file & QR di web
- Buka menu **File & QR** (`#/tools`). APK/ZIP diproses di memori backend, tidak diekstrak ke disk atau dijalankan.
- QR checker menerima gambar QR; gambar didekode di browser dan tidak diunggah ke backend. Jika hasilnya URL HTTP/HTTPS, pengguna dapat memilih untuk memeriksanya.
- Pemeriksaan APK/ZIP bersifat statis dan heuristik, bukan antivirus; manifest APK biner tidak diurai penuh. ZIP64, arsip terenkripsi, atau kompresi yang tidak didukung dapat ditolak atau tidak sepenuhnya dianalisis. Skor bukan probabilitas malware.

### Scan APK (opsional)
Server perlu `aapt`: `sudo apt install aapt` (Linux), atau set `AAPT_PATH` / `ANDROID_HOME`.
Tanpa `aapt`, bot akan menjawab bahwa scan APK dilewati.

### Tes
```bash
cd backend && npm test
```

## Aksesibilitas & UX

- Navigasi keyboard dengan indikator fokus yang jelas dan tautan “Lewati ke konten utama”.
- Layout responsif untuk layar ponsel, tablet, dan desktop; input tidak memicu zoom otomatis di perangkat mobile.
- Preferensi tema, ukuran teks, mode simulasi buta warna, dan pengurangan animasi tersedia dari menu aksesibilitas.
- Mengikuti preferensi sistem `prefers-reduced-motion`; status dan pesan error penting diumumkan ke teknologi bantu.
- Bahasa antarmuka utama Indonesia, label input eksplisit, dan hasil scan tetap menyertakan penjelasan serta saran tindakan.

## Pemeriksaan sebelum demo / rilis

1. Jalankan `npm test` dari folder `backend` (12 tes unit lulus di lingkungan pengembangan terakhir).
2. Jalankan `npm install` dan `npm run build` dari folder `frontend` pada mesin pengembang sebelum demo/rilis.
3. Uji manual: keyboard-only, pembaca layar, zoom 200%, viewport 320 px, mode terang/gelap, dan reduce motion.
4. Pastikan `VITE_API_URL` mengarah ke backend saat deploy terpisah; jangan menaruh token Telegram di frontend.
5. Hasil scan bukan jaminan keamanan. Hindari klaim bahwa URL “pasti aman”; lakukan verifikasi lewat kanal resmi.

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

## Threat Intelligence / Berita

Versi ini menambahkan halaman `#/berita` yang mengambil artikel dari Google News RSS dengan kata kunci terkait phishing, penipuan online, scam keuangan, dan keamanan siber di Indonesia.

- Endpoint backend: `GET /api/news`.
- Paksa pembaruan feed: `GET /api/news?refresh=1`.
- Cache feed di memori backend selama 10 menit; frontend mencoba memperbarui tampilan setiap 5 menit.
- Backend memerlukan akses internet keluar agar dapat mengambil RSS. Jika sumber tidak dapat dijangkau, halaman menampilkan status error dan tombol coba lagi.
- Artikel mengarah ke sumber/penerbit asli. Data berita adalah informasi eksternal dan tidak menjadi bukti bahwa URL tertentu berbahaya.

Jalankan backend dan frontend seperti biasa:

```bash
# terminal 1
cd backend
npm install
npm run dev

# terminal 2
cd frontend
npm install
npm run dev
```

## Explainable Threat Detection (v1.1.0)

Halaman **Analisis** sekarang menjelaskan alasan di balik skor risiko URL. Setiap indikator menyertakan:

- kode aturan dan kategori indikator;
- poin kontribusi terhadap skor (penjumlahan dibatasi maksimum 100);
- bukti spesifik dari hostname, protokol, path, atau query;
- alasan indikator perlu diperhatikan dan rekomendasi tindakan;
- metode, versi aturan, sinyal positif bila ada, serta batasan pemeriksaan.

Skor merupakan **skor indikator heuristik, bukan probabilitas phishing**. Deteksi ini tidak melakukan pemindaian konten halaman, reputasi real-time, atau verifikasi kepemilikan domain. Hasil `AMAN` berarti aturan yang tersedia tidak menemukan indikator, bukan jaminan bahwa situs aman.

### Demo singkat untuk juri

1. Buka menu **Analisis** dan klik **Coba contoh URL uji +**.
2. Pilih `https://www.google.com`, lalu klik **Periksa**. Tunjukkan sinyal positif berupa kecocokan domain dengan allowlist dan batasan bahwa allowlist bukan jaminan keamanan.
3. Pilih `http://bca-login-verifikasi.xyz/otp`, lalu klik **Periksa**. Buka setiap indikator untuk memperlihatkan bukti, poin, alasan, dan rekomendasi.
4. Tunjukkan panel **Explainable Threat Detection** untuk menjelaskan bagaimana poin indikator berkontribusi terhadap skor total.

### Pengujian backend

Dari folder `backend`, jalankan:

```bash
npm test
```

Tes `explainability.test.js` memeriksa metadata metode, kelengkapan bukti/rekomendasi, perhitungan skor, sinyal positif allowlist, URL tidak valid, dan batas klaim hasil. Tes yang sudah ada tetap dipertahankan.


## Pembaruan navigasi (v7)

- Pemeriksaan tautan, nomor telepon, APK/ZIP, dan QR code kini dipusatkan pada halaman **Analisis**.
- Navigasi utama menyediakan **Asisten AI** dan **Tata Cara Melapor**.
- Halaman Asisten saat ini adalah prototipe panduan berbasis aturan/kata kunci lokal; belum terhubung ke model AI generatif atau API eksternal.
- Halaman Tata Cara Melapor mengarahkan pengguna ke kanal resmi dan menjelaskan bukti yang perlu disimpan.
- Rute lama `#/tools` tetap diarahkan ke halaman Analisis agar tautan lama tidak langsung rusak.

## UI/UX polish + uji VPS (v8)

Pembaruan visual:
- Splash screen saat aplikasi dibuka dengan identitas inSpectre, progress motion, dan pola grid; mengikuti preferensi reduced-motion.
- Transisi antarhalaman yang ringan, tanpa mengubah route hash yang sudah ada.
- Floating contextual assistant di pojok kanan bawah. Saran bergilir antara memeriksa URL/file dan membuka panduan pelaporan; bukan AI generatif dan tidak meminta data rahasia.
- Penyesuaian untuk layar mobile, safe-area, fokus keyboard, serta animasi yang menghormati pengaturan aksesibilitas.

### Jalankan deployment container untuk uji di VPS

Butuh VPS Linux dengan Docker Engine + Docker Compose plugin, port 8080 terbuka di firewall/security group, dan akses SSH. Arsip ini **belum di-deploy ke VPS pengguna** karena alamat/akses VPS tidak diberikan; konfigurasi di bawah menyiapkan deployment agar bisa diuji.

```bash
# Di VPS setelah upload/clone folder proyek:
cp .env.vps.example .env
# Opsional: edit .env untuk token Telegram. Jangan commit .env.
docker compose up -d --build
docker compose ps
./deploy/smoke-test.sh http://127.0.0.1:8080
```

Buka `http://IP-VPS:8080` setelah port 8080 diizinkan. Backend hanya diekspos pada jaringan internal Docker; data SQLite dan laporan nomor disimpan di named volume `inspectre_data`. Lihat log dengan `docker compose logs -f backend frontend`.

Untuk domain publik, gunakan HTTPS melalui Caddy/Traefik atau reverse proxy TLS yang dikelola di VPS. Jangan jadikan HTTP tanpa TLS sebagai endpoint produksi, batasi akses SSH, aktifkan firewall, backup volume data, dan isi `TELEGRAM_TOKEN` hanya di `.env` pada server.

### Pemeriksaan live

`deploy/smoke-test.sh URL` memeriksa HTTP 200 untuk frontend, `/api/health`, `/api/stats`, `/api/recent`, `/api/news`, dan fallback SPA. Smoke test ini memverifikasi konektivitas dasar; tetap uji manual di browser untuk upload APK/ZIP, QR decode, socket real-time, keyboard, mobile, dan reduced-motion. Tes backend tetap dijalankan dengan `cd backend && npm test`.
