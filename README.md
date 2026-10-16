# DompetKu — Aplikasi Pencatatan Keuangan Pribadi

DompetKu adalah aplikasi pencatatan keuangan pribadi berbasis web modern yang dirancang untuk membantu pengguna mengelola keuangan dengan mudah, terstruktur, dan ramah pemula.

## Fitur Utama
1. **Dashboard Interaktif**: Ringkasan saldo, total pemasukan, total pengeluaran, saldo awal, grafik keuangan visual (Chart.js), dan daftar transaksi terbaru.
2. **Saldo Awal**: Fitur khusus untuk menetapkan jumlah modal awal sebelum transaksi dicatat, tanpa menggandakan perhitungan saldo.
3. **Pemasukan & Pengeluaran**: Form pencatatan lengkap dengan kategori terstruktur dan validasi input.
4. **Riwayat Transaksi**: Daftar lengkap dengan fitur pencarian, filter jenis transaksi, pengurutan, edit, dan hapus transaksi.
5. **Anggaran Bulanan**: Batas pengeluaran bulanan dengan progress bar interaktif dan peringatan visual otomatis saat mendekati atau melewati batas.
6. **Laporan & Ekspor CSV**: Ringkasan laporan keuangan dan fitur ekspor data langsung ke file CSV (kompatibel dengan Microsoft Excel dan Google Sheets).
7. **Mode Gelap & Terang (Dark / Light Mode)**: Pengaturan tema lengkap yang tersimpan di LocalStorage.
8. **Penyimpanan Lokal**: Menggunakan browser LocalStorage agar data aman dan tetap tersimpan saat halaman dimuat ulang.

---

## Cara Membuka Project di Visual Studio Code Menggunakan Live Server

1. Ekstrak file **Project Active.zip**.
2. Buka aplikasi **Visual Studio Code (VS Code)**.
3. Pilih menu **File > Open Folder...** lalu pilih folder hasil ekstraksi yang berisi file `index.html`, `style.css`, `app.js`, dan `README.md`.
4. Pastikan Anda sudah menginstal ekstensi **Live Server** di VS Code (oleh Ritwick Dey).
5. Klik kanan pada file `index.html` di panel Explorer sebelah kiri, lalu pilih **Open with Live Server**.
6. Aplikasi DompetKu akan terbuka secara otomatis di browser default Anda.

---

## Cara Mencoba Aplikasi di HP (Smartphone)

* **Melalui Jaringan Lokal (Wi-Fi yang sama)**:
  1. Jalankan Live Server di VS Code.
  2. Perhatikan alamat IP lokal komputer Anda di terminal Live Server (misalnya `http://192.168.1.10:5500`).
  3. Buka browser di HP Anda yang terhubung ke jaringan Wi-Fi yang sama, lalu ketik alamat IP tersebut.
* **Melalui Hosting Gratis (Akses Publik)**:
  * Anda dapat mengunggah folder project ini ke layanan hosting statis gratis seperti **Netlify Drop**, **GitHub Pages**, atau **Vercel** agar bisa diakses melalui tautan publik oleh siapa saja.

---

*Dibuat khusus untuk pengelolaan keuangan pribadi yang lebih baik.*
