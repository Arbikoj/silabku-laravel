<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Semester;
use App\Models\MataKuliah;
use App\Models\Kelas;
use App\Models\Event;
use App\Models\EventMataKuliah;
use App\Models\Profile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RecruitmentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Users (Admin, Dosen, Mahasiswa)
        $admin = User::create([
            'name' => 'Admin Silabku',
            'email' => 'admin@silabku.id',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
        Profile::create(['user_id' => $admin->id, 'nama_lengkap' => 'Administrator Silabku']);

        $dosen = User::create([
            'name' => 'Dr. Dosen Oprec',
            'email' => 'dosen@silabku.id',
            'password' => Hash::make('password'),
            'role' => 'dosen',
        ]);
        Profile::create(['user_id' => $dosen->id, 'nama_lengkap' => 'Dr. Dosen Oprec, S.Kom., M.T.']);

        $mhs = User::create([
            'name' => 'Arbi J',
            'nim' => '12345678',
            'email' => 'arbi@student.id',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);
        Profile::create([
            'user_id' => $mhs->id,
            'nama_lengkap' => 'Arbi Jatmiko',
            'no_wa' => '081234567890',
            'norek' => '1234567890',
            'nama_rek' => 'Arbi Jatmiko',
            'bank' => 'BCA',
            'nilai_ipk' => 3.75
        ]);

        // 2. Create Semesters
        $s1 = Semester::create(['nama' => 'Gasal 2026/2027', 'tipe' => 'gasal', 'tahun' => 2026, 'is_active' => true]);
        $s2 = Semester::create(['nama' => 'Genap 2025/2026', 'tipe' => 'genap', 'tahun' => 2025, 'is_active' => false]);

        // 3. Create Mata Kuliah
        $mk1 = MataKuliah::create(['kode' => 'IF101', 'nama' => 'Dasar Pemrograman', 'sks' => 3, 'nilai_minimum' => 3.00]);
        $mk2 = MataKuliah::create(['kode' => 'IF202', 'nama' => 'Struktur Data', 'sks' => 3, 'nilai_minimum' => 3.25]);
        $mk3 = MataKuliah::create(['kode' => 'IF303', 'nama' => 'Basis Data', 'sks' => 4, 'nilai_minimum' => 0.00]);

        // 4. Create Kelas
        $k1 = Kelas::create(['mata_kuliah_id' => $mk1->id, 'nama' => 'RA', 'jumlah_mhs' => 40]); // Kuota 5
        $k2 = Kelas::create(['mata_kuliah_id' => $mk1->id, 'nama' => 'RB', 'jumlah_mhs' => 32]); // Kuota 4
        $k3 = Kelas::create(['mata_kuliah_id' => $mk2->id, 'nama' => 'RA', 'jumlah_mhs' => 45]); // Kuota 6
        $k4 = Kelas::create(['mata_kuliah_id' => $mk3->id, 'nama' => 'RC', 'jumlah_mhs' => 24]); // Kuota 3

        // 5. Create Event
        $event = Event::create([
            'nama' => 'Asisten Praktikum Gasal 2026',
            'tipe' => 'praktikum',
            'semester_id' => $s1->id,
            'is_open' => true,
            'tanggal_buka' => '2026-03-01',
            'tanggal_tutup' => '2026-03-31',
            'deskripsi' => 'Pendaftaran asisten praktikum untuk semester Gasal 2026/2027.'
        ]);

        // 6. Link Event to Matkul & Kelas
        EventMataKuliah::create(['event_id' => $event->id, 'mata_kuliah_id' => $mk1->id, 'kelas_id' => $k1->id]);
        EventMataKuliah::create(['event_id' => $event->id, 'mata_kuliah_id' => $mk1->id, 'kelas_id' => $k2->id]);
        EventMataKuliah::create(['event_id' => $event->id, 'mata_kuliah_id' => $mk2->id, 'kelas_id' => $k3->id]);
        EventMataKuliah::create(['event_id' => $event->id, 'mata_kuliah_id' => $mk3->id, 'kelas_id' => $k4->id]);
    }
}
