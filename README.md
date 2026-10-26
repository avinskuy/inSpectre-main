🛡️ inSpectre

Real-Time Anti-Phishing Ecosystem

Deteksi tautan mencurigakan. Kenali indikator risiko. Lebih waspada terhadap penipuan digital.

Dikembangkan untuk ISCOMFEST 2026.

<p>
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=fff" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=fff" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=fff" alt="SQLite" />
</p><p>
  <img src="https://img.shields.io/badge/API-REST-0A7EA4" alt="REST API" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio&logoColor=fff" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/World%20Monitor-Active-16803D" alt="World Monitor" />
</p>---

📌 Tentang Proyek

inSpectre adalah ekosistem pemeriksaan keamanan digital yang membantu pengguna mengenali indikasi phishing, nomor yang dilaporkan, file mencurigakan, dan informasi keamanan yang relevan.

Proyek ini menggabungkan analisis heuristik, pemeriksaan reputasi URL melalui layanan eksternal jika tersedia, dashboard aktivitas, serta World Monitor untuk melihat indikasi hotspot di Indonesia dari data satelit.

«Penting: inSpectre merupakan alat bantu kewaspadaan. Hasil pemeriksaan bukan jaminan bahwa URL, nomor, atau file aman maupun berbahaya.»

🚦 Status Pengembangan

Status| Arti
✅ Tersedia| Fitur sudah diimplementasikan; ketersediaan integrasi eksternal tetap bergantung pada konfigurasi dan layanan sumber.
🛠️ Pengembangan berikutnya| Direncanakan, belum boleh dianggap tersedia di deployment saat ini.

✨ Fitur yang Sudah Diimplementasikan

Fitur| Deskripsi
🔗 Link Phishing Checker| Menganalisis indikator seperti TLD berisiko, peniruan brand, kata kunci mencurigakan, alamat IP langsung, subdomain berlapis, homoglyph, URL shortener, dan penggunaan HTTPS.
🛡️ Google Safe Browsing| Memeriksa reputasi URL terhadap kategori ancaman yang didukung API jika dikonfigurasi dan tersedia.
📱 Pemeriksaan Nomor| Memeriksa nomor berdasarkan data laporan yang tersedia.
📦 APK/ZIP Scanner| Analisis statis struktur arsip, jalur, ekstensi, string, dan indikator yang dapat dibaca. Bukan antivirus.
▦ QR Code Checker| Mendekode QR di browser tanpa otomatis membuka URL hasil dekode.
📡 Live Dashboard| Menampilkan statistik dan aktivitas melalui Socket.IO.
📰 Berita Keamanan| Menampilkan berita keamanan beserta tautan penerbit jika tersedia.
🤖 inSpectre Agent| Asisten berbasis model bahasa melalui backend, bergantung pada konfigurasi penyedia model.
📚 Edukasi Keamanan| Materi, studi kasus, checklist, dan kuis pemahaman.
🧾 Riwayat & Ekspor| Pencarian, filter, dan ekspor CSV untuk data yang tersedia.
♿ Aksesibilitas| Dukungan tema, ukuran font, pengurangan animasi, dan navigasi keyboard.
🌍 World Monitor — Hotspot Indonesia| Peta interaktif menggunakan Leaflet dan OpenStreetMap untuk menampilkan indikasi hotspot dari NASA FIRMS.
🔄 Pembaruan Data Hotspot| Endpoint hotspot memakai cache backend dan antarmuka memperbarui data secara berkala.

🌍 World Monitor

World Monitor merupakan bagian dari pengembangan pemantauan situasi berbasis peta.

Yang sudah tersedia

- Peta interaktif dengan Leaflet dan peta dasar OpenStreetMap.
- Data indikasi hotspot Indonesia dari NASA FIRMS — VIIRS SNPP Near Real-Time.
- Penanda lokasi hotspot yang dapat dipilih untuk melihat informasi terkait.
- Status ketersediaan data dan waktu pembaruan.
- Tabel koordinat untuk data hotspot yang diterima.
- Cache data di backend sekitar lima menit serta pembaruan berkala di antarmuka.

Cara membaca data

Hotspot satelit bukan konfirmasi kebakaran. Data dapat menunjukkan anomali termal yang memerlukan verifikasi lebih lanjut. Awan, waktu lintasan satelit, keterlambatan data, dan karakteristik sensor dapat memengaruhi hasil.

Ketersediaan data bergantung pada layanan NASA FIRMS dan konfigurasi API key. Peta dasar juga membutuhkan koneksi internet.

🧰 Tech Stack

Area| Teknologi
Frontend| JavaScript, React, Vite
Peta interaktif| Leaflet, React Leaflet, OpenStreetMap
Backend| Node.js, Express
Database| SQLite
Komunikasi realtime| Socket.IO
Reputasi URL| Google Safe Browsing, jika dikonfigurasi
Data hotspot| NASA FIRMS
Pengujian| Node.js Test Runner

🏗️ Arsitektur

┌─────────────────────────────────────┐
│           Browser / React           │
│ Dashboard · Analisis · QR · World   │
│ Monitor · Berita · Edukasi          │
└──────────────────┬──────────────────┘
                   │ REST API
                   ▼
┌─────────────────────────────────────┐
│          Node.js / Express          │
├─────────────────────────────────────┤
│ Link Checker dan Safe Browsing      │
│ Number Checker                      │
│ APK / ZIP Scanner                   │
│ News dan inSpectre Agent            │
│ World Monitor Hotspots              │
│ SQLite dan layanan pendukung        │
└───────────────┬─────────────┬───────┘
                │             │
                ▼             ▼
        Google Safe       NASA FIRMS
        Browsing API      Hotspot Data

          Socket.IO → Dashboard Realtime

🗺️ Roadmap — Fitur Mendatang

Fitur di bawah ini merupakan rencana pengembangan, bukan klaim bahwa semuanya sudah tersedia.

Prioritas| Fitur| Rencana
🛠️ Berikutnya| Air Quality & Smoke| Integrasi data kualitas udara dan indikasi asap dari sumber yang sesuai.
🛠️ Berikutnya| Weather & Warnings| Informasi cuaca dan peringatan dari sumber resmi yang tersedia.
🛠️ Berikutnya| Disaster Monitor| Pengembangan lapisan informasi gempa, banjir, dan longsor sesuai ketersediaan data.
🛠️ Berikutnya| Traffic Monitor| Eksplorasi integrasi informasi lalu lintas dari sumber yang dapat digunakan.
🛠️ Berikutnya| Dashboard Integration| Menyatukan lapisan pemantauan dan status sumber data dalam satu antarmuka.
🛠️ Berikutnya| Reliability & Observability| Memperjelas status sumber, waktu pembaruan, kegagalan layanan, dan penanganan data kedaluwarsa.
🛠️ Berikutnya| World Monitor Expansion| Memperluas cakupan pemantauan secara bertahap setelah kualitas sumber data dan integrasinya diverifikasi.

Urutan roadmap dapat berubah mengikuti ketersediaan sumber data, hasil pengujian, keamanan, dan prioritas pengembangan.

🛡️ Google Safe Browsing

Backend dapat menggabungkan hasil heuristik lokal dengan pemeriksaan reputasi melalui Google Safe Browsing Lookup API.

Status| Arti
"threat"| Layanan melaporkan kecocokan ancaman. Hindari membuka tautan atau memasukkan informasi pribadi.
"no_match"| Tidak ditemukan kecocokan ancaman dari pemeriksaan tersebut. Bukan jaminan URL aman.
"unavailable"| Pemeriksaan eksternal tidak tersedia. Hasil heuristik lokal tetap merupakan lapisan pemeriksaan terpisah.

API key harus disimpan sebagai environment variable di backend, bukan di frontend, repository, respons API, atau log. Untuk deployment systemd, gunakan file environment dengan izin akses terbatas.

Pemeriksaan reputasi bukan pemindaian menyeluruh terhadap isi situs. Ancaman baru atau URL yang belum terdaftar mungkin tidak terdeteksi.

📁 Analisis File dan QR

- QR didekode di browser; URL hasil dekode tidak dibuka otomatis.
- APK/ZIP diperiksa secara statis dan tidak dijalankan sebagai aplikasi.
- Analisis bersifat heuristik dan bukan pengganti antivirus.
- Manifest APK biner mungkin tidak dapat diurai sepenuhnya.
- Format arsip atau kompresi tertentu dapat ditolak atau dianalisis secara terbatas.
- Jika pemeriksaan APK memerlukan "aapt", alat tersebut harus tersedia dan dikonfigurasi melalui "AAPT_PATH" atau "ANDROID_HOME".

🔐 Privasi dan Keamanan

- Data nomor pada tampilan publik disamarkan sesuai mekanisme privasi aplikasi.
- Data URL yang ditampilkan atau disiarkan melewati mekanisme penyaringan privasi.
- ID pelapor Telegram disimpan dalam bentuk hash pada alur yang menggunakannya.
- File yang diunggah ditangani melalui alur pemindaian backend.
- Server tidak membuka URL target secara langsung untuk memeriksa isi situs. Namun, ketika pemeriksaan reputasi aktif, URL dikirim ke Google Safe Browsing untuk pencocokan reputasi.
- Jangan mengirim URL rahasia atau sensitif ke layanan pemeriksaan eksternal.
- Integrasi Telegram tersedia di kode proyek, tetapi bot Telegram dinonaktifkan pada deployment demo saat ini.

⚠️ Batasan

- Heuristik dapat menghasilkan false positive maupun false negative.
- Skor risiko bukan probabilitas bahwa situs atau file berbahaya.
- Pemeriksaan reputasi bergantung pada ketersediaan dan cakupan data layanan eksternal.
- Pemeriksaan APK/ZIP tidak setara dengan analisis malware mendalam.
- Data World Monitor bergantung pada sumber satelit, waktu pembaruan, dan ketersediaan API.
- Hotspot satelit tidak boleh dianggap sebagai kejadian kebakaran yang telah terkonfirmasi.
- Fitur roadmap dapat berubah sebelum implementasi dan pengujian selesai.

🧪 Pengujian

Jalankan pengujian backend:

cd backend
npm test

Build frontend:

cd frontend
npm install
npm run build

Pastikan tes dan build berhasil sebelum deployment. Untuk perubahan yang menyentuh integrasi eksternal, periksa juga status layanan dan penanganan kondisi gagal.

🚀 Menjalankan Proyek

Persyaratan umum: Node.js dan npm yang kompatibel dengan dependensi proyek.

git clone https://github.com/avinskuy/inSpectre-main.git
cd inSpectre-main

Instal dependensi dan jalankan tes backend:

cd backend
npm install
npm test

Instal dependensi dan build frontend:

cd ../frontend
npm install
npm run build

Konfigurasi environment backend sesuai layanan yang digunakan. Variabel yang mungkin diperlukan mencakup:

- "GOOGLE_SAFE_BROWSING_API_KEY" — pemeriksaan reputasi URL.
- "NASA_FIRMS_MAP_KEY" — data hotspot NASA FIRMS.
- "GEMINI_API_KEY" atau "OPENROUTER_API_KEY" — integrasi model bahasa, sesuai konfigurasi backend.

Ikuti konfigurasi aktual pada proyek sebelum menjalankan server. Jangan menaruh API key, token, atau rahasia lainnya di repository maupun frontend.

📡 Endpoint API

Endpoint berikut tersedia pada backend proyek; kebutuhan parameter dan metode harus mengikuti implementasi masing-masing route.

Endpoint| Fungsi
"/api/health"| Status kesehatan API.
"/api/stats"| Statistik dashboard.
"/api/recent"| Aktivitas terbaru.
"/api/news"| Data berita keamanan.
"/api/check/:nomor"| Pemeriksaan nomor.
"/api/scan-file"| Alur pemindaian file.
"/api/scan"| Alur pemindaian yang tersedia pada backend.
"/api/assistant"| Integrasi asisten.
"/api/environment/hotspots"| Data hotspot untuk World Monitor.

📄 Lisensi

Lihat file ""LICENSE"" (LICENSE)
