# Buku Panduan Pengguna SILABKU

## 1. Pendahuluan
SILABKU adalah aplikasi yang membantu pengelolaan kegiatan asisten laboratorium, mulai dari proses Open Recruitment (pendaftaran asisten), pengaturan jadwal praktikum, pelaporan BAP, absensi, sampai penerbitan sertifikat. Buku panduan ini ditujukan untuk pengguna akhir agar bisa memahami fungsi setiap menu dan langkah penggunaannya tanpa perlu penjelasan teknis.

Panduan ini dibagi berdasarkan **hak akses (role)**, karena menu yang tampil akan berbeda untuk **Mahasiswa (User/Mhs)**, **Admin**, dan (jika tersedia) **Dosen**. Jika Anda tidak menemukan menu yang disebutkan pada role tertentu, kemungkinan akun Anda memiliki role berbeda.

## 2. Tujuan Sistem
Tujuan utama SILABKU adalah menyatukan alur kerja pengelolaan asisten dalam satu sistem yang rapi dan terukur. Sistem ini dibuat agar proses pendaftaran asisten bisa dilakukan secara mandiri oleh mahasiswa, proses seleksi bisa dilakukan lebih cepat oleh admin/dosen, serta seluruh kegiatan pendukung (jadwal, BAP, absensi, sertifikat) dapat tercatat dan mudah dipantau.

## 3. Manfaat Sistem
Dengan SILABKU, mahasiswa bisa mendaftar event rekrutmen dan memantau status pendaftarannya tanpa harus bertanya manual ke panitia. Admin/dosen dapat mengelola data master, membuka/menutup event, melakukan seleksi kandidat, memonitor progres pelaporan BAP, mengisi absensi, dan menerbitkan sertifikat secara terpusat. Di sisi organisasi, manfaat terbesarnya adalah data menjadi terdokumentasi, transparansi proses meningkat, dan waktu operasional lebih efisien.

## 4. Langkah Hak Akses Pengguna

### A. Level User Mahasiswa (User/Mhs)
Pada level Mahasiswa, fokus utama adalah melengkapi profil, mengikuti Open Recruitment, mengisi BAP (jika sudah menjadi asisten), melihat jadwal, dan mengakses sertifikat yang sudah diterbitkan.

**A.1 Login**
Untuk masuk ke sistem, buka halaman login di URL `/login`, kemudian masukkan kredensial akun Anda (misalnya email dan password sesuai form). Jika berhasil, Anda akan diarahkan ke Dashboard. Jika sistem meminta verifikasi email, selesaikan dulu di halaman `/verify-email`. Bila lupa password, gunakan menu lupa password di `/forgot-password`.

**A.2 Dashboard**
Setelah login, Anda berada di halaman Dashboard (`/dashboard`). Halaman ini berfungsi sebagai ringkasan aktivitas, misalnya akses cepat menuju Event Oprec, BAP, atau Jadwal Praktikum. Gunakan Dashboard untuk memulai aktivitas harian Anda di SILABKU.

**A.3 Open Recruitment (Profil Asisten)**
Sebelum mendaftar event, pastikan profil Anda lengkap di halaman Profil Asisten (`/profil`). Di halaman ini Anda mengisi data diri dan data perbankan, serta mengunggah berkas yang dibutuhkan seperti Transkrip dan KTM. Beberapa proses pendaftaran akan menolak pengajuan jika profil belum lengkap, jadi pastikan semua data wajib sudah diisi lalu simpan perubahan.

Jika Anda ingin memastikan berkas yang terunggah sudah benar, Anda bisa membuka tampilan berkas melalui fitur lihat transkrip (`/profil/transkrip`) dan lihat KTM (`/profil/ktm`) dari tombol “Lihat” yang tersedia pada halaman profil.

**A.4 Open Recruitment (Event Terbuka)**
Untuk melihat event rekrutmen yang sedang dibuka, buka menu Event Terbuka pada Open Recruitment (`/oprec/events`). Anda dapat mencari event berdasarkan nama event atau semester. Pilih event yang masih terbuka, lalu klik tombol “Daftar Sekarang” untuk menuju halaman pendaftaran.

**A.5 Open Recruitment (Form Pendaftaran)**
Form pendaftaran berada di URL `/oprec/apply/{eventId}` (eventId mengikuti event yang Anda pilih). Di halaman ini, Anda memilih mata kuliah dan kelas yang ingin Anda daftar. Setelah memilih, Anda diminta mengisi nilai mata kuliah serta mengunggah SPTJM (jika diminta oleh sistem). Setelah semua terisi, kirim pendaftaran. Jika tombol kirim tidak aktif atau muncul peringatan profil belum lengkap, kembali ke halaman `/profil` untuk melengkapi data wajib terlebih dahulu.

**A.6 Open Recruitment (Pendaftaran Saya)**
Setelah mengirim pendaftaran, Anda bisa memantau status di halaman Pendaftaran Saya (`/oprec/my-applications`). Halaman ini menampilkan status utama pendaftaran (misalnya pending/approved/rejected) serta status per pilihan mata kuliah. Jika ada catatan dari reviewer, catatan tersebut juga akan tampil sebagai bahan perbaikan atau informasi hasil seleksi.

**A.7 Jadwal Praktikum**
Menu Jadwal Praktikum berada di `/jadwal`. Pada level Mahasiswa, halaman ini umumnya untuk melihat jadwal penggunaan laboratorium. Anda dapat memfilter berdasarkan laboratorium dan semester, lalu melihat slot waktu yang terisi atau kosong. Mahasiswa biasanya hanya bisa melihat, bukan menambah atau mengubah jadwal.

**A.8 Laporan BAP**
Menu Laporan BAP berada di `/bap`. Halaman ini digunakan oleh mahasiswa yang sudah bertugas sebagai asisten untuk mengisi laporan per pertemuan. Anda memilih jadwal yang sesuai, lalu membuka pertemuan ke-1, ke-2, dan seterusnya untuk mengisi tanggal, topik, status pelaksanaan, jumlah hadir/tidak hadir, dosen PJ, dan mengunggah foto dokumentasi sesuai ketentuan. Setelah semua pertemuan lengkap, Anda dapat menekan tombol “Generate Dokumen BAP” untuk membuat dokumen BAP. Jika tombol generate belum bisa dipakai, biasanya masih ada pertemuan yang belum lengkap atau foto belum memenuhi syarat format.

**A.9 Sertifikat (Sertifikat Saya)**
Menu Sertifikat untuk Mahasiswa ada di `/sertifikat`. Halaman ini menampilkan daftar sertifikat yang sudah diterbitkan untuk Anda, lengkap dengan informasi event, semester, mata kuliah, nomor sertifikat, dan tanggal terbit. Untuk membuka sertifikat, klik tombol “Lihat” pada baris data yang tersedia. Sistem akan membuka viewer sertifikat di `/sertifikat/{id}/view`.

---

### B. Level User Admin
Pada level Admin, Anda memiliki akses pengelolaan data master, pengaturan event, seleksi kandidat, monitoring kegiatan, absensi, dan penerbitan sertifikat.

**B.1 Login**
Proses login admin sama seperti pengguna lain melalui `/login`. Setelah login, menu Admin akan muncul di sidebar sesuai hak akses. Jika menu Admin tidak tampil, pastikan akun Anda benar-benar memiliki role admin.

**B.2 Dashboard**
Dashboard admin berada di `/dashboard` dan berfungsi menampilkan ringkasan, misalnya jumlah event aktif, total pendaftar, seleksi tertunda, dan sertifikat yang sudah diterbitkan. Dari sini admin biasanya melanjutkan ke menu Events, Seleksi, atau menu operasional lain.

**B.3 Data Master**
Data master digunakan untuk memastikan data dasar yang dipakai di event dan jadwal sudah benar. Admin dapat mengelola data berikut:

Pada menu Semester (`/admin/semesters`), admin dapat menambah, mengubah, menghapus semester, serta menentukan semester aktif. Penentuan semester aktif penting karena biasanya menjadi acuan tampilan di aplikasi dan proses operasional berjalan.

Pada menu Mata Kuliah (`/admin/mata-kuliah`), admin mengelola daftar mata kuliah, termasuk atribut yang dibutuhkan untuk proses pendaftaran dan operasional (misalnya nilai minimum atau jumlah pertemuan praktikum, tergantung konfigurasi).

Pada menu Laboratorium (`/admin/laboratorium`), admin mengelola daftar lab yang dipakai pada jadwal praktikum.

Pada menu Daftar Kelas (`/admin/kelas-list`), admin mengelola kelas-kelas yang terhubung dengan mata kuliah.

**B.4 Jadwal Praktikum**
Jadwal Praktikum berada di `/jadwal`. Admin dapat melihat jadwal dan (biasanya) memiliki kemampuan untuk menambah atau mengubah jadwal melalui tombol “Tambah” dan dengan mengklik slot jadwal yang ingin diedit. Sebelum menyimpan jadwal, perhatikan potensi bentrok waktu pada laboratorium yang sama.

**B.5 Events (Kelola Event Oprec)**
Menu Events untuk admin berada di `/admin/events`. Di sini admin membuat event rekrutmen asisten dengan menentukan nama event, tipe (praktikum/tutorial), semester, rentang tanggal buka dan tutup, serta deskripsi. Setelah event dibuat, admin dapat membuka atau menutup pendaftaran (status OPEN/CLOSED) sesuai kebutuhan. Admin juga dapat masuk ke halaman detail event untuk mengatur mata kuliah dan kelas yang dibuka pada event tersebut.

**B.6 Detail Event**
Detail Event berada di `/admin/events/{id}`. Halaman ini membantu admin mengatur “mata kuliah dibuka” pada event, serta memantau daftar asisten yang sudah disetujui. Admin dapat menggunakan pencarian dan pengurutan untuk menemukan data dengan cepat. Jika sistem menyediakan fitur pengelolaan lanjutan (misalnya switch/replace asisten), lakukan sesuai kebutuhan operasional.

**B.7 Seleksi Asisten**
Menu Seleksi Asisten berada di `/seleksi`. Halaman ini dipakai admin untuk meninjau kandidat pendaftar berdasarkan mata kuliah dan kelas. Admin dapat memfilter event dan status, melihat detail kandidat (misalnya IPK, nilai mata kuliah, kelengkapan dokumen), lalu memberikan keputusan Approve atau Reject. Jika kuota pada kelas sudah penuh, sistem biasanya membatasi approval tambahan.

**B.8 Database Asisten**
Database Asisten tersedia di:

Halaman Semua Asisten (`/database/all`) untuk melihat daftar asisten yang pernah bertugas. Admin dapat mencari berdasarkan nama atau NIM dan membuka detail untuk melihat riwayat penugasan.

Halaman Per Event (`/database/event`) untuk melihat data asisten berdasarkan event tertentu (berguna untuk rekap per periode).

**B.9 Monitoring BAP**
Monitoring BAP berada di `/bap/monitoring`. Halaman ini digunakan untuk memantau progres pengisian laporan BAP oleh asisten, sehingga admin bisa memastikan pelaporan berjalan sesuai ketentuan dan dapat mengingatkan jika ada yang tertinggal.

**B.10 Absensi Asisten**
Absensi Asisten berada di `/absensi`. Admin memilih event, lalu memilih mata kuliah, dan (opsional) memilih kelas. Setelah data tampil, admin mengisi kehadiran per pertemuan dengan mencentang kolom yang sesuai untuk setiap asisten. Gunakan fitur pencarian nama untuk mempercepat proses pengisian.

**B.11 Sertifikat (Penerbitan & Data Sertifikat)**
Sertifikat untuk admin terdiri dari dua menu:

Pada menu Penerbitan (`/sertifikat/penerbitan`), admin menyiapkan template sertifikat (PDF), mengatur posisi teks (misalnya nama, nomor sertifikat, mata kuliah, dan teks custom), menyimpan konfigurasi, lalu melakukan generate sertifikat. Pastikan event yang dipilih benar dan preview sudah sesuai sebelum generate massal.

Pada menu Data Sertifikat (`/sertifikat/data`), admin melihat daftar sertifikat yang sudah diterbitkan berdasarkan event yang dipilih. Admin dapat membuka sertifikat melalui tombol “Lihat” yang akan mengarah ke viewer `/sertifikat/{id}/view`.

---

### C. Level User Dosen (Jika Digunakan)
Pada beberapa instalasi, Dosen memiliki akses untuk seleksi, monitoring, absensi, dan sertifikat. Jika akun dosen digunakan, langkahnya sama seperti admin pada menu: Dashboard (`/dashboard`), Jadwal (`/jadwal`), Seleksi (`/seleksi`), Database (`/database/all` dan `/database/event`), Monitoring BAP (`/bap/monitoring`), Absensi (`/absensi`), serta Sertifikat (`/sertifikat/penerbitan` dan `/sertifikat/data`).

---

## 5. Panduan Step-by-Step (Alur Penting)
Bagian ini berisi langkah-langkah praktis (step-by-step) untuk proses yang paling sering dilakukan. Ikuti urutannya agar tidak ada langkah yang terlewat.

### 5.1 Step-by-Step Pendaftaran Event (Mahasiswa)
Pendaftaran event dilakukan melalui menu Open Recruitment. Sebelum mulai, pastikan Anda menyiapkan data dan berkas yang diperlukan.

#### A. Checklist yang perlu disiapkan
Siapkan dan pastikan data berikut sudah siap:
1) **Data diri**: nama lengkap, nomor WhatsApp aktif.  
2) **Data perbankan**: nama pemilik rekening, bank, nomor rekening (untuk administrasi honor/validasi jika diperlukan).  
3) **IPK**: isi sesuai transkrip terakhir.  
4) **Berkas Transkrip**: file **PDF** transkrip terbaru (sesuai semester berjalan).  
5) **Berkas KTM**: file **PDF** atau **gambar** (JPG/PNG) KTM yang jelas.  
6) **SPTJM**: file SPTJM (biasanya PDF) bila diminta pada event/mata kuliah tertentu.

Catatan: ketentuan format dan ukuran file mengikuti aturan sistem (seringnya maksimal 5MB). Jika gagal upload, kecilkan ukuran file atau pastikan format sesuai.

#### B. Langkah 1 — Login
1) Buka halaman login: `/login`.  
2) Masukkan email dan password.  
3) Klik **Login** sampai masuk ke `/dashboard`.

#### C. Langkah 2 — Lengkapi Profil Asisten (Wajib)
1) Masuk ke menu **Open Recruitment → Profil Asisten** atau buka URL `/profil`.  
2) Isi data yang kosong: nama lengkap, no WhatsApp, data rekening, bank, dan IPK.  
3) Upload berkas:
   - **Transkrip** (PDF)  
   - **KTM** (PDF/gambar)  
4) Klik **Simpan Perubahan**.  
5) (Opsional) Klik tombol **Lihat** untuk memastikan file yang terunggah benar (transkrip/KTM).

Jika profil belum lengkap, sistem biasanya menolak pendaftaran saat Anda mencoba submit.

#### D. Langkah 3 — Pilih Event yang Terbuka
1) Buka menu **Open Recruitment → Event Terbuka** atau URL `/oprec/events`.  
2) Cari event yang sesuai (bisa pakai kolom pencarian).  
3) Pastikan status event masih terbuka dan belum melewati tanggal tutup.  
4) Klik **Daftar Sekarang** pada event yang dipilih.

#### E. Langkah 4 — Isi Form Pendaftaran Event
1) Anda akan masuk ke halaman pendaftaran: `/oprec/apply/{eventId}`.  
2) Pilih mata kuliah/kelas yang ingin Anda daftar dengan **mencentang** pilihan yang tersedia.  
3) Klik tombol **Pilih Nilai & Upload SPTJM**.  
4) Pada form/modal yang muncul, lengkapi untuk setiap mata kuliah yang Anda pilih:
   - Isi **nilai mata kuliah** (A/AB/B/BC/C/D/E sesuai opsi yang tersedia).  
   - Upload **SPTJM** (jika diminta/tersedia kolom upload).  
5) Setelah semua terisi, klik tombol **Kirim/Submit** pendaftaran.

#### F. Langkah 5 — Cek Status Pendaftaran
1) Setelah submit berhasil, Anda akan diarahkan ke `/oprec/my-applications`.  
2) Cek status pendaftaran Anda:
   - `pending` berarti menunggu review.  
   - `approved` berarti diterima.  
   - `rejected` berarti ditolak.  
3) Baca **catatan** jika ada, terutama jika ada dokumen yang perlu diperbaiki.

#### G. Jika ada masalah saat daftar (panduan cepat)
- **Muncul pesan “Harap lengkapi Profil Anda terlebih dahulu!”**: kembali ke `/profil`, lengkapi data & upload transkrip/KTM, lalu simpan.  
- **Tidak bisa klik submit**: pastikan minimal memilih 1 mata kuliah dan sudah mengisi nilai (serta upload SPTJM jika diminta).  
- **Upload gagal**: pastikan format file benar dan ukuran file tidak terlalu besar.

### 5.2 Step-by-Step Admin Membuka Event Oprec
Alur ini dipakai ketika admin ingin membuat event dan membukanya untuk pendaftaran mahasiswa.

1) Pastikan data master siap:
   - Semester aktif sudah benar di `/admin/semesters`.  
   - Mata kuliah dan kelas sudah tersedia di `/admin/mata-kuliah` dan `/admin/kelas-list`.  
2) Buka menu **Events**: `/admin/events`.  
3) Klik **Buat Event**.  
4) Isi informasi event: nama event, tipe (praktikum/tutorial), semester, tanggal buka/tutup, dan deskripsi.  
5) Simpan event.  
6) Ubah status event menjadi **OPEN** (buka pendaftaran) jika sudah siap.  
7) Masuk ke **Detail** event: `/admin/events/{id}` untuk memastikan mata kuliah/kelas yang dibuka sudah sesuai.

### 5.3 Step-by-Step Seleksi Kandidat (Admin/Dosen)
Alur ini digunakan untuk meninjau pendaftar dan menentukan hasil seleksi.

1) Buka menu **Seleksi Asisten**: `/seleksi`.  
2) Pilih filter event (jika tersedia) dan status (misalnya pending).  
3) Buka panel mata kuliah/kelas yang ingin direview.  
4) Periksa kandidat:
   - IPK dan nilai mata kuliah (jika tampil).  
   - Kelengkapan dokumen (transkrip/SPTJM) bila ditampilkan.  
5) Klik **Approve** untuk menerima atau **Reject** untuk menolak.  
6) Ulangi untuk kandidat lain sampai kuota terpenuhi.

### 5.4 Step-by-Step Penerbitan Sertifikat (Admin/Dosen)
Alur ini digunakan untuk menyiapkan template sertifikat dan melakukan generate.

1) Buka menu **Sertifikat → Penerbitan**: `/sertifikat/penerbitan`.  
2) Pilih **Event** yang akan diterbitkan sertifikatnya.  
3) Upload **template sertifikat (PDF)** jika belum ada.  
4) Atur posisi teks (Nama, Nomor, Mata Kuliah, Custom) pada template:
   - Geser layer teks atau ubah nilai koordinat sesuai fitur yang tersedia.  
   - Gunakan data “Preview” untuk memastikan tampilan pas di tempatnya.  
5) **Simpan konfigurasi** agar setting tidak hilang.  
6) Jalankan **Generate** sertifikat sesuai tombol/fungsi yang tersedia pada halaman.  
7) Verifikasi hasil di **Sertifikat → Data Sertifikat**: `/sertifikat/data` (filter event, lalu klik Lihat).
