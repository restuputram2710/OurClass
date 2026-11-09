# Our Class

Aplikasi manajemen kelas untuk wali kelas dan sekretaris yang ditunjuknya. Fiturnya:

- dashboard
- absensi harian
- kas dan tunggakan
- periode haid
- jadwal dan piket
- insight dan perkembangan siswa
- notulensi rapat
- data siswa
- laporan PDF otomatis

Repository ini hanya berisi **frontend**, yaitu HTML, CSS, dan JS statis yang disajikan oleh GitHub Pages. Backend-nya berupa proyek Google Apps Script terpisah yang berfungsi sebagai REST API (JSON). Tidak ada kode backend maupun rahasia apa pun yang disimpan di sini.

## Struktur

```
index.html            ← halaman utama (wajib berada di root repository)
css/style.css         ← design system (Inter, primary #2563EB, token status H/I/S/A)
js/config.js          ← SATU-SATUNYA berkas yang Anda isi: URL /exec Apps Script
js/api.js             ← fetch ke GAS (text/plain), dedupe, batch, cache SWR
js/ui.js              ← komponen, ikon, grafik, format
js/app.js             ← login, tata letak (sidebar / bottom nav), router
js/pages/*.js         ← satu berkas per menu
PANDUAN-INSTALASI.md  ← panduan lengkap untuk pengguna awam
```

## Konfigurasi

Buka `js/config.js` dan isi URL Web App dari Apps Script (**Terapkan → Aplikasi web**):

```js
window.APP_CONFIG = { GAS_URL: 'https://script.google.com/macros/s/ID_DEPLOYMENT_ANDA/exec' };
```

URL `/exec` bukan rahasia. Keamanan aplikasi dijaga oleh tiga hal:

- login,
- token sesi HMAC,
- pemeriksaan peran di server pada setiap permintaan.

## Memperbarui

Jalankan dari folder ini:

```bash
git add .
git commit -m "Update Our Class"
git push
```

Tunggu 1–2 menit, lalu tekan **Ctrl+Shift+R** di browser. Bila isi `css/` atau `js/` berubah, naikkan angka `?v=` di `index.html` agar browser tidak memakai berkas lama.

Panduan lengkap ada di **PANDUAN-INSTALASI.md**: instalasi backend, deploy ke GitHub Pages, impor data, keamanan, dan kendala umum.
