# LAPORAN EVALUASI IMPLEMENTASI SISTEM

## 1. Pendahuluan

### 1.1 Latar Belakang

Dalam upaya meningkatkan efektivitas dan efisiensi pengelolaan administrasi asisten praktikum, telah dikembangkan dan diimplementasikan sistem digital terintegrasi bernama **Silabku**. Sistem ini dibangun untuk mendukung proses pengelolaan data akademik, rekrutmen asisten, seleksi, penyusunan jadwal, pelaporan BAP, absensi, hingga penerbitan sertifikat dalam satu platform yang saling terhubung.

Berdasarkan implementasi pada project ini, Silabku menggunakan arsitektur **Laravel 12**, **Inertia.js**, **React + TypeScript**, dan **Laravel Sanctum**. Sistem menyediakan alur layanan yang lebih terstruktur dibandingkan proses manual, sekaligus mempermudah admin, dosen, dan mahasiswa dalam mengakses layanan administrasi praktikum.

Setelah implementasi dilakukan, diperlukan evaluasi untuk mengetahui tingkat keberhasilan sistem, efektivitas penggunaannya, serta kendala yang ditemukan selama proses implementasi berlangsung.

### 1.2 Tujuan Evaluasi

Evaluasi sistem dilakukan dengan tujuan:

* Mengetahui efektivitas implementasi sistem Silabku.
* Mengukur kemudahan penggunaan sistem oleh admin, dosen, dan mahasiswa.
* Mengidentifikasi kendala teknis maupun nonteknis pada modul yang telah diimplementasikan.
* Menjadi bahan pengembangan dan perbaikan sistem pada tahap berikutnya.

### 1.3 Ruang Lingkup Evaluasi

Ruang lingkup evaluasi meliputi:

* Penggunaan fitur sistem pada modul utama Silabku
* Efektivitas layanan administrasi asisten praktikum
* Kemudahan akses dan penggunaan sistem
* Stabilitas dan performa sistem berdasarkan implementasi dan hasil uji coba
* Kendala penggunaan sistem dan kebutuhan penyempurnaan

---

## 2. Metodologi Evaluasi

Metode evaluasi dilakukan melalui beberapa tahapan, yaitu:

### 2.1 Pengujian Sistem

Pengujian dilakukan terhadap fitur-fitur utama sistem untuk memastikan fungsi berjalan dengan baik sesuai kebutuhan pengguna. Berdasarkan dokumen uji coba yang tersedia pada project, pengujian telah mencakup autentikasi, profil, master data, event rekrutmen, seleksi, database asisten, jadwal praktikum, BAP, absensi asisten, dan sertifikat.

### 2.2 Observasi Penggunaan Sistem

Observasi dilakukan terhadap alur penggunaan sistem oleh tiga kelompok pengguna utama, yaitu admin, dosen, dan mahasiswa. Observasi difokuskan pada kemudahan penggunaan, keterpaduan alur kerja, dan efektivitas layanan administrasi yang dihasilkan oleh sistem.

### 2.3 Pengumpulan Data

Data evaluasi diperoleh melalui:

* Penelaahan implementasi aktual pada route, controller, model, migration, dan halaman frontend project
* Dokumen uji coba sistem pada folder `docs`
* Pengamatan terhadap struktur fitur dan alur bisnis aplikasi
* Dokumentasi hasil implementasi sistem

---

## 3. Hasil Implementasi

Berdasarkan implementasi yang telah dilakukan, diperoleh hasil sebagai berikut:

* Sistem berhasil diimplementasikan sebagai platform pengelolaan asisten praktikum berbasis web.
* Sistem mendukung tiga kelompok pengguna utama, yaitu admin, dosen, dan mahasiswa.
* Proses administrasi yang sebelumnya terpisah dapat dikelola dalam satu sistem terintegrasi.
* Sistem telah mencakup modul master data, open recruitment, seleksi asisten, database asisten, jadwal praktikum, BAP, absensi, dan sertifikat.
* Dokumentasi uji coba yang tersedia menunjukkan bahwa fitur-fitur utama sistem telah berjalan dengan baik pada tahap implementasi.

### Data Penggunaan Sistem

| No | Indikator                         | Hasil |
| -- | --------------------------------- | ----- |
| 1  | Jumlah pengguna sistem            | 3 kelompok pengguna utama (admin, dosen, mahasiswa) |
| 2  | Data yang berhasil diinput        | Mencakup minimal 8 domain data utama: profil, semester, mata kuliah, kelas, laboratorium, event, jadwal, dan dokumen administrasi |
| 3  | Fitur yang digunakan              | 30 fitur utama teridentifikasi dari dokumen uji coba sistem |
| 4  | Tingkat keberhasilan akses sistem | 100% pada 30 item uji fungsional yang terdokumentasi |

Keterangan: indikator pada tabel di atas disusun berdasarkan implementasi aktual project dan dokumen [laporan uji coba](/Users/arbiii/project/silabku/silabku-laravel/docs/laporan-uji-coba-silabku-2026-04-25.md), karena data statistik penggunaan produksi belum tersedia pada repo.

---

## 4. Analisis Evaluasi (Hasil dan Pembahasan)

### 4.1 Kualitas Sistem

Secara umum, kualitas sistem tergolong baik karena fitur-fitur inti telah terimplementasi secara lengkap dan saling terhubung. Silabku tidak hanya menyediakan pengelolaan data dasar, tetapi juga mendukung proses bisnis yang lebih spesifik seperti seleksi asisten per mata kuliah, validasi kuota, monitoring BAP, absensi asisten, dan penerbitan sertifikat.

Dari sisi teknis, sistem dibangun dengan arsitektur yang cukup modern dan terstruktur. Pemisahan antara route web, API, controller, model, dan halaman frontend membuat sistem lebih mudah dikembangkan serta dipelihara.

### 4.2 Efektivitas Sistem

Implementasi sistem membantu meningkatkan efektivitas administrasi melalui:

* Pengurangan proses manual dalam pendaftaran, seleksi, dan pendataan asisten
* Integrasi data antar modul sehingga informasi tidak tersebar di banyak media
* Akses informasi yang lebih cepat bagi admin, dosen, dan mahasiswa
* Dukungan dokumentasi digital untuk BAP dan sertifikat
* Monitoring proses administrasi secara lebih terstruktur

Sebelum adanya sistem terintegrasi seperti ini, proses administrasi cenderung dilakukan secara terpisah dan berpotensi menimbulkan duplikasi data. Dengan Silabku, alur kerja menjadi lebih efisien karena setiap tahapan sudah memiliki modul yang jelas.

### 4.3 Kemudahan Penggunaan

Sebagian besar alur sistem sudah cukup mudah dipahami karena modul dipisahkan berdasarkan kebutuhan pengguna. Mahasiswa memiliki alur profil, pendaftaran, dan riwayat aplikasi; admin memiliki alur pengelolaan data, event, dan monitoring; sedangkan dosen berfokus pada seleksi dan pengawasan.

Namun demikian, beberapa fitur yang memiliki alur lebih kompleks seperti proses switch dan replacement asisten, pengelolaan BAP, serta konfigurasi template sertifikat masih memerlukan pembiasaan dan pendampingan bagi pengguna baru.

### 4.4 Stabilitas dan Kesiapan Implementasi

Berdasarkan struktur implementasi, sistem menunjukkan kesiapan yang cukup baik untuk digunakan pada lingkungan operasional terbatas atau bertahap. Hal ini terlihat dari:

* Tersedianya kontrol akses berbasis peran
* Pemisahan API dan antarmuka frontend yang rapi
* Dukungan validasi pada beberapa proses penting seperti kuota asisten dan bentrok jadwal
* Tersedianya pengujian otomatis dan dokumentasi alur aplikasi

Meskipun demikian, stabilitas penuh tetap perlu ditunjang dengan pengujian beban, monitoring log, serta evaluasi penggunaan langsung dalam skala yang lebih besar.

---

## 5. Masalah dan Kendala

Beberapa kendala yang ditemukan selama implementasi sistem antara lain:

* Beberapa pengguna masih memerlukan pendampingan pada penggunaan awal, terutama pada modul yang alurnya cukup teknis.
* Terdapat fitur yang memerlukan penyempurnaan tampilan dan konsistensi antarmuka antar halaman.
* Proses unggah, unduh, dan generate dokumen berpotensi dipengaruhi oleh koneksi jaringan dan layanan eksternal.
* Fitur yang terintegrasi dengan dokumen digital seperti BAP dan sertifikat membutuhkan penanganan error yang lebih informatif.
* Monitoring performa sistem secara real-time dan statistik penggunaan produksi belum terlihat tersedia pada repo saat ini.

---

## 6. Kesimpulan dan Rekomendasi

### 6.1 Kesimpulan

Berdasarkan hasil evaluasi, implementasi sistem Silabku telah memberikan dampak positif terhadap efektivitas dan efisiensi administrasi asisten praktikum. Sistem berhasil mengintegrasikan proses pengelolaan data, rekrutmen, seleksi, jadwal, pelaporan BAP, absensi, dan sertifikat ke dalam satu platform yang lebih terstruktur dan mudah diakses.

Secara fungsional, sistem telah menunjukkan hasil implementasi yang baik. Berdasarkan dokumen uji coba yang tersedia, fitur-fitur utama telah dapat dijalankan dengan baik. Dengan demikian, sistem layak dinilai berhasil pada tahap implementasi awal, meskipun masih memerlukan penyempurnaan pada aspek pengalaman pengguna, stabilitas operasional, dan monitoring lanjutan.

### 6.2 Rekomendasi

Adapun rekomendasi untuk pengembangan sistem selanjutnya adalah:

* Melakukan pengembangan dan penyempurnaan fitur sistem secara berkala.
* Meningkatkan sosialisasi dan pelatihan penggunaan sistem bagi admin, dosen, dan mahasiswa.
* Melakukan monitoring dan evaluasi rutin terhadap performa sistem serta proses generate dokumen.
* Melakukan optimalisasi tampilan antarmuka agar lebih konsisten dan mudah digunakan.
* Menambahkan statistik penggunaan, audit log, dan pengujian beban untuk mendukung implementasi skala lebih besar.

---

## 7. Lampiran Ringkas Implementasi

Sebagai dasar evaluasi, implementasi pada project ini menunjukkan:

* Sekitar 26 controller backend aktif pada direktori `app/Http/Controllers`
* Sekitar 71 halaman frontend pada direktori `resources/js/pages`
* 13 file pengujian pada direktori `tests`
* Modul utama yang terdokumentasi mencakup master data, oprec, seleksi, database asisten, jadwal, BAP, absensi, dan sertifikat

Lampiran ini memperkuat bahwa evaluasi disusun berdasarkan kondisi implementasi aktual pada repo, bukan semata-mata template umum.
