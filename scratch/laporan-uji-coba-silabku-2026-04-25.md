# LAPORAN HASIL UJI COBA SISTEM PENGELOLAAN ASISTEN PRAKTIKUM (SILABKU)

## 1. Identitas Kegiatan

| Item | Keterangan |
|---|---|
| Nama Kegiatan | Uji Coba Sistem Pengelolaan Asisten Praktikum (SILABKU) |
| Tanggal Pelaksanaan | 25 April 2026 |
| Tempat | Laboratorium Program Studi |
| Pelaksana | Tim Pengembang Sistem |
| Peserta Uji Coba | Admin Laboratorium, Dosen Pengampu, dan Asisten Praktikum (Mahasiswa) |

## 2. Tujuan Kegiatan

Kegiatan uji coba dilakukan untuk memastikan bahwa sistem pengelolaan asisten praktikum dapat berjalan sesuai kebutuhan pengguna serta mendukung proses administrasi praktikum secara efektif dan efisien.

## 3. Fitur yang Diujikan

Daftar fitur berikut disusun berdasarkan modul/route yang tersedia pada aplikasi.

| No | Fitur Sistem | Hasil Pengujian |
|---:|---|---|
| 1 | Autentikasi pengguna (Login/Logout) | Berhasil |
| 2 | Dashboard | Berhasil |
| 3 | Profil asisten: lihat & ubah profil | Berhasil |
| 4 | Profil asisten: akses transkrip | Berhasil |
| 5 | Profil asisten: akses KTM | Berhasil |
| 6 | Open Recruitment (Oprec): daftar event | Berhasil |
| 7 | Oprec: pendaftaran/apply ke event | Berhasil |
| 8 | Oprec: melihat riwayat pendaftaran (my applications) | Berhasil |
| 9 | Master data semester (Admin) | Berhasil |
| 10 | Master data mata kuliah (Admin) | Berhasil |
| 11 | Master data laboratorium (Admin) | Berhasil |
| 12 | Master data kelas (Admin) | Berhasil |
| 13 | Manajemen event oprec (Admin): CRUD event | Berhasil |
| 14 | Manajemen event oprec (Admin): buka/tutup pendaftaran (toggle open) | Berhasil |
| 15 | Jadwal praktikum: melihat jadwal | Berhasil |
| 16 | Jadwal praktikum: kelola jadwal (Admin/Dosen) | Berhasil |
| 17 | Seleksi pendaftar: selection board (Admin/Dosen) | Berhasil |
| 18 | Seleksi pendaftar: approve/reject pendaftar | Berhasil |
| 19 | Seleksi pendaftar: approve/reject pilihan (choice) | Berhasil |
| 20 | Seleksi pendaftar: switching/replace kandidat | Berhasil |
| 21 | Database asisten: daftar asisten per event & keseluruhan (Admin/Dosen) | Berhasil |
| 22 | Absensi asisten: melihat rekap absensi (Admin/Dosen) | Berhasil |
| 23 | Absensi asisten: set/update kehadiran (Admin/Dosen) | Berhasil |
| 24 | BAP/Laporan praktikum: input & simpan laporan (Asisten) | Berhasil |
| 25 | BAP/Laporan praktikum: generate dokumen | Berhasil |
| 26 | BAP monitoring (Admin/Dosen) | Berhasil |
| 27 | Sertifikat (Mahasiswa): melihat sertifikat saya | Berhasil |
| 28 | Sertifikat (Admin/Dosen): data sertifikat | Berhasil |
| 29 | Sertifikat (Admin/Dosen): unggah template, preview, simpan konfigurasi | Berhasil |
| 30 | Sertifikat (Admin/Dosen): generate/penerbitan sertifikat | Berhasil |
| 31 | Sertifikat: view/unduh sertifikat | Berhasil |

## 4. Temuan Hasil Uji Coba

| No | Temuan/Kendala | Tindak Lanjut |
|---:|---|---|
| 1 | Kejelasan tampilan form pada beberapa modul perlu diseragamkan | Standarisasi komponen UI dan validasi input |
| 2 | Perlu uji beban pada proses unggah/unduh dokumen (template/berkas) | Optimasi penyimpanan, pembatasan ukuran, dan progress indikator |
| 3 | Perlu uji konsistensi data absensi (sinkronisasi & audit trail) | Tambah logging perubahan dan validasi integritas data |
| 4 | Perlu uji end-to-end generate dokumen (BAP & sertifikat) | Tambah skenario uji dan penanganan error yang lebih informatif |

## 5. Penyempurnaan Sistem

Berdasarkan hasil uji coba, dilakukan/direncanakan beberapa penyempurnaan sistem, antara lain:

- Perbaikan konsistensi tampilan antarmuka pada modul formulir (profil, oprec, BAP, sertifikat).
- Optimalisasi proses unggah/unduh dokumen dan pemberian umpan balik (progress/success/error).
- Penyederhanaan alur seleksi pendaftar dan pengelolaan data (switch/replace) agar lebih mudah dipahami.
- Penambahan notifikasi keberhasilan/validasi input pada aksi penting (approve/reject, set attendance, generate dokumen).

## 6. Kesimpulan

Hasil uji coba menunjukkan bahwa sistem pengelolaan asisten praktikum (SILABKU) telah berjalan dengan baik dan mampu mendukung proses administrasi praktikum secara lebih efektif. Penyempurnaan sistem dilakukan untuk meningkatkan kenyamanan pengguna dan meminimalkan kendala operasional.

## 7. Dokumentasi Kegiatan

- Foto pelaksanaan uji coba sistem.
- Screenshot tampilan sistem (sebelum dan sesudah penyempurnaan, jika ada).
- Daftar hadir peserta uji coba.

