<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventMataKuliah;
use App\Models\Kelas;
use App\Models\MataKuliah;
use App\Models\Profile;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RecruitmentSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@silabku.id'],
            [
                'name' => 'Admin Silabku',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        Profile::updateOrCreate(
            ['user_id' => $admin->id],
            ['nama_lengkap' => 'Administrator Silabku']
        );

        $dosen = User::updateOrCreate(
            ['email' => 'dosen@silabku.id'],
            [
                'name' => 'Dr. Dosen Oprec',
                'password' => Hash::make('password'),
                'role' => 'dosen',
            ]
        );

        Profile::updateOrCreate(
            ['user_id' => $dosen->id],
            ['nama_lengkap' => 'Dr. Dosen Oprec, S.Kom., M.T.']
        );

        $mahasiswa = User::updateOrCreate(
            ['email' => 'arbi@student.id'],
            [
                'name' => 'Arbi J',
                'nim' => '12345678',
                'password' => Hash::make('password'),
                'role' => 'user',
            ]
        );

        Profile::updateOrCreate(
            ['user_id' => $mahasiswa->id],
            [
                'nama_lengkap' => 'Arbi Jatmiko',
                'no_wa' => '081234567890',
                'norek' => '1234567890',
                'nama_rek' => 'Arbi Jatmiko',
                'bank' => 'BCA',
                'nilai_ipk' => 3.75,
            ]
        );

        $semesterAktif = Semester::firstOrCreate(
            ['nama' => 'Gasal 2026/2027'],
            ['tipe' => 'gasal', 'tahun' => 2026, 'is_active' => true]
        );

        Semester::firstOrCreate(
            ['nama' => 'Genap 2025/2026'],
            ['tipe' => 'genap', 'tahun' => 2025, 'is_active' => false]
        );

        $mataKuliahDasar = MataKuliah::updateOrCreate(
            ['kode' => 'IF101'],
            ['nama' => 'Dasar Pemrograman', 'sks' => 3, 'nilai_minimum' => 'B']
        );
        $mataKuliahStruktur = MataKuliah::updateOrCreate(
            ['kode' => 'IF202'],
            ['nama' => 'Struktur Data', 'sks' => 3, 'nilai_minimum' => 'B']
        );
        $mataKuliahBasisData = MataKuliah::updateOrCreate(
            ['kode' => 'IF303'],
            ['nama' => 'Basis Data', 'sks' => 4, 'nilai_minimum' => 'BC']
        );
        $mataKuliahJarkom = MataKuliah::updateOrCreate(
            ['kode' => 'IF404'],
            ['nama' => 'Jaringan Komputer', 'sks' => 3, 'nilai_minimum' => 'C']
        );

        $kelasConfigs = [
            [$mataKuliahDasar->id, 'RA', 40],
            [$mataKuliahDasar->id, 'RB', 32],
            [$mataKuliahStruktur->id, 'RA', 45],
            [$mataKuliahBasisData->id, 'RC', 24],
            [$mataKuliahJarkom->id, 'RB', 28],
        ];

        $kelasMap = [];
        foreach ($kelasConfigs as [$mataKuliahId, $namaKelas, $jumlahMhs]) {
            $kelas = Kelas::updateOrCreate(
                ['mata_kuliah_id' => $mataKuliahId, 'nama' => $namaKelas],
                ['jumlah_mhs' => $jumlahMhs]
            );

            $kelasMap[$mataKuliahId . ':' . $namaKelas] = $kelas;
        }

        $event = Event::updateOrCreate(
            ['nama' => 'Asisten Praktikum Gasal 2026', 'semester_id' => $semesterAktif->id],
            [
                'tipe' => 'praktikum',
                'is_open' => true,
                'tanggal_buka' => '2026-03-01 00:00:00',
                'tanggal_tutup' => '2026-03-31 23:59:59',
                'deskripsi' => 'Pendaftaran asisten praktikum untuk semester Gasal 2026/2027.',
            ]
        );

        $eventPilihan = [
            [$mataKuliahDasar->id, 'RA'],
            [$mataKuliahDasar->id, 'RB'],
            [$mataKuliahStruktur->id, 'RA'],
            [$mataKuliahBasisData->id, 'RC'],
            [$mataKuliahJarkom->id, 'RB'],
        ];

        foreach ($eventPilihan as [$mataKuliahId, $namaKelas]) {
            EventMataKuliah::firstOrCreate([
                'event_id' => $event->id,
                'mata_kuliah_id' => $mataKuliahId,
                'kelas_id' => $kelasMap[$mataKuliahId . ':' . $namaKelas]->id,
            ]);
        }
    }
}
