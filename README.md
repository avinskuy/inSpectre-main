# inSpectre

### Platform Intelijen Lingkungan dan Ancaman

Platform terpadu untuk meningkatkan kewaspadaan terhadap ancaman digital dan memantau informasi lingkungan. inSpectre menggabungkan pemeriksaan keamanan, data lingkungan, ringkasan situasi publik, serta panduan keamanan praktis dalam satu antarmuka.

**Dikembangkan untuk ISCOMFEST 2026.**

<p>
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=fff" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=fff" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=fff" alt="SQLite" />
</p>

---

## Gambaran umum

inSpectre adalah platform **Intelijen Lingkungan dan Ancaman** yang membantu pengguna memahami indikator ancaman digital serta memantau informasi lingkungan tertentu. Modul-modulnya mencakup pemeriksaan URL dan nomor telepon, inspeksi file dan QR, pemantauan lingkungan, statistik agregat publik, berita keamanan, serta materi edukasi.

Platform ini merupakan alat informasi dan peningkatan kewaspadaan. Temuan yang ditampilkan adalah indikator yang perlu dipahami sesuai konteks dan, bila diperlukan, diverifikasi secara independen.

## Fitur yang tersedia

### Keamanan digital
- **Analisis URL:** pemeriksaan heuristik terhadap pola URL mencurigakan, karakteristik domain, dan indikator phishing.
- **Reputasi URL:** pemeriksaan opsional melalui Google Safe Browsing jika API key dikonfigurasi di server.
- **Pemeriksaan nomor telepon:** sinyal laporan komunitas dan pemeriksaan reputasi dari penyedia yang didukung.
- **Inspeksi APK dan ZIP:** pemeriksaan statis struktur arsip serta analisis Android Manifest jika AAPT tersedia. File tidak dijalankan.
- **Inspeksi QR:** decoding QR di browser; alamat hasil decoding tidak dibuka secara otomatis.
- **Riwayat pemeriksaan privat:** pengguna terdaftar hanya dapat melihat catatan pemeriksaannya sendiri. Dashboard publik hanya menampilkan statistik agregat.

### Intelijen lingkungan
- **Titik panas satelit:** data anomali termal NASA FIRMS.
- **Kualitas udara:** observasi yang tersedia dari OpenAQ.
- **Cuaca dan peringatan:** data prakiraan serta peringatan BMKG.
- **Informasi gempa:** data gempa yang tersedia dari BMKG.
- **Pemantauan interaktif:** penyajian lapisan data lingkungan yang didukung melalui peta.

### Modul platform
- **Dashboard publik:** statistik agregat pemeriksaan dan status layanan.
- **Berita keamanan:** kumpulan berita terkait keamanan dari sumber backend yang dikonfigurasi.
- **Asisten AI:** asisten opsional berbahasa Indonesia melalui penyedia model OpenRouter yang dikonfigurasi.
- **Edukasi keamanan:** materi pembelajaran dan panduan praktis.
- **Opsi aksesibilitas:** preferensi tampilan dan gerakan yang didukung.

Ketersediaan data eksternal bergantung pada kondisi penyedia, akses API, konektivitas jaringan, dan konfigurasi server.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18, Vite, JavaScript |
| Pemetaan | Leaflet, React Leaflet, OpenStreetMap |
| Backend | Node.js, Express |
| Database | SQLite melalui better-sqlite3 |
| Pembaruan real-time | Socket.IO |
| Pembacaan QR | jsQR |
| Sumber intelijen eksternal | Google Safe Browsing, NASA FIRMS, OpenAQ, BMKG |
| Penyedia AI | OpenRouter (opsional) |
| Pengujian | Node.js built-in test runner |
| Dukungan deployment | Docker, Docker Compose, Nginx, Cloudflare Pages Function proxy |

## Arsitektur

```text
Browser
  |
  +-- Aplikasi React
  |     +-- Nexus dan dashboard publik
  |     +-- Analisis keamanan digital
  |     +-- Pemantauan lingkungan
  |     +-- Berita, edukasi, dan asisten
  |     +-- Login dan riwayat pemeriksaan privat
  |
  +-- Permintaan /api dari origin yang sama
          |
          v
     Express API
          |
          +-- Middleware bersama
          |     +-- CORS dan parsing JSON
          |     +-- Rate limit per kelompok endpoint
          |
          +-- Modul route berdasarkan domain
          |     +-- Autentikasi dan sesi
          |     +-- Analisis URL dan Safe Browsing
          |     +-- Pemeriksaan nomor dan provider reputasi
          |     +-- Inspeksi APK dan ZIP
          |     +-- Berita, lingkungan, dan platform
          |
          +-- Layanan berdasarkan domain
          |     +-- SQLite dan helper privasi
          |     +-- Provider data eksternal
          |
          +-- Socket.IO
                +-- Pembaruan statistik agregat dashboard
```

Frontend menggunakan permintaan `/api` dari origin yang sama. Pada jalur deployment Cloudflare Pages, Pages Function meneruskan permintaan tersebut ke backend yang dikonfigurasi.

## Struktur repositori

```text
.
├── .github/
│   └── workflows/          # Otomatisasi integrasi berkelanjutan (CI)
├── backend/
│   ├── data/               # Dataset referensi publik beserta lisensinya
│   ├── middleware/         # Middleware permintaan bersama
│   ├── routes/             # Route HTTP berdasarkan domain API
│   ├── services/
│   │   ├── accounts/       # Autentikasi dan sesi
│   │   ├── environment/    # Layanan NASA FIRMS, OpenAQ, dan BMKG
│   │   ├── files/          # Inspeksi APK dan ZIP
│   │   ├── news/           # Agregasi berita keamanan
│   │   ├── phones/         # Pemeriksaan nomor dan provider reputasi
│   │   ├── security/       # Heuristik URL dan Safe Browsing
│   │   └── storage/        # Persistensi SQLite dan helper privasi
│   ├── test/               # Pengujian unit dan integrasi backend
│   ├── config.js           # Konfigurasi saat runtime
│   ├── emitter.js          # Gerbang event real-time
│   ├── server.js           # Titik masuk Express API
│   ├── Dockerfile
│   └── package.json
├── deploy/
│   ├── nginx.conf
│   └── smoke-test.sh
├── frontend/
│   ├── functions/          # Proxy API Cloudflare Pages
│   ├── public/             # Aset media statis
│   └── src/
│       ├── components/
│       ├── lib/
│       └── pages/
├── docker-compose.yml
└── README.md
```

Endpoint HTTP dikelompokkan di `backend/routes/` berdasarkan domain API: autentikasi, platform/asisten, berita, data lingkungan, pemeriksaan nomor, analisis URL, dan inspeksi file. Rate limiter bersama berada di `backend/middleware/`. File `backend/server.js` dibatasi untuk menyiapkan aplikasi, menggabungkan router, menginisialisasi Socket.IO, dan menjalankan proses server. Logika bisnis berada di `backend/services/`, yang dikelompokkan berdasarkan akun, lingkungan, file, berita, nomor telepon, keamanan, serta penyimpanan dan privasi. Image Docker menyalin direktori runtime secara eksplisit; file pengujian tetap berada di `backend/test/` dan dijalankan melalui workflow CI.

## Memulai proyek

### Persyaratan
- Node.js versi 18 atau lebih baru
- npm
- Toolchain kompilasi C++ yang didukung better-sqlite3 pada platform yang tidak menyediakan binary siap pakai

### 1. Clone repositori

```bash
git clone https://github.com/avinskuy/inSpectre-main.git
cd inSpectre-main
```

### 2. Konfigurasi backend

```bash
cd backend
npm install
cp .env.example .env
```

Atur nilai yang diperlukan di `backend/.env`. Jangan commit file `.env` asli atau membagikan API key.

Integrasi opsional yang umum digunakan:

| Variabel | Kegunaan |
|---|---|
| `GOOGLE_SAFE_BROWSING_API_KEY` | Pemeriksaan reputasi URL |
| `NASA_FIRMS_MAP_KEY` | Data titik panas NASA FIRMS |
| `OPENAQ_API_KEY` | Akses OpenAQ jika diperlukan endpoint yang digunakan |
| `WHOTAGME_API_KEY` | Pemeriksaan reputasi nomor telepon opsional |
| `OPENROUTER_API_KEY` | Asisten AI |
| `AAPT_PATH` | Lokasi executable Android AAPT untuk analisis Manifest APK |
| `CORS_ORIGIN` | Origin frontend yang diizinkan, dipisahkan koma |
| `TRUST_PROXY` | Atur ke `1` hanya jika berjalan di belakang reverse proxy tepercaya |
| `INSPECTRE_DATA_DIR` | Direktori database SQLite dan file data lokal |
| `INSPECTRE_DB_PATH` | Lokasi database SQLite khusus (opsional) |
| `INSPECTRE_NUMBERS_FILE` | Lokasi file laporan nomor komunitas (opsional) |

Pengaturan autentikasi untuk akun demo/juri opsional dijelaskan di `backend/.env.example`. Gunakan kata sandi kuat dan unik serta simpan rahasia hanya di environment server.

### 3. Jalankan backend

```bash
npm start
```

API mendengarkan pada port `5000` secara default. Untuk pengembangan lokal, biarkan backend berjalan di terminal tersendiri.

### 4. Jalankan frontend

Buka terminal kedua:

```bash
cd frontend
npm install
npm run dev
```

Vite menyajikan frontend pada port `3000` dan meneruskan permintaan `/api` serta `/socket.io` ke `http://localhost:5000` secara default. Target proxy dapat diubah menggunakan `VITE_PROXY_TARGET`.

## Autentikasi dan privasi

- Registrasi dan login menggunakan sesi yang dikelola server.
- Cookie sesi menggunakan atribut HttpOnly dan tidak dapat dibaca JavaScript frontend.
- Endpoint riwayat privat mewajibkan sesi terautentikasi dan hanya mengembalikan catatan milik akun tersebut.
- Dashboard publik menggunakan statistik agregat dan tidak membuka riwayat pemeriksaan individual.
- Detail hasil pemeriksaan tidak disiarkan ke seluruh klien Socket.IO.
- Gunakan HTTPS pada lingkungan deployment dan konfigurasi trusted proxy dengan benar.
- Penyimpanan sementara atau ephemeral dapat menghilangkan akun, sesi, dan riwayat ketika instance diganti atau dimulai ulang. Gunakan penyimpanan persisten untuk deployment jangka panjang.

## Keamanan dan batas operasional

- Rate limiter membatasi jumlah permintaan per alamat klien pada masing-masing kelompok endpoint. Penyimpanan penghitung dibatasi agar jumlah alamat unik tidak terus menambah penggunaan memori.
- Server tidak membuka atau mengambil URL yang diperiksa secara langsung. URL dikirim sebagai data pemeriksaan ke endpoint Google Safe Browsing yang tetap jika integrasi tersebut dikonfigurasi.
- Pemeriksaan APK menggunakan AAPT melalui pemanggilan proses tanpa shell, dengan batas waktu dan batas ukuran output.
- Inspeksi arsip dilakukan secara statis di memori. Sistem tidak mengekstrak isi arsip ke direktori publik atau menjalankan file di dalamnya.
- Konfigurasi `TRUST_PROXY` harus sesuai topologi reverse proxy. Jangan mengaktifkannya jika aplikasi dapat diakses langsung dari jaringan yang tidak tepercaya.
- Rate limiter berbasis memori berlaku per proses/instance; deployment multi-instance memerlukan pembatasan terpusat pada lapisan proxy atau penyimpanan bersama.
- Temuan heuristik bukan bukti mutlak bahwa URL, nomor telepon, atau file berbahaya maupun aman.

## Referensi API

Semua route disajikan di bawah prefix `/api`.

| Metode | Endpoint | Akses | Kegunaan |
|---|---|---|---|
| `GET` | `/health` | Publik | Status kesehatan API |
| `POST` | `/auth/register` | Publik, dibatasi | Membuat akun dan sesi |
| `POST` | `/auth/login` | Publik, dibatasi | Memulai sesi |
| `POST` | `/auth/logout` | Memerlukan konteks sesi | Mengakhiri sesi saat ini |
| `GET` | `/auth/me` | Terautentikasi | Mengambil akun yang sedang masuk |
| `GET` | `/stats` | Publik | Statistik agregat dashboard |
| `GET` | `/recent` | Terautentikasi | Riwayat pemeriksaan akun saat ini |
| `GET` | `/news` | Publik | Feed berita keamanan |
| `POST` | `/assistant` | Publik, dibatasi | Asisten AI |
| `GET` | `/check/:nomor` | Publik, dibatasi | Pemeriksaan nomor telepon |
| `POST` | `/scan` | Publik, dibatasi | Pemeriksaan URL |
| `POST` | `/scan-file` | Publik, dibatasi | Pemeriksaan file |
| `GET` | `/environment/hotspots` | Publik | Data titik panas NASA FIRMS |
| `GET` | `/environment/air-quality` | Publik | Observasi OpenAQ |
| `GET` | `/environment/regions` | Publik | Data wilayah administratif BMKG |
| `GET` | `/environment/weather` | Publik | Prakiraan BMKG |
| `GET` | `/environment/weather-warnings` | Publik | Peringatan cuaca BMKG |
| `GET` | `/environment/disasters` | Publik | Informasi gempa BMKG |

Pemeriksaan nomor menerima nomor telepon melalui parameter route. Route cuaca menerima parameter query `adm4`. Detail request dan response didefinisikan pada handler di `backend/routes/` dan layanan domain terkait di `backend/services/`.

## Pengujian

Jalankan pengujian backend:

```bash
cd backend
npm test
```

Bangun frontend:

```bash
cd frontend
npm install
npm run build
```

Jalankan kedua pemeriksaan sebelum mengusulkan deployment. Pengujian yang bergantung pada layanan eksternal perlu dipahami sesuai konfigurasi mock atau integrasi langsung yang digunakan.

## Deployment

- **Docker:** gunakan `docker-compose.yml` di root repositori untuk menjalankan frontend dan backend bersama.
- **Nginx:** `deploy/nginx.conf` berisi konfigurasi reverse proxy yang digunakan pada setup deployment.
- **Cloudflare Pages:** fungsi proxy API berada di `frontend/functions/api/[[path]].js`.
- **Hosting backend:** atur environment variable, penyimpanan data persisten, origin yang diizinkan, dan health check pada penyedia hosting.

Lihat [docs/deployment.md](docs/deployment.md) untuk alur deployment yang berlaku. Perbarui dokumentasi tersebut setiap kali konfigurasi hosting berubah.

## Keterbatasan penting

- Skor heuristik bukan probabilitas dan tidak dapat menjamin bahwa URL, nomor telepon, atau file aman maupun berbahaya.
- Hasil pemeriksaan reputasi yang bersih bukan bukti keamanan.
- Inspeksi APK dan ZIP adalah analisis statis, bukan eksekusi malware atau analisis sandbox penuh.
- Analisis Manifest APK bergantung pada ketersediaan dan konfigurasi AAPT.
- Observasi hotspot adalah anomali termal, bukan konfirmasi kebakaran.
- Observasi dan prakiraan lingkungan dapat terlambat, tidak lengkap, atau tidak tersedia.
- Provider eksternal dapat menerapkan rate limit, batas cakupan, atau persyaratan API key.

## Lisensi

Proyek ini menggunakan lisensi MIT. Lihat [LICENSE](LICENSE).
