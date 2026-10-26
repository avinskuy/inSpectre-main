<div align="center">

# 🛡️ inSpectre

### Real-Time Anti-Phishing Ecosystem

**Deteksi tautan mencurigakan. Kenali indikator risiko. Lebih waspada terhadap penipuan digital.**

Dikembangkan untuk **ISCOMFEST 2026**

<p>
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=fff" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=fff" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=fff" alt="SQLite" />
  <img src="https://img.shields.io/badge/Security-Anti--Phishing-D32F2F?logo=owasp&logoColor=fff" alt="Security" />
</p>

<p>
  <img src="https://img.shields.io/badge/API-REST-0A7EA4" alt="REST API" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio&logoColor=fff" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/External%20Reputation-Google%20Safe%20Browsing-4285F4?logo=google&logoColor=fff" alt="Google Safe Browsing" />
</p>

</div>

---

## 📌 Tentang Proyek

Penipuan melalui tautan palsu, nomor tak dikenal, dan file APK berkedok undangan, paket, atau tilang merupakan risiko keamanan digital yang perlu diwaspadai.

**inSpectre** membantu pengguna melakukan pemeriksaan awal terhadap tautan, nomor yang dilaporkan, dan file APK/ZIP. Aplikasi menggabungkan analisis heuristik, pemeriksaan reputasi URL jika tersedia, serta penjelasan indikator risiko melalui dashboard web.

> **Penting:** hasil pemeriksaan merupakan alat bantu kewaspadaan, bukan jaminan bahwa suatu tautan atau file aman.

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔗 **Link Phishing Checker** | Memeriksa indikator seperti TLD berisiko, peniruan brand, kata kunci mencurigakan, alamat IP langsung, subdomain berlapis, homoglyph, URL shortener, dan HTTPS. |
| 🛡️ **Google Safe Browsing** | Memeriksa reputasi URL terhadap kategori ancaman yang didukung API jika layanan tersedia. |
| 📱 **Pemeriksaan Nomor** | Memeriksa nomor berdasarkan data laporan yang tersedia. |
| 📦 **APK/ZIP Scanner** | Analisis statis struktur arsip, jalur, ekstensi, string, dan indikator yang dapat dibaca. Bukan antivirus. |
| ▦ **QR Code Checker** | Mendekode QR di browser; URL hasil dekode tidak dibuka otomatis. |
| 📡 **Live Dashboard** | Menampilkan statistik dan aktivitas melalui Socket.IO. |
| 📰 **Berita Keamanan** | Menampilkan berita dengan tautan ke penerbit jika tersedia. |
| 🤖 **inSpectre Agent** | Asisten berbasis model bahasa melalui backend. |
| 📚 **Edukasi Keamanan** | Materi, studi kasus, checklist, dan kuis pemahaman. |
| 🧾 **Riwayat & Ekspor** | Pencarian, filter, dan ekspor CSV dari data yang tersedia. |
| ♿ **Aksesibilitas** | Dukungan tema, ukuran font, pengurangan animasi, dan navigasi keyboard. |

## 🧰 Tech Stack

<div align="center">

| Area | Teknologi |
|---|---|
| Frontend | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff) |
| Backend | ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=fff) ![Express](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff) |
| Database | ![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=fff) |
| Realtime | ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=fff) |
| External reputation | ![Google Safe Browsing](https://img.shields.io/badge/Google%20Safe%20Browsing-4285F4?logo=google&logoColor=fff) |
| Testing | ![Node Test Runner](https://img.shields.io/badge/Testing-Node.js%20Test%20Runner-339933?logo=nodedotjs&logoColor=fff) |

</div>

## 🏗️ Arsitektur

```text
┌───────────────────────────────┐
│       Browser / React         │
│ Dashboard · Analisis · QR     │
└───────────────┬───────────────┘
                │ REST API
                ▼
┌───────────────────────────────┐
│       Node.js / Express       │
├───────────────────────────────┤
│ Link Checker (heuristik)      │
│ Safe Link Checker             │──► Google Safe Browsing API
│ Number Checker                │
│ APK / ZIP Scanner             │
│ SQLite                        │
└───────────────┬───────────────┘
                │
                ▼
       Socket.IO Events
       Dashboard Realtime
```

### Struktur Repository

```text
inSpectre/
├── backend/
│   ├── server.js
│   ├── linkChecker.js
│   ├── safeBrowsing.js
│   ├── safeLinkChecker.js
│   ├── numberChecker.js
│   ├── archiveScanner.js
│   ├── scanner.js
│   ├── news.js
│   └── test/
├── frontend/
│   └── src/
└── README.md
```

## 🛡️ Google Safe Browsing

Backend menggabungkan hasil heuristik lokal dengan pemeriksaan reputasi melalui Google Safe Browsing Lookup API v4.

| Status | Arti |
|---|---|
| `threat` | API melaporkan kecocokan ancaman. Hindari membuka tautan atau memasukkan informasi pribadi. |
| `no_match` | API tidak menemukan kecocokan ancaman. **Bukan jaminan URL aman.** |
| `unavailable` | Pemeriksaan eksternal tidak tersedia; hasil heuristik lokal tetap menjadi lapisan pemeriksaan terpisah. |

API key harus disimpan sebagai environment variable di backend, bukan di frontend, repository, respons API, atau log. Untuk deployment systemd, gunakan file environment dengan izin akses terbatas.

Pemeriksaan reputasi bukan pemindaian penuh isi situs. Ancaman baru atau URL yang belum terdaftar mungkin tidak terdeteksi. Periksa ketentuan Google yang berlaku untuk jenis penggunaan proyek.

## 📁 Analisis File dan QR

- QR didekode di browser; URL hasil dekode tidak dibuka otomatis.
- APK/ZIP diperiksa secara statis dan tidak dijalankan sebagai aplikasi.
- Analisis bersifat heuristik dan bukan pengganti antivirus.
- Manifest APK biner mungkin tidak dapat diurai penuh. Format arsip atau kompresi tertentu bisa ditolak atau dianalisis secara terbatas.
- Jika pemeriksaan APK membutuhkan `aapt`, alat tersebut harus tersedia dan dikonfigurasi melalui `AAPT_PATH` atau `ANDROID_HOME`.

## 🔐 Privasi dan Keamanan

- Data nomor pada tampilan publik disamarkan sesuai mekanisme privasi aplikasi.
- Data URL yang ditampilkan atau disiarkan melewati mekanisme penyaringan privasi.
- ID pelapor Telegram disimpan dalam bentuk hash pada alur yang menggunakannya.
- File yang diunggah ditangani oleh alur pemindaian backend.
- Server tidak membuka URL target secara langsung untuk memeriksa isi situs. Namun, ketika pemeriksaan reputasi aktif, URL dikirim ke Google Safe Browsing untuk pencocokan reputasi. Hindari mengirim URL rahasia atau sensitif.

## ⚠️ Batasan

- Heuristik dapat menghasilkan *false positive* maupun *false negative*.
- Pemeriksaan reputasi bergantung pada ketersediaan layanan eksternal dan cakupan data ancamannya.
- Skor risiko bukan probabilitas bahwa situs atau file berbahaya.
- Pemeriksaan APK/ZIP tidak setara dengan analisis malware mendalam.
- Integrasi Telegram tersedia di kode proyek, tetapi **bot Telegram dinonaktifkan pada deployment demo saat ini**.

## 🧪 Pengujian

Jalankan tes backend:

```bash
cd backend
npm test
```

Build frontend:

```bash
cd frontend
npm install
npm run build
```

Pastikan pengujian lulus dan build berhasil sebelum melakukan deployment.

## 🚀 Menjalankan Proyek

Persyaratan umum: Node.js dan npm yang kompatibel dengan proyek.

```bash
git clone https://github.com/avinskuy/inSpectre-main.git
cd inSpectre-main
```

Instal dependensi backend:

```bash
cd backend
npm install
npm test
```

Instal dependensi dan build frontend:

```bash
cd ../frontend
npm install
npm run build
```

Konfigurasi environment backend sesuai kebutuhan deployment. **Jangan commit API key, token, atau rahasia lainnya.** Ikuti konfigurasi layanan yang digunakan proyek sebelum menjalankan server.

## 📄 Lisensi

Lihat [LICENSE](LICENSE).
