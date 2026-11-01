# Website Desa Tanjung Alai

Website profil dan panduan singkat potensi Desa Tanjung Alai, Kecamatan Koto Kampar XIII.

## Menjalankan

Buka `index.html` langsung di browser. Proyek ini menggunakan HTML, CSS, dan JavaScript tanpa dependensi build sehingga dapat dijalankan dari workspace kosong.

## Publikasi dengan GitHub Pages

Workflow tersedia di `.github/workflows/deploy-pages.yml`. Untuk mendapatkan tautan publik:

1. Unggah berkas proyek ini ke repositori GitHub pada branch `main`.
2. Buka **Settings → Pages** di repositori, lalu pilih **GitHub Actions** sebagai sumber publikasi.
3. Buka tab **Actions** dan tunggu workflow **Deploy website to GitHub Pages** selesai.
4. Gunakan URL yang ditampilkan pada hasil deployment. Format umumnya `https://<username>.github.io/<nama-repositori>/`.

Perubahan kode berikutnya pada branch `main` akan memublikasikan ulang situs secara otomatis.

## Isi halaman

- Profil singkat Desa Tanjung Alai
- Potensi perikanan, agrowisata, UMKM, dan kuliner
- Kartu destinasi wisata dengan filter kategori
- Halaman detail wisata terpisah untuk peta, foto, tarif masuk/parkir, dan fasilitas; tautan Google Maps, foto, tarif, serta fasilitas dapat diatur melalui panel admin
- Navigasi responsif untuk perangkat mobile
- Tautan lokasi pencarian Google Maps
- Panel admin untuk memperbarui profil desa termasuk visi, misi, sejarah, struktur, destinasi wisata, berita desa beserta thumbnail dan isi lengkap, APBD, administrasi penduduk, dan foto galeri; foto profil, struktur, wisata, dan berita dapat dikelola langsung pada bagian masing-masing
- Informasi kontak, telepon penting, dan sosial media desa yang dapat diatur dari panel admin, beserta penghitung kunjungan lokal
- Katalog UMKM bersama dari Supabase; detail produk berisi informasi dan keranjang pesanan serta checkout melalui WhatsApp penjual

Perubahan dari panel admin disimpan secara lokal di browser yang digunakan. Foto galeri dikompres sebelum disimpan; data tidak tersinkron ke perangkat atau browser lain.
Penghitung kunjungan juga disimpan secara lokal dan hanya mencerminkan kunjungan pada browser/perangkat yang sedang digunakan, bukan jumlah pengunjung keseluruhan.
Karena data admin disimpan di browser, perubahan yang dilakukan admin hanya terlihat pada browser/perangkat tersebut dan tidak dibagikan kepada pengunjung lain.

Gambar pada halaman menggunakan dokumentasi lokal yang tersedia serta sumber foto eksternal sebagai placeholder visual, dan dapat dilengkapi dengan dokumentasi asli desa melalui panel admin.

## Mengaktifkan katalog UMKM

Katalog produk dibagikan ke semua pengunjung menggunakan Supabase. Siapkan project Supabase, lalu:

1. Jalankan isi `supabase-umkm-setup.sql` melalui **SQL Editor** pada project.
2. Buat akun admin tepercaya melalui **Authentication → Users**. Matikan pendaftaran publik agar akun yang dapat masuk hanya dibuat oleh pengelola.
3. Salin UUID akun admin dari Authentication, lalu jalankan `insert into public.umkm_admins (user_id) values ('UUID-AKUN-ADMIN');` melalui SQL Editor. Ulangi untuk admin tambahan.
4. Isi `url` dan `anonKey` di `supabase-config.js` menggunakan Project URL dan **publishable/anon key**. Jangan masukkan `service_role` key ke situs.
5. Publikasikan situs melalui HTTPS atau jalankan dari localhost, lalu masuk dengan akun admin pada panel **Login Admin → Produk UMKM & Pemesanan**.

SQL mengaktifkan Row Level Security. Pengunjung hanya dapat membaca produk aktif; hanya akun yang UUID-nya terdaftar di `umkm_admins` yang dapat mengelola produk dan foto. Keranjang dan checkout tersedia di halaman detail produk, bukan di halaman utama. Checkout tidak memproses pembayaran di situs: ringkasan pesanan dikirim ke WhatsApp penjual untuk konfirmasi harga, stok, ongkir, dan pembayaran. Keranjang hanya mengizinkan produk dari satu nomor penjual.

Katalog dan detail produk memerlukan konfigurasi Supabase serta koneksi internet. Jangan gunakan `file://` untuk menguji koneksi Supabase karena browser dapat membatasi permintaan lintas-origin; gunakan localhost atau hosting HTTPS. Bagian website lainnya tetap dapat dilihat tanpa konfigurasi backend.
