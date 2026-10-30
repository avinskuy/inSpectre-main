
# 🛡️ inSpectre

### Real-Time Anti-Phishing Ecosystem

Deteksi tautan mencurigakan. Kenali indikator risiko. Lebih waspada terhadap penipuan digital.

**Dikembangkan untuk ISCOMFEST 2026.**

<p>
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=fff" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=fff" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=fff" alt="SQLite" />
</p>

<p>
  <img src="https://img.shields.io/badge/API-REST-0A7EA4" alt="REST API" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio&logoColor=fff" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/World%20Monitoring-Completed-16803D" alt="World Monitoring Completed" />
</p>

---

## 📌 Tentang Proyek

**inSpectre — Environmental & Threat Intelligence Platform** adalah platform intelijen terpadu yang dirancang untuk membantu pengguna memahami, memantau, dan merespons informasi serta indikasi ancaman di lingkungan digital maupun dunia nyata.

inSpectre tidak hanya berfokus pada pemeriksaan phishing atau keamanan file. Platform ini mengintegrasikan berbagai modul dalam satu ekosistem, mulai dari **Digital Security & Threat Detection**, **Environmental Intelligence**, **World Monitoring**, hingga **Security Awareness dan AI Assistance**.

Melalui pendekatan tersebut, inSpectre menghubungkan pemeriksaan keamanan digital, pemantauan kondisi lingkungan, informasi kebencanaan, berita keamanan, edukasi, dan dukungan asisten cerdas dalam satu pusat informasi.

### Ruang Lingkup Platform

- 🛡️ **Digital Security:** pemeriksaan URL, indikasi phishing, reputasi tautan, nomor telepon, APK, ZIP, dan QR Code.
- 🌍 **Environmental Intelligence:** pemantauan hotspot satelit, kualitas udara, prakiraan cuaca, peringatan cuaca, dan informasi gempa bumi.
- 🛰️ **World Monitoring:** visualisasi data dan indikasi situasional melalui peta interaktif.
- 📊 **Security Dashboard:** ringkasan statistik, aktivitas, dan informasi penting dari berbagai modul.
- 📰 **Security Intelligence:** berita dan informasi keamanan yang relevan.
- 🤖 **AI Assistance:** asisten berbasis model bahasa untuk membantu pengguna memahami informasi dan memperoleh panduan.
- 📚 **Security Awareness:** edukasi, studi kasus, checklist, dan kuis.
- 🧾 **Activity & Reporting:** riwayat pemeriksaan, pelaporan, pencarian, dan ekspor data yang tersedia.

Dengan menggabungkan berbagai sumber data, teknologi analisis, dan visualisasi dalam satu platform, **inSpectre bertujuan menjadi pusat Environmental & Threat Intelligence yang membantu pengguna memperoleh gambaran situasi secara lebih menyeluruh.**

> **Penting:** inSpectre merupakan platform pendukung informasi dan kewaspadaan, bukan sistem yang menjamin seluruh ancaman dapat terdeteksi atau menggantikan verifikasi dari pihak berwenang maupun tenaga ahli.

## 🚦 Status Pengembangan

| Status | Arti |
|---|---|
| ✅ Selesai / tersedia | Fitur sudah diimplementasikan. Ketersediaan integrasi eksternal tetap bergantung pada konfigurasi dan layanan sumber. |
| ⏸️ Selesai, pengembangan dijeda | Fitur telah selesai dibangun untuk tahap saat ini. Pengembangan lanjutan ditunda. |
| 🛠️ Direncanakan | Fitur masih berada dalam roadmap dan belum boleh dianggap tersedia pada deployment saat ini. |

## ✨ Fitur yang Sudah Diimplementasikan

| Fitur | Deskripsi |
|---|---|
| 🔗 Link Phishing Checker | Menganalisis indikator seperti TLD berisiko, peniruan brand, kata kunci mencurigakan, alamat IP langsung, subdomain berlapis, homoglyph, URL shortener, dan penggunaan HTTPS. |
| 🛡️ Google Safe Browsing | Memeriksa reputasi URL terhadap kategori ancaman yang didukung API jika dikonfigurasi dan tersedia. |
| 📱 Pemeriksaan Nomor | Memeriksa nomor berdasarkan data laporan yang tersedia. |
| 📦 APK/ZIP Scanner | Analisis statis struktur arsip, jalur, ekstensi, string, serta AndroidManifest.xml APK menggunakan AAPT jika tersedia. Bukan antivirus. |
| ▦ QR Code Checker | Mendekode QR di browser tanpa otomatis membuka URL hasil dekode. |
| 📡 Live Dashboard | Menampilkan statistik dan aktivitas melalui Socket.IO. |
| 📰 Berita Keamanan | Menampilkan berita keamanan beserta tautan penerbit jika tersedia. |
| 🤖 inSpectre Agent | Asisten berbasis model bahasa melalui backend, bergantung pada konfigurasi penyedia model. |
| 📚 Edukasi Keamanan | Materi, studi kasus, checklist, dan kuis pemahaman. |
| 🧾 Riwayat & Ekspor | Pencarian, filter, dan ekspor CSV untuk data yang tersedia. |
| ♿ Aksesibilitas | Dukungan tema, ukuran font, pengurangan animasi, dan navigasi keyboard. |
| 🌍 World Monitoring | Peta interaktif untuk memantau indikasi hotspot di Indonesia menggunakan Leaflet, OpenStreetMap, dan integrasi data NASA FIRMS. |
| 🔄 Pembaruan Data Hotspot | Endpoint hotspot menggunakan cache backend dan antarmuka yang memperbarui data secara berkala. |

## 🌍 World Monitoring & Environmental Intelligence

Modul ini menggabungkan peta interaktif dan beberapa sumber data lingkungan. Ketersediaan setiap lapisan bergantung pada layanan eksternal, konektivitas, cache, dan konfigurasi deployment.

### Lapisan data yang terintegrasi

- **Hotspot — NASA FIRMS:** indikasi anomali termal dari satelit.
- **Kualitas udara — OpenAQ:** observasi kualitas udara yang tersedia dari stasiun yang didukung.
- **Cuaca — BMKG:** prakiraan cuaca berdasarkan kode wilayah administratif.
- **Peringatan cuaca — BMKG:** informasi peringatan dari feed yang tersedia.
- **Gempa bumi — BMKG:** informasi kejadian gempa dari feed BMKG.

### Endpoint lingkungan

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/environment/hotspots` | Data indikasi hotspot NASA FIRMS. |
| `GET` | `/api/environment/air-quality` | Observasi kualitas udara dari OpenAQ. |
| `GET` | `/api/environment/regions` | Daftar wilayah; mendukung parameter `parent`. |
| `GET` | `/api/environment/weather?adm4=<kode-wilayah>` | Prakiraan cuaca BMKG berdasarkan kode wilayah. |
| `GET` | `/api/environment/weather-warnings` | Feed peringatan cuaca BMKG. |
| `GET` | `/api/environment/disasters` | Informasi gempa dari BMKG. |

### Catatan interpretasi dan ketersediaan

- Hotspot satelit bukan konfirmasi kebakaran; indikasi termal perlu diverifikasi.
- Data kualitas udara hanya mewakili observasi yang tersedia dan dapat berbeda menurut lokasi serta waktu pengukuran.
- Prakiraan dan peringatan mengikuti data yang disediakan BMKG.
- Data dapat terlambat, tidak lengkap, kedaluwarsa, atau sementara tidak tersedia saat sumber eksternal bermasalah.
- Peta dasar OpenStreetMap dan sejumlah sumber data membutuhkan koneksi internet.

## 🧰 Tech Stack

| Area | Teknologi |
|---|---|
| Frontend | JavaScript, React, Vite |
| Peta interaktif | Leaflet, React Leaflet, OpenStreetMap |
| Backend | Node.js, Express |
| Database | SQLite |
| Komunikasi realtime | Socket.IO |
| Reputasi URL | Google Safe Browsing, jika dikonfigurasi |
| Data hotspot | NASA FIRMS |
| Data kualitas udara | OpenAQ |
| Prakiraan, peringatan cuaca, dan data gempa | BMKG |
| Pengujian | Node.js Test Runner |

## 🏗️ Arsitektur

```text
┌─────────────────────────────────────┐
│           Browser / React           │
│                                     │
│ Dashboard · Analisis · QR Checker   │
│ World Monitoring · Berita · Edukasi │
└──────────────────┬──────────────────┘
                   │
                   │ REST API
                   ▼
┌─────────────────────────────────────┐
│          Node.js / Express          │
├─────────────────────────────────────┤
│ Link Checker dan Safe Browsing      │
│ Number Checker                      │
│ APK / ZIP Scanner                   │
│ News dan inSpectre Agent            │
│ Environmental Intelligence          │
│ Hotspot · Air Quality · Weather      │
│ Warnings · Earthquake Data           │
│ SQLite dan layanan pendukung         │
└───────────────┬─────────────┬───────┘
                │             │
                ▼             ▼
        Google Safe       NASA FIRMS
        Browsing API      Hotspot Data
              OpenAQ · BMKG
       Air Quality · Weather · Disasters

          Socket.IO → Dashboard Realtime
```

Diagram ini menunjukkan gambaran arsitektur logis. Detail implementasi aktual mengikuti kode dan konfigurasi deployment.

## 🗺️ Roadmap — Pengembangan Berikutnya

| Status | Area | Fokus |
|---|---|---|
| ✅ Terintegrasi | Hotspot | Data indikasi hotspot dari NASA FIRMS. |
| ✅ Terintegrasi | Air Quality | Observasi kualitas udara melalui OpenAQ. |
| ✅ Terintegrasi | Weather & Warnings | Prakiraan dan peringatan cuaca dari BMKG. |
| ✅ Terintegrasi | Disaster Data | Feed informasi gempa dari BMKG. |
| 🔧 Pengembangan lanjutan | Reliability & Observability | Memperjelas status sumber, waktu pembaruan, kegagalan layanan, dan penanganan data kedaluwarsa. |
| 🔧 Pengembangan lanjutan | Dashboard Integration | Meninjau konsistensi ringkasan status sumber dan pengalaman lintas modul. |

Status terintegrasi berarti jalur fitur tersedia di aplikasi, bukan jaminan bahwa semua penyedia eksternal selalu aktif atau semua wilayah memiliki data. Prioritas pengembangan berikutnya mengikuti hasil pengujian, keamanan, ketersediaan sumber, dan kebutuhan proyek.

## 🛡️ Google Safe Browsing

Backend dapat menggabungkan hasil heuristik lokal dengan pemeriksaan reputasi melalui Google Safe Browsing Lookup API.

| Status | Arti |
|---|---|
| `threat` | Layanan melaporkan kecocokan ancaman. Hindari membuka tautan atau memasukkan informasi pribadi. |
| `no_match` | Tidak ditemukan kecocokan ancaman dari pemeriksaan tersebut. Bukan jaminan URL aman. |
| `unavailable` | Pemeriksaan eksternal tidak tersedia. Hasil heuristik lokal tetap merupakan lapisan pemeriksaan terpisah. |

API key harus disimpan sebagai environment variable di backend, bukan di frontend, repository, respons API, atau log.

Untuk deployment systemd, gunakan file environment dengan izin akses terbatas.

Pemeriksaan reputasi bukan pemindaian menyeluruh terhadap isi situs. Ancaman baru atau URL yang belum terdaftar mungkin tidak terdeteksi.

## 📁 Analisis File dan QR

- QR didekode di browser; URL hasil dekode tidak dibuka otomatis.
- APK/ZIP diperiksa secara statis dan tidak dijalankan sebagai aplikasi.
- Analisis bersifat heuristik dan bukan pengganti antivirus.
- AndroidManifest.xml dianalisis menggunakan AAPT jika tersedia; jika gagal, keterbatasan analisis dicantumkan pada hasil.
- Format arsip atau kompresi tertentu dapat ditolak atau dianalisis secara terbatas.
- Pemeriksaan Manifest APK memerlukan AAPT. Lokasi executable dapat ditentukan melalui `AAPT_PATH`.

## 🔐 Privasi dan Keamanan

- Data nomor pada tampilan publik disamarkan sesuai mekanisme privasi aplikasi.
- Data URL yang ditampilkan atau disiarkan melewati mekanisme penyaringan privasi.
- File yang diunggah ditangani melalui alur pemindaian backend.
- Server tidak membuka URL target secara langsung untuk memeriksa isi situs. Namun, ketika pemeriksaan reputasi aktif, URL dikirim ke Google Safe Browsing untuk pencocokan reputasi.
- Jangan mengirim URL rahasia atau sensitif ke layanan pemeriksaan eksternal.
- API key dan token harus disimpan di environment variable atau mekanisme secret yang sesuai, bukan di repository.

## ⚠️ Batasan

- Heuristik dapat menghasilkan false positive maupun false negative.
- Skor risiko bukan probabilitas bahwa situs atau file berbahaya.
- Pemeriksaan reputasi bergantung pada ketersediaan dan cakupan data layanan eksternal.
- Pemeriksaan APK/ZIP tidak setara dengan analisis malware mendalam.
- Data World Monitoring bergantung pada sumber satelit, waktu pembaruan, dan ketersediaan API.
- Hotspot satelit tidak boleh dianggap sebagai kejadian kebakaran yang telah terkonfirmasi.
- Kegagalan layanan eksternal dapat mengurangi kelengkapan data tanpa berarti keseluruhan aplikasi berhenti bekerja.
- Fitur roadmap dapat berubah sebelum implementasi dan pengujian selesai.

## 🧪 Pengujian

Jalankan pengujian backend:

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

Pastikan tes dan build berhasil sebelum deployment. Untuk perubahan yang menyentuh integrasi eksternal, periksa juga status layanan dan penanganan kondisi gagal.

## 🚀 Menjalankan Proyek

Persyaratan umum: Node.js dan npm yang kompatibel dengan dependensi proyek.

Clone repository:

```bash
git clone https://github.com/avinskuy/inSpectre-main.git
cd inSpectre-main
```

Instal dependensi dan jalankan pengujian backend:

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

Konfigurasikan environment backend sesuai layanan yang digunakan. Variabel yang mungkin diperlukan mencakup:

- `GOOGLE_SAFE_BROWSING_API_KEY` — pemeriksaan reputasi URL.
- `NASA_FIRMS_MAP_KEY` — data hotspot NASA FIRMS.
- `OPENROUTER_API_KEY` — integrasi model bahasa, sesuai konfigurasi backend.

Ikuti konfigurasi aktual pada proyek sebelum menjalankan server. Jangan menaruh API key, token, atau rahasia lainnya di repository maupun frontend.

## 📡 Endpoint API

Endpoint berikut merupakan daftar endpoint yang tercatat pada proyek. Kebutuhan parameter, metode HTTP, dan format respons harus mengikuti implementasi masing-masing route.

| Endpoint | Fungsi |
|---|---|
| `/api/health` | Status kesehatan API. |
| `/api/stats` | Statistik dashboard. |
| `/api/recent` | Aktivitas terbaru. |
| `/api/news` | Data berita keamanan. |
| `/api/check/:nomor` | Pemeriksaan nomor. |
| `/api/scan-file` | Alur pemindaian file. |
| `/api/scan` | Alur pemindaian yang tersedia pada backend. |
| `/api/assistant` | Integrasi asisten. |
| `/api/environment/hotspots` | Data hotspot untuk World Monitoring. |

Daftar ini perlu dicocokkan dengan route backend terbaru sebelum dijadikan dokumentasi API yang definitif.

## 📄 Lisensi

Proyek ini menggunakan lisensi MIT. Lihat file [`LICENSE`](LICENSE) untuk ketentuan lengkap.
