# Panduan Pengguna SILABKU

Dokumen ini menjelaskan fungsi setiap halaman (page) di aplikasi **SILABKU** dengan bahasa sederhana.  
Catatan: menu yang muncul bisa berbeda tergantung **role** akun Anda (**Mahasiswa/User**, **Admin**, atau **Dosen**).

## Daftar Isi
1. [Gambaran Singkat](#gambaran-singkat)
2. [Cara Masuk (Login) & Akun](#cara-masuk-login--akun)
3. [Navigasi Umum Aplikasi](#navigasi-umum-aplikasi)
4. [Panduan Per Halaman — Mahasiswa (User)](#panduan-per-halaman--mahasiswa-user)
5. [Panduan Per Halaman — Admin](#panduan-per-halaman--admin)
6. [Panduan Per Halaman — Dosen](#panduan-per-halaman--dosen)
7. [FAQ (Masalah yang Sering Terjadi)](#faq-masalah-yang-sering-terjadi)

---

## Gambaran Singkat

SILABKU dipakai untuk:
- **Open Recruitment (Oprec) Asisten**: mahasiswa mengajukan pendaftaran, admin/dosen menyeleksi.
- **Jadwal Praktikum**: melihat jadwal penggunaan lab (admin/dosen bisa menambah/mengubah).
- **BAP (Berita Acara Praktikum)**: asisten mengisi laporan per pertemuan dan generate dokumen.
- **Absensi Asisten**: admin/dosen mengisi kehadiran asisten per pertemuan.
- **Sertifikat**: admin/dosen menerbitkan sertifikat; mahasiswa melihat/unduh sertifikatnya.
- **Database Asisten**: admin/dosen melihat arsip asisten yang pernah bertugas.

---

## Cara Masuk (Login) & Akun

### Halaman: Beranda / Landing
- **URL**: `/`
- **Tujuan**: halaman awal sebelum masuk aplikasi.
- **Kapan dipakai**: saat pertama kali membuka website.

### Halaman: Login
- **URL**: `/login`
- **Tujuan**: masuk ke aplikasi menggunakan akun.
- **Cara pakai**:
  1. Masukkan email (atau kredensial yang diminta di form).
  2. Masukkan password.
  3. Klik **Login**.
- **Jika gagal login**: pastikan email/password benar, atau gunakan fitur **Lupa Password**.

### Halaman: Register (Daftar Akun)
- **URL**: `/register`
- **Tujuan**: membuat akun baru (jika fitur pendaftaran akun dibuka).
- **Catatan**: pada sebagian instalasi kampus, akun bisa saja dibuat oleh admin (jadi menu/halaman ini mungkin tidak dipakai).

### Halaman: Lupa Password
- **URL**: `/forgot-password`
- **Tujuan**: meminta link reset password ke email.

### Halaman: Reset Password
- **URL**: `/reset-password/{token}`
- **Tujuan**: mengganti password lewat link token.

### Halaman: Verifikasi Email
- **URL**: `/verify-email`
- **Tujuan**: verifikasi email sebelum akses fitur tertentu (jika diwajibkan).

---

## Navigasi Umum Aplikasi

### Sidebar (Menu Kiri)
Menu utama ada di sisi kiri. Isi menu bergantung role:
- **Mahasiswa/User**: Dashboard, Jadwal Praktikum, Laporan BAP, Sertifikat, Open Recruitment (Profil/Event/Pendaftaran Saya).
- **Admin**: Dashboard, Data Master (Lab/Semester/Mata Kuliah/Kelas), Jadwal Praktikum, Events, Seleksi Asisten, Database Asisten, Monitoring BAP, Absensi Asisten, Sertifikat (Penerbitan & Data).
- **Dosen**: Dashboard, Jadwal Praktikum, Seleksi Asisten, Database Asisten, Monitoring BAP, Absensi Asisten, Sertifikat (Penerbitan & Data).

### Breadcrumb (Jejak Halaman)
Di bagian atas halaman biasanya ada breadcrumb (contoh: `Open Recruitment > Event Terbuka`). Ini membantu Anda tahu sedang berada di menu apa.

### Profil Akun & Logout
Biasanya ada di bagian bawah sidebar (menu user). Gunakan **Logout** setelah selesai memakai aplikasi (terutama jika memakai komputer bersama).

### Pengaturan Akun (Settings)
- **URL**: `/settings` (akan diarahkan otomatis)
- **Tujuan**: mengubah data akun dasar.
- **Sub-halaman**:
  - **Profil**: `/settings/profile` (ubah nama/email sesuai kebijakan sistem)
  - **Password**: `/settings/password` (ganti password)
  - **Tampilan**: `/settings/appearance` (mode/tema tampilan, jika tersedia)

---

## Panduan Per Halaman — Mahasiswa (User)

### Halaman: Dashboard
- **URL**: `/dashboard`
- **Tujuan**: ringkasan aktivitas Anda.
- **Yang biasanya terlihat**:
  - Ringkasan pendaftaran (jika pernah daftar oprec).
  - Tombol cepat menuju **Event Oprec**, **BAP**, atau **Jadwal**.
- **Tip**: gunakan Dashboard sebagai “pintu masuk” untuk melanjutkan proses yang sedang berjalan.

### Halaman: Profil Asisten
- **URL**: `/profil`
- **Tujuan**: melengkapi data diri & berkas yang dibutuhkan untuk pendaftaran oprec.
- **Data penting yang umumnya wajib diisi**:
  - **Nama lengkap**
  - **No WhatsApp**
  - **Data rekening** (nama rekening, bank, nomor rekening)
  - **IPK**
  - Upload **Transkrip** (PDF) dan **KTM** (PDF / gambar)
- **Cara pakai**:
  1. Isi data yang masih kosong.
  2. Upload transkrip dan KTM (jika diminta/masih kosong).
  3. Klik **Simpan Perubahan**.
- **Catatan penting**: pendaftaran oprec bisa ditolak otomatis oleh sistem jika profil belum lengkap.

### Halaman: Lihat Transkrip (Viewer)
- **URL**: `/profil/transkrip`
- **Tujuan**: melihat file transkrip yang sudah Anda upload.

### Halaman: Lihat KTM (Viewer)
- **URL**: `/profil/ktm`
- **Tujuan**: melihat file KTM yang sudah Anda upload.

### Halaman: Open Recruitment — Event Terbuka
- **URL**: `/oprec/events`
- **Tujuan**: melihat daftar event rekrutmen asisten yang sedang dibuka.
- **Yang bisa Anda lakukan**:
  - Mencari event lewat kolom **Cari event atau semester**.
  - Membaca ringkasan event (tipe, semester, batas akhir, jumlah mata kuliah dibuka).
  - Klik **Daftar Sekarang** untuk masuk ke form pendaftaran event.

### Halaman: Open Recruitment — Form Pendaftaran
- **URL**: `/oprec/apply/{eventId}`
- **Tujuan**: mengajukan pendaftaran menjadi asisten pada event tertentu.
- **Alur umum**:
  1. Pilih **mata kuliah & kelas** yang ingin Anda daftar (centang).
  2. Klik tombol **Pilih Nilai & Upload SPTJM**.
  3. Di modal/kolom tambahan, isi:
     - **Nilai mata kuliah** (misalnya A/AB/B dst)
     - Upload **SPTJM** (jika diminta)
  4. Klik **Kirim/Submit**.
  5. Anda akan diarahkan ke halaman **Pendaftaran Saya**.
- **Jika tombol submit tidak bisa diklik**:
  - Pastikan minimal memilih 1 mata kuliah.
  - Pastikan **Profil Asisten** sudah lengkap (nama lengkap, WA, IPK, rekening, transkrip, KTM).

### Halaman: Open Recruitment — Pendaftaran Saya
- **URL**: `/oprec/my-applications`
- **Tujuan**: memantau status pendaftaran yang sudah Anda ajukan.
- **Yang biasanya terlihat**:
  - Status pendaftaran (misal: `pending`, `approved`, `rejected`).
  - Status per pilihan mata kuliah & kelas.
  - Catatan dari reviewer (jika ada).
- **Tip**: cek halaman ini secara berkala setelah Anda submit.

### Halaman: Jadwal Praktikum
- **URL**: `/jadwal`
- **Tujuan**: melihat jadwal penggunaan laboratorium.
- **Yang bisa Anda lakukan (Mahasiswa)**:
  - Memilih filter **Laboratorium** dan **Semester**.
  - Melihat kotak jadwal yang terisi/kosong.
- **Catatan**: mahasiswa biasanya hanya bisa melihat, bukan mengubah jadwal.

### Halaman: Laporan BAP
- **URL**: `/bap`
- **Tujuan**: mengisi Berita Acara Praktikum per pertemuan untuk jadwal yang Anda pegang.
- **Alur pengisian**:
  1. Pilih kartu jadwal (mata kuliah, kelas, lab) yang ingin Anda laporkan.
  2. Buka **Pertemuan ke-…**.
  3. Isi data per pertemuan: tanggal, topik, status (mis. luring/daring), jumlah hadir, jumlah tidak hadir, dosen PJ, dan upload foto.
  4. Klik **Simpan/Kirim** pada form pertemuan.
  5. Setelah semua pertemuan terisi lengkap, klik **Generate Dokumen BAP**.
- **Catatan foto**: biasanya hanya menerima JPG/JPEG/PNG.
- **Jika tombol generate tidak aktif**: biasanya karena ada pertemuan yang belum lengkap atau foto belum memenuhi syarat.

### Halaman: Sertifikat Saya
- **URL**: `/sertifikat`
- **Tujuan**: melihat daftar sertifikat yang sudah diterbitkan untuk Anda.
- **Cara pakai**:
  - Klik **Lihat** untuk membuka sertifikat.
  - Unduh/print dari tampilan viewer (tergantung browser).

### Halaman: Sertifikat Viewer
- **URL**: `/sertifikat/{id}/view`
- **Tujuan**: membuka file sertifikat tertentu.

---

## Panduan Per Halaman — Admin

Bagian ini khusus role **Admin**. Jika menu tidak muncul, berarti akun Anda bukan admin.

### Halaman: Data Master — Semester
- **URL**: `/admin/semesters`
- **Tujuan**: mengelola data semester (gasal/genap, tahun, semester aktif).
- **Yang bisa dilakukan**:
  - **Tambah** semester baru.
  - **Edit** semester.
  - **Hapus** semester.
  - Menandai **Semester Aktif** (biasanya hanya satu yang aktif).
- **Tip**: pastikan semester aktif sesuai periode berjalan karena dipakai di banyak fitur.

### Halaman: Data Master — Mata Kuliah
- **URL**: `/admin/mata-kuliah`
- **Tujuan**: mengelola daftar mata kuliah (nama, kode, nilai minimum, pertemuan praktikum, dll).
- **Yang bisa dilakukan**: tambah/edit/hapus mata kuliah (sesuai tombol yang tersedia).

### Halaman: Data Master — Laboratorium
- **URL**: `/admin/laboratorium`
- **Tujuan**: mengelola daftar laboratorium.

### Halaman: Data Master — Daftar Kelas
- **URL**: `/admin/kelas-list`
- **Tujuan**: mengelola kelas per mata kuliah (contoh: IF-01, IF-02) dan kapasitas/jumlah mahasiswa (jika ada).

### Halaman: Events (Event Oprec)
- **URL**: `/admin/events`
- **Tujuan**: membuat dan mengatur event rekrutmen.
- **Yang bisa dilakukan**:
  - Membuat event baru (nama, tipe, semester, tanggal buka/tutup, deskripsi).
  - Mengubah event (edit).
  - Menghapus event.
  - Mengubah status **OPEN/CLOSED** (buka/tutup pendaftaran).
- **Tip**: sebelum event dibuka, pastikan semester & mata kuliah/kelas sudah rapi.

### Halaman: Detail Event
- **URL**: `/admin/events/{id}`
- **Tujuan**: mengatur mata kuliah+kelas yang dibuka di event, dan memantau asisten yang sudah di-ACC.
- **Yang bisa dilakukan (umum)**:
  - Menambahkan “mata kuliah dibuka” ke event.
  - Melihat daftar **asisten terpilih**.
  - Melakukan pengelolaan asisten (misal: switch/replace jika fitur tersedia).
- **Tip**: gunakan pencarian untuk cepat menemukan asisten/mata kuliah/kelas.

### Halaman: Seleksi Asisten
- **URL**: `/seleksi`
- **Tujuan**: melakukan review dan ACC/tolak pendaftar per mata kuliah & kelas.
- **Cara pakai (ringkas)**:
  1. Pilih filter event/status, atau gunakan pencarian.
  2. Buka panel mata kuliah/kelas.
  3. Periksa data kandidat: IPK, nilai, kelengkapan berkas (SPTJM/transkrip).
  4. Klik **Approve** atau **Reject**.
- **Catatan kuota**: jika kuota kelas penuh, approve bisa dibatasi.

### Halaman: Database Asisten — Semua Asisten
- **URL**: `/database/all`
- **Tujuan**: melihat daftar asisten (unik) yang pernah bertugas.
- **Yang bisa dilakukan**:
  - Cari berdasarkan nama/NIM.
  - Buka detail untuk melihat riwayat penugasan per event.

### Halaman: Database Asisten — Per Event
- **URL**: `/database/event`
- **Tujuan**: melihat database asisten berdasarkan event tertentu.

### Halaman: Monitoring BAP
- **URL**: `/bap/monitoring`
- **Tujuan**: memantau progres pengisian BAP oleh asisten.

### Halaman: Absensi Asisten
- **URL**: `/absensi`
- **Tujuan**: mengisi kehadiran asisten per pertemuan.
- **Cara pakai (ringkas)**:
  1. Pilih **Event**.
  2. Pilih **Mata Kuliah**.
  3. (Opsional) Pilih **Kelas** atau biarkan “Semua Kelas”.
  4. Centang kehadiran pada pertemuan yang sesuai.
- **Tip**: gunakan kolom cari nama untuk mempercepat.

### Halaman: Sertifikat — Penerbitan
- **URL**: `/sertifikat/penerbitan`
- **Tujuan**: menyiapkan template dan menerbitkan sertifikat untuk event tertentu.
- **Alur umum**:
  1. Pilih **Event**.
  2. Upload **template sertifikat (PDF)**.
  3. Atur posisi teks (Nama, Nomor, Mata Kuliah, Custom) pada template (geser/ubah koordinat).
  4. Simpan konfigurasi.
  5. Generate sertifikat untuk peserta yang memenuhi syarat.
- **Tip**: gunakan data “Preview” agar hasil posisi teks mudah dicek sebelum generate massal.

### Halaman: Sertifikat — Data Sertifikat
- **URL**: `/sertifikat/data`
- **Tujuan**: melihat daftar sertifikat yang sudah diterbitkan per event.
- **Yang bisa dilakukan**:
  - Filter berdasarkan event.
  - Klik **Lihat** untuk membuka sertifikat.

---

## Panduan Per Halaman — Dosen

Role **Dosen** umumnya mirip dengan Admin untuk proses monitoring dan seleksi, tetapi tanpa beberapa menu data master.

Halaman yang biasanya tersedia untuk Dosen:
- **Dashboard** (`/dashboard`)
- **Jadwal Praktikum** (`/jadwal`)
- **Seleksi Asisten** (`/seleksi`)
- **Database Asisten** (`/database/all`, `/database/event`)
- **Monitoring BAP** (`/bap/monitoring`)
- **Absensi Asisten** (`/absensi`)
- **Sertifikat (Penerbitan & Data)** (`/sertifikat/penerbitan`, `/sertifikat/data`)

Cara pakainya mengikuti penjelasan di bagian **Admin** pada halaman yang sama.

---

## FAQ (Masalah yang Sering Terjadi)

### 1) Menu saya tidak sama dengan teman saya
Itu normal. Menu tergantung **role** akun (Mahasiswa/Admin/Dosen).

### 2) Saya tidak bisa submit pendaftaran oprec
Biasanya karena **Profil Asisten belum lengkap** atau belum memilih mata kuliah.  
Cek halaman `/profil` lalu lengkapi: nama lengkap, WA, IPK, rekening, transkrip, KTM.

### 3) File transkrip/KTM tidak bisa diunggah
Pastikan:
- Format sesuai (transkrip biasanya **PDF**, KTM bisa PDF/gambar).
- Ukuran file tidak melebihi batas (seringnya max 5MB).

### 4) Status pendaftaran saya tidak berubah
Status akan berubah setelah admin/dosen melakukan review di halaman seleksi.  
Pantau di `/oprec/my-applications`.

### 5) Tombol “Generate BAP” tidak bisa dipakai
Biasanya karena masih ada pertemuan yang belum lengkap (data & foto).  
Lengkapi semua pertemuan dulu.
