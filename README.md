# Pea Ice Cream – Website Usaha & Prototipe Interaktif Makassar

Fondasi proyek dan prototipe interaktif untuk usaha **Pea Ice Cream** Makassar. Dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, dan komponen modern yang siap untuk integrasi Supabase pada tahap berikutnya.

---

## 🍦 Identitas & Konsep Desain
- **Brand:** pea ice cream
- **Tema:** Chic & modern, colourful, ceria, rapi, ruang antarbagian lega
- **Palet Warna Utama (Maksimal 5 warna antarmuka):**
  - **Pink & Putih:** Dominan (`#FF6B9D`, `#FFB3D1`, `#FFFFFF`)
  - **Biru Gelap:** Untuk teks dan navigasi dengan kontras tinggi (`#1E3A5F`)
  - **Kuning:** Aksen kehangatan dan keju/vanilla (`#FFD700`)
  - **Hijau:** Aksen kesegaran dan status (`#4CAF50`)
- **Tipografi:** Fredoka untuk judul/display dan Nunito untuk teks isi/antarmuka
- **Identitas Logo:** Menggunakan logo asli (`public/logo.jpg`) pada navbar dan identitas utama, bukan teks buatan.
- **Tagline Usaha:**
  1. *ice cream classic* (Publik)
  2. *homemade ice cream* (Publik)
  3. *sehat tanpa pengawet* (Disimpan internal di dashboard admin & dokumen konten; ditandai perlu verifikasi pemilik sebelum dipublikasikan ke pelanggan)
- **Bahasa & Mata Uang:** Bahasa Indonesia dan Rupiah (Rp)

---

## 🎠 Hero Carousel Beranda (Revisi Terkini)
Hero statis didominasi logo besar telah digantikan dengan **Hero Carousel** interaktif yang memfokuskan visual produk es krim:
- **Tiga Slide Dummy Bawaan:**
  1. **Pengenalan Brand:**
     - Judul: *“Rasa klasik, bahagia di setiap scoop.”*
     - Pendukung: *“Homemade ice cream dari Makassar.”*
     - Tombol: *“Lihat Menu”* menuju `/katalog`.
  2. **Pilihan Rasa:**
     - Judul: *“Temukan rasa favoritmu.”*
     - Pendukung: *“Pilih rasa dan ukuran untuk menemani harimu.”*
     - Tombol: *“Pilih Rasa”* menuju `/katalog`.
  3. **Paket Berbagi:**
     - Judul: *“Momen manis untuk dinikmati bersama.”*
     - Pendukung: *“Jelajahi pilihan paket berbagi Pea.”*
     - Tombol: *“Lihat Paket”* menuju `/katalog?kategori=seasonal`.
- **Perilaku & Aksesibilitas:**
  - Berganti otomatis setiap 5,5 detik.
  - Tombol kontrol **Jeda / Putar** (*pause/play*) yang mudah ditemukan.
  - Panah sebelumnya/berikutnya (*prev/next*) dan indikator slide (*dots*).
  - Mendukung gesture **swipe** pada layar sentuh ponsel.
  - Autoplay otomatis jeda saat kursor mouse berada di banner (*hover*) atau fokus keyboard masuk (*focus*).
  - Setelah interaksi manual pengguna (klik panah, dot, atau swipe), autoplay dihentikan sampai pengguna memilih tombol putar kembali.
  - Menghormati pengaturan sistem `prefers-reduced-motion` (mematikan autoplay dan meredam animasi).
  - Tautan tombol slide yang tidak aktif dikecualikan dari navigasi keyboard (`tabIndex={-1}`).
  - Jika hanya ada 1 banner aktif, kontrol dan autoplay otomatis disembunyikan.
  - Jika tidak ada banner aktif (0 banner), menampilkan pembuka sederhana dengan nama brand dan tombol katalog tanpa area kosong.

---

## 📱 Alur & Halaman Pelanggan (Mobile First)
1. **Beranda (`/`):** Hero carousel dengan visual produk, pilihan menu favorit, Cerita Pea, tautan aplikasi pemesanan (GrabFood, ShopeeFood, WhatsApp), peta lokasi Makassar, dan kontak.
2. **Katalog (`/katalog`):** Pencarian real-time rasa, filter kategori (Signature, Classic, Cita Rasa Lokal, Musiman), filter rasa, pengurutan harga/nama, grid responsif (2 kolom di HP jika muat, 1 kolom di layar sempit), status stok.
3. **Pilihan Produk (`/katalog/[id]`):** Pilihan ukuran cup (Kecil, Sedang, Besar), opsi campur 2 rasa jika diizinkan pada ukuran tersebut, counter jumlah, catatan khusus, status stok real-time, dan tombol tambah ke keranjang.
4. **Keranjang Belanja (`/keranjang`):** Ubah kuantitas, hapus item, rincian subtotal, pemberitahuan resmi *"Subtotal belum termasuk ongkir"*, sticky checkout bar yang tidak menutupi konten.
5. **Checkout (`/checkout`):**
   - Tanpa perlu login pelanggan.
   - Pilihan pengiriman: **Antar ke Alamat** (alamat + patokan; ongkir dikonfirmasi admin, bukan dianggap Rp0) atau **Ambil Sendiri di Outlet** (bebas ongkir).
   - Metode pembayaran: **Transfer Bank** dan **QRIS** (verifikasi manual admin).
   - Validasi formulir lengkap.
   - **Pratinjau Pesan WhatsApp:** Menampilkan teks yang akan dikirim, tombol salin pesan, simulasi buka WA, dan penegasan *"Membuka WhatsApp bukan bukti pesan sudah dikirim. Pesanan telah tersimpan di sistem."*
6. **Ringkasan Pesanan (`/pesanan/[ref]`):** Nomor referensi resmi format `PEA-YYYYMMDD-XXXX`, status badge *"Menunggu Konfirmasi"*, rincian pesanan, dan penjelasan alur pengurangan stok.
7. **Pesanan Saya (`/pesanan`):** Pencarian nomor referensi dan riwayat pesanan yang pernah dibuat di browser.

---

## 🛠️ Dashboard Operasional Admin (`/admin`)
Akses: `/admin` (Demo Login: `/admin/login`)
- **Ringkasan Operasional:** Arus pesanan masuk, pesanan dipersiapkan, menu aktif, dan varian stok kritis — **tanpa angka penjualan/omzet palsu**.
- **Banner Beranda (`/admin/banner`):** Tambah, edit, hapus banner; atur urutan (*move up/down*); toggle aktif/nonaktif; pratinjau live carousel; pemilihan gambar desktop & mobile; teks tombol & tautan; teks alt aksesibilitas.
- **Produk & Menu (`/admin/produk` & `/admin/produk/[id]`):** Tabel produk, rasa, ukuran, alergen, foto, dan ketersediaan; opsi campur rasa per variasi ukuran.
- **Kelola Stok (`/admin/stok`):** Matriks stok per kombinasi rasa dan ukuran cup, input cepat, dan deteksi stok menipis (<10 cup).
- **Pesanan Masuk (`/admin/pesanan` & `/admin/pesanan/[ref]`):** Filter status pesanan dan status pembayaran yang **terpisah**; konfirmasi pesanan dengan input ongkir; pengurangan stok otomatis saat diterima (*idempotent stock reduction guard*); format balasan WhatsApp ke pelanggan.
- **Profil Usaha (`/admin/profil`):** Nama toko, logo asli, 3 tagline yang bisa diedit (dengan catatan verifikasi klaim), alamat outlet Makassar, jam operasional, dan nomor WhatsApp.
- **Area & Ongkir (`/admin/pengiriman`):** Pengaturan kecamatan di Makassar, aturan konfirmasi manual admin, dan titik ambil sendiri.
- **Rekening & QRIS (`/admin/pembayaran`):** Nomor rekening bank dan simulasi unggah QRIS (dilengkapi *empty state* dan petunjuk).
- **Tautan Aplikasi (`/admin/aplikasi`):** Pengaturan tautan GrabFood & ShopeeFood (dilengkapi *empty state* dan petunjuk).
- **Akun Admin (`/admin/akun`):** Penjelasan arsitektur Supabase Auth tahap berikutnya. *(Catatan keamanan: Hosting dan kredensial infrastruktur tidak dikelola melalui dashboard operasional).*

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### Prasyarat
- Node.js versi 18 atau lebih baru (disarankan Node.js v20+)
- npm / pnpm / yarn

### Langkah Instalasi & Menjalankan
1. Clone / buka folder proyek:
   ```bash
   cd d:\Pea_ice_cream
   ```
2. Pastikan dependensi telah terinstal:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka di browser:
   - **Toko Pelanggan:** [http://localhost:3000](http://localhost:3000)
   - **Dashboard Admin:** [http://localhost:3000/admin](http://localhost:3000/admin) *(Demo Banner: [http://localhost:3000/admin/banner](http://localhost:3000/admin/banner))*

---

## 🧪 Validasi Build & Pengujian

- **Pemeriksaan Tipe (Typecheck):**
  ```bash
  npx tsc --noEmit
  ```
  *(Status: PASSED - 0 error)*

- **Linting:**
  ```bash
  npm run lint
  ```
  *(Status: PASSED - 0 error)*

- **Production Build:**
  ```bash
  npm run build
  ```
  *(Status: PASSED - 20/20 halaman static/dynamic berhasil di-generate)*

---

## 🔒 Batasan Prototipe Saat Ini & Rencana Tahap Backend
- **Data Tersimpan Lokal:** Perubahan pada banner, menu, pesanan, dan stok saat ini disimpan sementara di memori browser (`localStorage`).
- **Pesan WhatsApp:** Menampilkan pratinjau pesan untuk menguji alur komunikasi; tidak ada pesan WhatsApp sungguhan yang terkirim otomatis.
- **Tahap Backend Berikutnya (Supabase):**
  - Database PostgreSQL untuk tabel `banners`, `products`, `product_flavors`, `product_sizes`, `stock_entries`, dan `orders`.
  - Supabase Auth untuk autentikasi admin yang aman (Row-Level Security).
  - Supabase Storage untuk upload file gambar banner dan QRIS toko.
