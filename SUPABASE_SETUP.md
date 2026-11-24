# 🍨 Panduan Integrasi Supabase – Pea Ice Cream Makassar

Dokumen ini berisi panduan lengkap langkah demi langkah untuk menghubungkan website **Pea Ice Cream** ke proyek **Supabase**. Seluruh migrasi SQL, fungsi transaksi atomik, kebijakan Row Level Security (RLS), aturan penyimpanan Storage, dan alur autentikasi telah disiapkan secara lengkap dan terstruktur.

---

## 📋 Daftar Isi
1. [Prasyarat](#1-prasyarat)
2. [Konfigurasi Variabel Environment](#2-konfigurasi-variabel-environment)
3. [Menjalankan Migrasi Database SQL](#3-menjalankan-migrasi-database-sql)
4. [Menyiapkan Supabase Storage](#4-menyiapkan-supabase-storage)
5. [Bootstrap Akun Administrator Pertama](#5-bootstrap-akun-administrator-pertama)
6. [Arsitektur Keamanan & Kebijakan RLS](#6-arsitektur-keamanan--kebijakan-rls)
7. [Fungsi Transaksi Atomik & Pengurangan Stok](#7-fungsi-transaksi-atomik--pengurangan-stok)
8. [Uji Validasi Sistem](#8-uji-validasi-sistem)

---

## 1. Prasyarat
- Akun aktif di [Supabase](https://supabase.com).
- Sebuah project Supabase baru (pilih region terdekat, misalnya **Singapore (ap-southeast-1)**).
- Akses ke dashboard Supabase: **SQL Editor**, **Authentication**, **Storage**, dan **Project Settings**.

---

## 2. Konfigurasi Variabel Environment

1. Di komputer lokal Anda, salin file template `.env.example` menjadi `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```
2. Buka dashboard Supabase Anda, masuk ke menu **Project Settings** > **API**.
3. Salin nilai berikut ke file `.env.local`:
   ```env
   # Project URL
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co

   # Project API Keys - anon (public)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Project API Keys - service_role (secret, HANYA untuk server)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Kunci rahasia acak untuk menandatangani guest order cookie token
   GUEST_ORDER_SECRET=kunci-acak-rahasia-minimal-32-karakter-bebas-angka-dan-huruf
   ```
   > [!IMPORTANT]
   > File `.env.local` sudah terdaftar di `.gitignore` dan **tidak akan pernah terunggah ke repositori git**. Jangan pernah menempelkan kredensial rahasia ke obrolan atau repositori publik.

---

## 3. Menjalankan Migrasi Database SQL

File migrasi SQL tersimpan di folder `supabase/migrations/`. Jalankan file SQL ini secara **berurutan (001 sampai 005)** di menu **SQL Editor** pada dashboard Supabase Anda:

### Urutan Eksekusi:

1. **`001: supabase/migrations/20261122000001_initial_schema.sql`**
   - Membuka ekstensi `uuid-ossp` dan `pgcrypto`.
   - Membuat tabel: `admin_users`, `store_settings`, `banners`, `product_categories`, `products`, `product_flavors`, `product_sizes`, `inventory`, `stock_logs`, `delivery_zones`, `payment_methods`, `external_delivery_apps`, `orders`, `order_items`, `order_status_history`.
   - Menambahkan indeks pencarian dan constraint nilai mata uang bilangan bulat Rupiah (integer).

2. **`002: supabase/migrations/20261122000002_functions_and_triggers.sql`**
   - Membuat fungsi pembantu `public.is_admin()`.
   - Membuat stored procedure atomik `public.create_customer_order(order_payload JSONB)`:
     - Validasi produk aktif & varian ukuran.
     - **Menghitung ulang harga dari database** (mencegah manipulasi harga dari browser).
     - Idempotency key check untuk mencegah pesanan ganda saat retry.
     - Pembuatan kode referensi pesanan format `PEA-YYYYMMDD-XXXX`.
   - Membuat stored procedure atomik `public.confirm_and_deduct_order_stock(p_order_id, p_admin_id)`:
     - Penguncian baris (`FOR UPDATE`) untuk mencegah *race condition*.
     - Pengurangan stok komponen rasa/ukuran sesuai jumlah pesanan.
     - Idempoten: pesanan yang sudah dikurangi stoknya tidak akan mengurangi stok berulang.
     - Penolakan konfirmasi jika stok tidak mencukupi dengan pesan kesalahan jelas.
   - Membuat stored procedure atomik `public.cancel_and_restore_order_stock(p_order_id, p_admin_id, p_reason)`.

3. **`003: supabase/migrations/20261122000003_row_level_security.sql`**
   - Mengaktifkan Row Level Security (RLS) pada **seluruh 15 tabel**.
   - Hak baca publik dibatasi hanya untuk: katalog aktif, banner aktif, pengaturan toko, zona pengiriman, rekening aktif, dan aplikasi eksternal.
   - Tabel pesanan (`orders`), detail item (`order_items`), dan log stok (`stock_logs`) **terkunci rapat dari akses publik anonim**.

4. **`004: supabase/migrations/20261122000004_storage_setup.sql`**
   - Membuat bucket publik `pea-assets` di Supabase Storage (maksimal file 5MB, format JPG, PNG, WebP, SVG).
   - Menerapkan kebijakan RLS Storage: publik hanya bisa melihat gambar, hanya admin yang bisa mengunggah, mengubah, atau menghapus gambar.

5. **`005: supabase/migrations/20261122000005_seed_data.sql` (Opsional)**
   - Mengisi data awal Pea Ice Cream Makassar: profil toko, 3 banner bawaan, menu es krim (Vanilla Dream, Chocolate Fudge, Strawberry Bliss, Matcha Kyoto, Pandan Nusantara, Durian King), variasi cup, stok awal, dan zona ongkir Makassar.
   - Menggunakan klausa `ON CONFLICT DO NOTHING` sehingga aman dijalankan tanpa menduplikasi data.

---

## 4. Menyiapkan Supabase Storage

Setelah menjalankan file migrasi `004`, periksa menu **Storage** di dashboard Supabase:
- Pastikan bucket bernama **`pea-assets`** telah muncul dengan status **Public Bucket**.
- Folder terstruktur otomatis ketika admin mengunggah:
  - `banners/` – untuk visual hero carousel
  - `products/` – untuk foto produk es krim
  - `branding/` – untuk logo resmi Pea Ice Cream
  - `payment/` – untuk barcode QRIS

---

## 5. Bootstrap Akun Administrator Pertama

Karena pendaftaran admin publik dinonaktifkan demi keamanan toko, ikuti langkah tepercaya berikut untuk membuat akun Super Admin pertama:

1. Buka dashboard Supabase > **Authentication** > **Users**.
2. Klik tombol **Add user** > **Create user**.
3. Masukkan email dan kata sandi admin Anda (misalnya: `admin@peaicecream.com`).
4. Centang **Auto Confirm User?** agar akun langsung aktif tanpa perlu konfirmasi email.
5. Klik **Create user**.
6. Salin **User UID** dari pengguna baru tersebut (format UUID: contoh `123e4567-e89b-12d3-a456-426614174000`).
7. Buka **SQL Editor** di Supabase, lalu jalankan perintah berikut (ganti UID dan email sesuai milik Anda):
   ```sql
   INSERT INTO public.admin_users (user_id, email, full_name, role)
   VALUES (
     'PASTE-USER-UID-DISINI'::uuid,
     'admin@peaicecream.com',
     'Pemilik Pea Ice Cream',
     'superadmin'
   )
   ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
   ```
8. Sekarang Anda dapat login ke dashboard admin di:
   [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 6. Arsitektur Keamanan & Kebijakan RLS

| Tabel | Akses Publik (Anon) | Akses Admin (`is_admin()`) |
|---|---|---|
| `products` | Hanya `is_available = true` & `is_archived = false` | Full CRUD |
| `banners` | Hanya `is_active = true` | Full CRUD |
| `store_settings` | Hanya `is_active = true` | Full CRUD |
| `delivery_zones` | Hanya `is_active = true` | Full CRUD |
| `payment_methods` | Hanya `is_active = true` | Full CRUD |
| `orders` | **Ditolak (0 Baris)** | Full CRUD |
| `order_items` | **Ditolak (0 Baris)** | Full CRUD |
| `stock_logs` | **Ditolak (0 Baris)** | Read Only (Audit) |
| `admin_users` | **Ditolak (0 Baris)** | Read (Self) / Superadmin |

### Privasi Pesanan Tamu:
- Pelanggan tidak perlu login untuk memesan es krim.
- Pembuatan pesanan diproses melalui endpoint `/api/orders/create` yang menjalankan stored procedure `create_customer_order`.
- Setelah pesanan tersimpan, browser tamu menerima **Signed Cookie HttpOnly** (`pea_guest_token_<ref>`) yang di-hash dengan HMAC-SHA256.
- Halaman ringkasan status pesanan (`/pesanan/[ref]`) memverifikasi cookie ini. Siapa pun yang mencoba menebak nomor referensi pesanan lain tanpa cookie bertanda tangan yang valid akan menerima respon **`403 Forbidden: Akses Pesanan Dilindungi`**.

---

## 7. Fungsi Transaksi Atomik & Pengurangan Stok

### Aturan Usaha Stok:
1. **Saat Pelanggan Checkout**: Stok **belum berkurang**. Pesanan berstatus `pending` (menunggu konfirmasi admin).
2. **Saat Admin Mengonfirmasi Pesanan**:
   - Memanggil fungsi database `confirm_and_deduct_order_stock`.
   - Mengunci baris produk & inventori (`FOR UPDATE`).
   - Memeriksa ketersediaan stok rasa & ukuran. Jika ada rasa yang stoknya kurang, transaksi digagalkan (*rollback*) dan memunculkan notifikasi kepada admin.
   - Mengurangi stok dan mencatat riwayat transaksi ke `stock_logs`.
   - Menandai kolom `stock_deducted = true` pada pesanan.
3. **Idempotensi**:
   - Jika admin menekan tombol konfirmasi berulang kali, fungsi mendeteksi `stock_deducted = true` dan keluar secara aman tanpa mengurangi stok dua kali.
4. **Pembatalan Pesanan**:
   - Jika pesanan dibatalkan setelah dikonfirmasi, fungsi `cancel_and_restore_order_stock` memulihkan stok kembali ke inventori tepat satu kali dan mereset `stock_deducted = false`.

---

## 8. Uji Validasi Sistem

Untuk memastikan integrasi berjalan sempurna, lakukan pengujian berikut:

1. **Uji Katalog & Banner**:
   - Masuk ke Admin > **Banner Beranda** dan **Produk & Menu**.
   - Tambah atau ubah item, simpan.
   - Buka halaman pelanggan di tab browser lain, refresh, dan pastikan data baru langsung tampil dari Supabase.
2. **Uji Unggah Foto**:
   - Unggah gambar banner atau produk baru.
   - Pastikan URL gambar mengarah ke `https://[PROJECT-ID].supabase.co/storage/v1/object/public/pea-assets/...` dan gambar tampil sempurna.
3. **Uji Checkout Tamu & Manipulasi Harga**:
   - Tambahkan menu ke keranjang dan lakukan checkout.
   - Endpoint server `/api/orders/create` akan membaca harga asli dari tabel `product_sizes` di database Supabase, mengabaikan perubahan harga buatan di sisi klien.
4. **Uji Privasi Pesanan**:
   - Buka tautan `/pesanan/PEA-YYYYMMDD-XXXX` di browser mode Incognito atau browser berbeda tanpa cookie pesanan.
   - Pastikan muncul layar peringatan **"Akses Pesanan Dilindungi"** (Error 403).
5. **Uji Konfirmasi Stok**:
   - Buka Admin > **Pesanan Masuk** > buka pesanan baru.
   - Klik konfirmasi. Periksa Admin > **Kelola Stok** untuk memastikan stok berkurang sesuai jumlah pesanan.
   - Klik simpan/konfirmasi ulang dan pastikan stok tidak berkurang untuk kedua kalinya.
