# Panduan Instalasi Our Class

**Versi 1.0.0.** Panduan ini ditulis untuk wali kelas yang belum pernah memakai Apps Script atau GitHub. Ikuti urutannya dari atas ke bawah. Setiap langkah punya tanda berhasil, jadi Anda bisa mencocokkan hasilnya sebelum lanjut.

---

## 0. Gambaran singkat

Our Class terdiri dari tiga bagian:

| Bagian | Isinya | Tempatnya |
|---|---|---|
| **Backend** | `Kode.gs` dan `appsscript.json`, yaitu "otak" aplikasi | Google Apps Script di akun Google Anda |
| **Database** | Spreadsheet `OurClass_DB`, spreadsheet `OurClass_Sensitif`, dan folder `OurClass` | Google Drive Anda (dibuat otomatis) |
| **Frontend** | Tampilan aplikasi: `index.html`, folder `css/` dan `js/` | GitHub Pages (gratis) |

Berkas yang Anda terima:

- **`Kode.gs`** dan **`appsscript.json`** datang sebagai berkas terpisah. Isinya Anda salin ke editor Apps Script. Kedua berkas ini **tidak** diunggah ke GitHub.
- **`our-class.zip`** berisi frontend. Setelah diekstrak, isi folder inilah yang diunggah ke GitHub.
- **`PANDUAN-INSTALASI.md`** adalah dokumen ini. Salinannya juga ada di dalam ZIP.

### Apa yang diisi otomatis dan apa yang Anda isi sendiri

| Nilai | Siapa yang mengisi | Disimpan di |
|---|---|---|
| ID spreadsheet, ID folder Drive | Otomatis oleh `setupAppEnvironment` | Script Properties |
| Kunci rahasia sesi (`SESSION_SECRET`) | Otomatis, dibuat acak | Script Properties |
| Sandi pengguna | Tidak pernah disimpan. Yang disimpan hanya hash dan salt | Script Properties |
| Sandi awal wali kelas | Otomatis, tampil **sekali** di log | Wajib Anda ganti saat login pertama |
| **URL `/exec` Web App** | **Anda** | `js/config.js` (satu-satunya yang Anda isi) |

> Tidak ada token, kata sandi, atau kunci API yang perlu Anda ketik ke dalam kode. URL `/exec` memang boleh terlihat publik. Keamanan aplikasi dijaga oleh login dan pemeriksaan peran di server, bukan dengan menyembunyikan URL.

---

## Bagian A — Memasang backend (Google Apps Script)

### A1. Buat proyek Apps Script

1. Buka **https://script.google.com** dengan akun Google yang akan menjadi pemilik data kelas.
2. Klik **Proyek baru** (*New project*).
3. Klik judul "Proyek tanpa judul" di kiri atas, lalu ganti menjadi **Our Class API**.

### A2. Tempel `Kode.gs`

1. Di panel kiri ada berkas `Kode.gs` atau `Code.gs`. Klik berkas itu.
2. Hapus semua isinya (Ctrl+A lalu Delete).
3. Buka berkas **`Kode.gs`** yang Anda terima, salin **seluruh** isinya, lalu tempel ke editor.
4. Tekan **Ctrl+S** untuk menyimpan.

✅ **Tanda berhasil:** tidak ada garis merah, dan di atas editor muncul daftar fungsi, misalnya `setupAppEnvironment`.

### A3. Tempel `appsscript.json`

1. Klik ikon **⚙️ Setelan proyek** (*Project Settings*) di panel kiri.
2. Centang **Tampilkan file manifes "appsscript.json" di editor**.
3. Kembali ke **Editor** (ikon `< >`). Sekarang ada berkas `appsscript.json`.
4. Hapus isinya, tempel isi berkas **`appsscript.json`** yang Anda terima, lalu simpan.

Berkas ini mengatur zona waktu **Asia/Jakarta**. Tanpa berkas ini, tanggal absensi bisa bergeser satu hari.

### A4. Jalankan setup (sekali saja)

1. Di bilah atas editor, pilih fungsi **`setupAppEnvironment`**, lalu klik **▶ Jalankan** (*Run*).
2. Google akan meminta izin:
   - Klik **Tinjau izin**, lalu pilih akun Anda.
   - Muncul peringatan "Google belum memverifikasi aplikasi ini". **Ini normal**, karena skrip ini milik Anda sendiri. Klik **Lanjutan** → **Buka Our Class API (tidak aman)** → **Izinkan**.
3. Tunggu sampai **Log eksekusi** menampilkan baris seperti ini:

```
🚀 Menyiapkan Our Class v1.0.0 …
📁 Folder dibuat: https://drive.google.com/drive/folders/…
🗃️ Spreadsheet dibuat: OurClass_DB
🗃️ Spreadsheet dibuat: OurClass_Sensitif

🔐 AKUN WALI KELAS (catat sekarang — hanya tampil sekali)
   Username : walikelas
   Sandi    : XXXXXXXXXXXX
   Anda wajib mengganti sandi ini saat login pertama.

✅ Setup selesai. Spreadsheet: https://docs.google.com/spreadsheets/d/…
```

4. **Catat username dan sandinya sekarang.** Sandi ini hanya tampil sekali dan wajib Anda ganti saat pertama kali masuk.

Fungsi `setupAppEnvironment` **aman dijalankan ulang**. Menjalankannya lagi tidak menimpa data, sandi, atau kunci rahasia yang sudah ada. Yang dilakukannya hanya melengkapi bagian yang hilang, misalnya kolom baru setelah update.

> Kalau sandi terlewat dicatat, jalankan fungsi **`resetSandiWaliKelas`**. Sandi sementara yang baru akan tampil di log.

**Opsional:** untuk mencoba aplikasi dengan data contoh, jalankan **`isiDataContoh`**. Fungsi ini hanya bekerja bila sheet Siswa masih kosong.

### A5. Deploy sebagai Web App

1. Klik tombol biru **Terapkan** (*Deploy*) → **Deployment baru** (*New deployment*).
2. Klik ikon ⚙️ di samping "Pilih jenis", lalu pilih **Aplikasi web** (*Web app*).
3. Isi:
   - **Deskripsi:** `Our Class v1.0.0`
   - **Jalankan sebagai** (*Execute as*): **Saya** (*Me*)
   - **Yang memiliki akses** (*Who has access*): **Siapa saja** (*Anyone*)
4. Klik **Terapkan** (*Deploy*), lalu salin **URL aplikasi web**. Bentuknya:
   `https://script.google.com/macros/s/AKfy…panjang…/exec`

✅ **Tanda berhasil:** buka URL itu di tab baru. Akan muncul teks seperti ini:

```
{"success":true,"data":{"app":"Our Class","versi":"1.0.0","pesan":"API aktif. Gunakan POST untuk aksi lain."},…}
```

> ⚠️ Gunakan URL yang berakhiran **`/exec`**, bukan `/dev`. URL `/dev` hanya bisa dibuka oleh Anda sendiri.

---

## Bagian B — Memasang frontend ke GitHub Pages

### B1. Ekstrak ZIP dan periksa isinya

1. Ekstrak **`our-class.zip`**. Di Windows: klik kanan → **Extract All…** → pilih lokasi, misalnya `Documents`.
2. Buka folder hasil ekstraknya, misalnya `C:\Users\NamaAnda\Documents\our-class`.
3. Isinya harus **langsung** seperti ini:

```
our-class\               ← folder INI yang nanti di-"git init"
├── index.html           ← wajib terlihat langsung di sini
├── README.md
├── PANDUAN-INSTALASI.md
├── css\
│   └── style.css
└── js\
    ├── config.js
    ├── api.js, app.js, ui.js
    └── pages\ (beranda.js, absensi.js, …)
```

> Kalau yang terlihat justru folder `our-class` lagi (folder di dalam folder), masuk satu tingkat sampai `index.html` terlihat. Folder tempat `index.html` berada itulah folder kerja Anda.

### B2. Isi URL backend di `js/config.js`

1. Buka `js\config.js` dengan Notepad. Klik kanan → **Buka dengan** → **Notepad**.
2. Ganti `GANTI_DENGAN_ID_DEPLOYMENT` sehingga seluruh alamat sama dengan URL `/exec` dari langkah A5:

```js
window.APP_CONFIG = { GAS_URL: 'https://script.google.com/macros/s/AKfy…/exec' };
```

3. Simpan. Pastikan tanda kutip `'…'` tetap ada.

> Kalau langkah ini terlewat, aplikasi akan menampilkan pesan "Konfigurasi belum lengkap" dan tidak bisa dipakai.

### B3. Pasang Git dan atur identitas (sekali saja per komputer)

1. **Windows:** unduh dari **https://git-scm.com/download/win** dan pasang dengan pilihan bawaan.
   **Mac:** buka Terminal, ketik `git --version`. Bila Git belum ada, macOS akan menawarkan pemasangan.
2. Buka **PowerShell** (Windows) atau **Terminal** (Mac), lalu ketik:

```bash
git --version
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

`user.name` hanya label di riwayat perubahan dan bebas diisi apa saja. `user.email` sebaiknya sama dengan email akun GitHub Anda.

### B4. Buat akun dan repository GitHub

1. Daftar di **https://github.com** bila belum punya. Username Anda akan menjadi bagian alamat situs: `username.github.io`.
2. Klik **+** (kanan atas) → **New repository**.
3. Isi **Repository name**, misalnya `our-class`. Pilih **Public**, karena GitHub Pages gratis hanya untuk repo publik. Ini aman: frontend tidak berisi rahasia apa pun.
4. **Jangan** centang *Add a README*, *.gitignore*, atau *license*.
5. Klik **Create repository**. Biarkan halaman itu terbuka.

### B5. Masuk ke folder yang BENAR, lalu periksa

Ini langkah yang paling sering keliru. Buka folder `our-class` di File Explorer, klik **address bar**, ketik `powershell`, lalu tekan Enter. PowerShell langsung terbuka di folder itu. Lalu ketik:

```powershell
dir
```

✅ **Wajib terlihat:** `index.html`, `css`, dan `js` di daftar teratas.
❌ Kalau yang terlihat folder `our-class` lagi, ketik `cd our-class`, lalu `dir` sekali lagi.

> Jangan lanjut sebelum `index.html` terlihat. Git tetap menerima folder yang salah tanpa pesan error, tetapi situsnya nanti tampil **404**.

### B6. Kirim ke GitHub (satu per satu)

Jalankan perintah berikut **satu per satu**. Setelah setiap perintah, cocokkan hasilnya:

```bash
git init
```
Hasil: `Initialized empty Git repository in …`

```bash
git add .
```
Perhatikan **titik** di akhir perintah. Bila berhasil, tidak ada output.

```bash
git commit -m "Upload pertama Our Class"
```
Hasil: daftar berkas, misalnya `create mode 100644 index.html`.

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/our-class.git
git push -u origin main
```
Ganti `USERNAME` dengan username GitHub Anda.

Saat `git push` meminta login:

- **Username:** username GitHub Anda.
- **Password:** **Personal Access Token**, bukan sandi akun GitHub. Cara membuatnya ada di B7.
- Saat token ditempel, layar **tetap kosong**. Ini normal. Di PowerShell, tempel dengan klik kanan, lalu tekan Enter.

✅ **Tanda berhasil:** muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### B7. Membuat Personal Access Token (bila diminta)

1. Buka **https://github.com/settings/tokens** → **Generate new token** → **Generate new token (classic)**.
2. **Note:** `our-class-push`. **Expiration:** 90 days. Centang scope ✅ **repo**.
3. Klik **Generate token**, lalu salin token yang diawali `ghp_…`. Token **hanya tampil sekali**. Jangan bagikan dan jangan simpan di folder proyek.
4. Ulangi `git push -u origin main`, lalu tempel token sebagai password.

> Kalau terminal terus menyulitkan, Anda bisa memakai **GitHub Desktop** (https://desktop.github.com): **Add Local Repository** → pilih folder `our-class` → **Publish repository**.

### B8. Aktifkan GitHub Pages

1. Di halaman repo, buka **Settings** → **Pages** di menu kiri.
2. Atur **Source:** *Deploy from a branch*. **Branch:** `main` dan `/ (root)`. Klik **Save**.
3. Tunggu 1–2 menit, lalu muat ulang halaman. Akan muncul tulisan **"Your site is live at https://USERNAME.github.io/our-class/"**.
4. Centang ✅ **Enforce HTTPS**.

✅ **Tanda berhasil:** alamat itu menampilkan halaman **Masuk** Our Class dengan ilustrasi papan tulis.

---

## Bagian C — Login pertama dan pengaturan awal

1. Buka situs Anda, lalu masuk dengan `walikelas` dan sandi dari log A4.
2. Aplikasi langsung meminta **sandi baru**: minimal 8 karakter, berisi huruf dan angka, dan tidak memuat username.
3. Buka **Pengaturan**:
   - **Identitas Aplikasi:** nama aplikasi, logo (bisa dipotong menjadi persegi), warna utama dan aksen. Ada pratinjau langsung, dan aplikasi memeriksa kontras warna.
   - **Data Kelas:** nama sekolah, nama kelas, nama wali kelas, tahun ajaran, dan semester. Data ini dipakai di kop laporan PDF.
4. Buka **Kas** → ikon pengaturan: atur nominal iuran, periode (mingguan atau bulanan), dan tanggal mulai.
5. Buka **Siswa**: tambah siswa satu per satu, atau **Impor** dari spreadsheet atau CSV (lihat Bagian D).
6. Buka **Jadwal & Piket**: isi mata pelajaran dan regu piket.
7. Buka **Kelola Akun** → **Tambah Akun** untuk membuat akun **sekretaris** yang Anda tunjuk. Sandi sementaranya tampil **sekali** di layar. Sekretaris wajib menggantinya saat masuk pertama.

### Rekomendasi privasi: menu Periode

Sesuai keputusan di PRD, bawaan aplikasi memberi akses menu **Periode** ke **wali kelas dan semua sekretaris**. Data periode adalah data kesehatan siswi. Kami menyarankan membatasinya:

**Kelola Akun → Akses Periode → pilih "Hanya wali kelas"**, atau **"Wali kelas + akun yang dipilih"** bila ada sekretaris putri yang Anda tunjuk.

Apa pun pilihannya, data periode:

- disimpan di spreadsheet terpisah (`OurClass_Sensitif`);
- tidak pernah di-cache;
- tidak muncul di dashboard, profil siswa, atau PDF;
- dicatat di Log Aktivitas setiap kali dibuka atau diubah.

**Jangan bagikan spreadsheet `OurClass_Sensitif` kepada siapa pun.**

---

## Bagian D — Impor data dari spreadsheet lama

Menu: **Pengaturan → Impor Data** (khusus wali kelas).

**Prinsip:** spreadsheet sumber hanya **dibaca**, tidak pernah diubah. Siswa dicocokkan berdasarkan **NIS**, jadi menjalankan impor dua kali tidak membuat data ganda.

### D1. Dari spreadsheet daftar siswa

1. Pastikan spreadsheet sumber milik **akun Google yang sama** dengan pemilik backend.
2. Tempel URL atau ID spreadsheet, lalu pilih nama sheet bila ada lebih dari satu.
3. Klik **Pindai (dry-run)**. Aplikasi menghitung siswa yang akan ditambah, diperbarui, dan dilewati **tanpa menulis apa pun**.
4. Periksa tabel hasil dan peringatannya, lalu klik **Jalankan Impor**.

Kolom dikenali dari **nama header**, jadi urutannya bebas. Minimal harus ada kolom **NIS** dan **Nama**. Kolom lain yang dikenali: no absen, panggilan, jenis kelamin (L/P), tanggal lahir, alamat, nama wali, dan kontak wali. Nomor HP dirapikan otomatis ke format `08…`, dan tanggal dalam berbagai format ikut dikenali.

### D2. Dari berkas CSV

Klik **Unduh template CSV**, isi datanya, lalu unggah → **Pindai** → **Impor**. Bila ingin data yang sudah ada ikut diperbarui, centang **Timpa yang sudah ada**.

### D3. Upgrade dari database Our Class lain (pindah proyek)

Bila suatu saat Anda membuat proyek Apps Script baru, misalnya untuk versi berikutnya:

1. Pasang proyek baru dengan **akun Google yang sama** (Bagian A), supaya foto siswa dan bukti kas di Drive tetap terbaca.
2. Di aplikasi baru: **Impor Data** → tempel URL `OurClass_DB` lama → **Pindai** → **Jalankan Impor**. Siswa, hari libur, absensi, kas, jadwal, piket, perkembangan, dan notulensi ikut pindah.
3. Periksa hasilnya dan uji dengan satu akun.
4. **Tepat sebelum beralih**, jalankan impor **sekali lagi** untuk menangkap data yang masuk ke aplikasi lama selama masa transisi.
5. Ganti `GAS_URL` di `js/config.js` ke URL baru, lalu push (Bagian H).

Ada yang sengaja **tidak** ikut dipindahkan: akun pengguna, pengaturan, data periode, dan sesi login. Semua orang perlu masuk ulang, dan akun sekretaris dibuat ulang di aplikasi baru.

---

## Bagian E — Keamanan dan rahasia

- **Semua rahasia ada di Script Properties**, yang hanya bisa dibaca kode server dan editor proyek Apps Script. Rahasia tidak ada di kode, spreadsheet, atau GitHub.
- **Jangan menambah editor** ke proyek Apps Script sembarangan. Siapa pun yang bisa mengedit proyek bisa melihat Script Properties.
- **Jangan menghapus `SESSION_SECRET`.** Bila terhapus, aplikasi membuatnya ulang dan semua orang harus masuk lagi.
- Sheet **`AppConfig`** hanya catatan baca-saja. Mengubahnya tidak berpengaruh apa-apa.
- Setelah 5 kali salah sandi, akun **dikunci 15 menit**.
- Sesi login berlaku **8 jam**. Akun yang dinonaktifkan atau di-reset sandinya langsung keluar dari semua perangkat.

Fungsi yang bisa Anda jalankan dari editor Apps Script:

| Fungsi | Kegunaan |
|---|---|
| `resetSandiWaliKelas` | Lupa sandi wali kelas. Sandi sementara baru tampil di log |
| `rotasiSecretSesi` | Keluarkan **semua** orang dari semua perangkat, misalnya bila HP sekretaris hilang |
| `cekStatus` | Diagnosa singkat: spreadsheet, trigger, ukuran Script Properties. Tidak menampilkan rahasia |
| `bersihkanCache` | Jalankan setelah Anda mengedit data **langsung di spreadsheet** |

> Sandi sekretaris yang lupa cukup di-reset dari **Kelola Akun → tombol Reset Sandi** di baris akun tersebut.

---

## Bagian F — Kecepatan dan kuota

- Aplikasi menyimpan data yang sering dibuka di **cache server**. Cache otomatis diperbarui setiap kali ada perubahan lewat aplikasi.
- Bila Anda **mengedit langsung di spreadsheet**, perubahan baru terlihat setelah cache kedaluwarsa, paling lama sekitar 30 menit untuk sebagian besar data. Agar langsung terlihat, jalankan **`bersihkanCache`**. Sebaiknya ubah data lewat aplikasi.
- Trigger **`keepWarm`** berjalan setiap 10 menit, hanya **Senin–Sabtu pukul 06.00–17.00**, supaya aplikasi tetap cepat di jam sekolah. Pemakaiannya kira-kira 5–15 menit dari kuota waktu trigger harian (akun @gmail.com mendapat ±90 menit per hari, akun Google Workspace sekolah lebih besar).
- Bila kuota terasa sempit, jalankan **`matikanKeepWarm`**. Untuk menyalakannya kembali, jalankan **`nyalakanKeepWarm`**.

---

## Bagian G — Cadangan otomatis

- Trigger **`backupMingguan`** berjalan setiap **Minggu sekitar pukul 01.00**. Trigger ini menyalin `OurClass_DB` dan `OurClass_Sensitif` ke folder **OurClass/Backup**, dan menyimpan **8 salinan terakhir** dari masing-masing.
- **Memulihkan data:** buka salinan backup yang diinginkan, salin isi sheet yang diperlukan ke spreadsheet utama, lalu jalankan `bersihkanCache`.
- Data yang dihapus dari aplikasi masuk ke **Pengaturan → Arsip** lebih dulu, dan masih bisa dipulihkan dari sana.

---

## Bagian H — Cara memperbarui aplikasi

### Backend (`Kode.gs` baru)

1. Tempel kode baru di editor, lalu simpan.
2. Jalankan **`setupAppEnvironment`** sekali. Fungsi ini aman, hanya menambah kolom atau pengaturan baru bila ada.
3. Klik **Terapkan → Kelola deployment** (*Manage deployments*) → ikon ✏️ **Edit** → pada **Versi** pilih **Versi baru** (*New version*) → **Terapkan**.

> Dengan cara ini **URL `/exec` tetap sama**, jadi `config.js` tidak perlu diubah. Jangan memakai "Deployment baru", karena itu membuat URL baru.

### Frontend (berkas `css/` atau `js/` baru)

1. Salin berkas baru ke folder `our-class` Anda. Jangan menimpa `js/config.js` kecuali memang ingin mengganti URL.
2. Di PowerShell, dari folder `our-class`, jalankan:

```bash
git add .
git commit -m "Update Our Class"
git push
```

3. Tunggu 1–2 menit, lalu tekan **Ctrl+Shift+R** di browser (atau buka jendela Incognito) untuk melihat versi terbaru.

---

## Bagian I — Kendala umum

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| "Konfigurasi belum lengkap" | `js/config.js` belum diisi atau masih `GANTI_…` | Isi URL `/exec` (B2), lalu push ulang |
| "Tidak dapat terhubung" | URL salah, memakai `/dev`, atau akses deploy bukan "Siapa saja" | Periksa A5. Buka URL `/exec` di browser, harus tampil `"success":true` |
| Situs **404** | `git init` dijalankan di folder yang salah | Ulangi B5–B6 dari folder yang berisi `index.html`, lalu `git push -u origin main --force` |
| Tampilan polos tanpa warna | Folder `css/` atau `js/` tidak ikut terunggah | Unggah lewat terminal (B6), jangan lewat tombol "Upload files" di GitHub |
| Perubahan kode backend tidak berlaku | Lupa membuat **Versi baru** | Lakukan Bagian H, langkah 3 |
| "Akun dikunci sementara" | 5 kali salah sandi | Tunggu 15 menit, atau minta wali kelas mereset sandi |
| "Sesi berakhir. Silakan masuk kembali." | Sudah lewat 8 jam, sandi di-reset, akun dinonaktifkan, atau `rotasiSecretSesi` dijalankan | Masuk kembali |
| Data yang diedit di spreadsheet belum muncul | Masih memakai cache | Jalankan `bersihkanCache` |
| "Server sedang menyimpan data lain" | Dua orang menyimpan bersamaan | Tunggu beberapa detik, lalu simpan lagi. Data tidak akan ganda |
| Laporan PDF: "Tidak ada data" | Periode yang dipilih belum punya data | Pilih bulan lain |
| "Service invoked too many times" | Kuota harian Google habis | Tunggu besok, dan pertimbangkan `matikanKeepWarm` |
| `Password authentication is not supported` | GitHub tidak menerima sandi akun | Gunakan Personal Access Token (B7) |

---

## Hasil pengujian sebelum diserahkan

- **Backend:** 136 dari 136 uji lulus di simulator Apps Script. Uji ini mencakup:
  - setup bisa diulang;
  - login, penguncian akun, dan token palsu;
  - NIS dengan nol di depan;
  - perlindungan dari rumus spreadsheet berbahaya;
  - absensi tanpa duplikat;
  - perhitungan kas dan tunggakan;
  - bentrok jadwal;
  - hak akses sekretaris;
  - privasi data periode;
  - PDF dan impor;
  - audit kebocoran rahasia.
- **Frontend:** 54 dari 54 uji browser lulus, dengan 0 error JavaScript. Pengujian memakai layar desktop 1440 px, iPhone 13, akun sekretaris, dan mode kurangi-animasi.
- Angka kecepatan diukur di simulator. Waktu nyata di Google sedikit lebih lambat, terutama pada pembukaan pertama di pagi hari.
