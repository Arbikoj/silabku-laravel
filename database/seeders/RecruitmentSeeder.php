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

        $semesterData = [
            ['nama' => 'Gasal 2024/2025', 'tipe' => 'gasal', 'tahun' => 2024, 'is_active' => false],
            ['nama' => 'Genap 2024/2025', 'tipe' => 'genap', 'tahun' => 2024, 'is_active' => false],
            ['nama' => 'Gasal 2025/2026', 'tipe' => 'gasal', 'tahun' => 2025, 'is_active' => false],
            ['nama' => 'Genap 2025/2026', 'tipe' => 'genap', 'tahun' => 2025, 'is_active' => false],
            ['nama' => 'Gasal 2026/2027', 'tipe' => 'gasal', 'tahun' => 2026, 'is_active' => true],
        ];

        $semesters = [];
        foreach ($semesterData as $data) {
            $semesters[] = Semester::updateOrCreate(['nama' => $data['nama']], $data);
        }

        $activeSemester = collect($semesters)->firstWhere('is_active', true);

        $subjectsData = [
            ['kode' => 'SD202', 'nama' => 'Struktur Data', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#3b82f6'],
            ['kode' => 'PF203', 'nama' => 'Pemrograman Berorientasi Fungsi', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#10b981'],
            ['kode' => 'AP101', 'nama' => 'Algoritma Pemrograman', 'sks' => 3, 'pertemuan_praktikum' => 12, 'nilai_minimum' => 'B', 'color' => '#f59e0b'],
            ['kode' => 'BD303', 'nama' => 'Basis Data', 'sks' => 4, 'pertemuan_praktikum' => 14, 'nilai_minimum' => 'BC', 'color' => '#ef4444'],
            ['kode' => 'SSD201', 'nama' => 'Statistika Sains Data', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#8b5cf6'],
            ['kode' => 'ADW401', 'nama' => 'Analisis Deret Waktu', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#ec4899'],
            ['kode' => 'ABD402', 'nama' => 'Analisis Big Data', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#6366f1'],
            ['kode' => 'BIO403', 'nama' => 'Bioinformatika', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#14b8a6', 'r_only' => true],
            ['kode' => 'PM404', 'nama' => 'Pembelajaran Mesin', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#f97316', 'r_only' => true],
            ['kode' => 'PS405', 'nama' => 'Pemodelan Stokastik', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#06b6d4'],
            ['kode' => 'VDI406', 'nama' => 'Visualisasi Data dan Informasi', 'sks' => 3, 'pertemuan_praktikum' => 10, 'nilai_minimum' => 'B', 'color' => '#84cc16'],
        ];

        $mataKuliahs = [];
        foreach ($subjectsData as $data) {
            $rOnly = $data['r_only'] ?? false;
            unset($data['r_only']);
            $mk = MataKuliah::updateOrCreate(['kode' => $data['kode']], $data);
            $mataKuliahs[] = ['mk' => $mk, 'r_only' => $rOnly];
        }

        foreach ($semesters as $semester) {
            $eventPraktikum = Event::updateOrCreate(
                ['nama' => 'Asisten Praktikum ' . $semester->nama, 'semester_id' => $semester->id],
                [
                    'tipe' => 'praktikum',
                    'is_open' => $semester->is_active,
                    'tanggal_buka' => $semester->tahun . '-02-01 00:00:00',
                    'tanggal_tutup' => $semester->tahun . '-12-31 23:59:59',
                    'deskripsi' => 'Pendaftaran asisten praktikum untuk semester ' . $semester->nama,
                ]
            );

            $eventTutorial = Event::updateOrCreate(
                ['nama' => 'Asisten Tutorial ' . $semester->nama, 'semester_id' => $semester->id],
                [
                    'tipe' => 'tutorial',
                    'is_open' => $semester->is_active,
                    'tanggal_buka' => $semester->tahun . '-02-01 00:00:00',
                    'tanggal_tutup' => $semester->tahun . '-12-31 23:59:59',
                    'deskripsi' => 'Pendaftaran asisten tutorial untuk semester ' . $semester->nama,
                ]
            );

            foreach ($mataKuliahs as $mkData) {
                $mk = $mkData['mk'];
                $rOnly = $mkData['r_only'];

                $classesToCreate = $rOnly ? ['R'] : ['RA', 'RB', 'RC'];

                foreach ($classesToCreate as $className) {
                    $jumlahMhs = $rOnly ? rand(20, 30) : rand(40, 55);
                    $kelas = Kelas::updateOrCreate(
                        ['mata_kuliah_id' => $mk->id, 'nama' => $className],
                        ['jumlah_mhs' => $jumlahMhs]
                    );

                    // Add to both events for variety
                    EventMataKuliah::firstOrCreate([
                        'event_id' => $eventPraktikum->id,
                        'mata_kuliah_id' => $mk->id,
                        'kelas_id' => $kelas->id,
                    ]);

                    if (rand(0, 1)) {
                        EventMataKuliah::firstOrCreate([
                            'event_id' => $eventTutorial->id,
                            'mata_kuliah_id' => $mk->id,
                            'kelas_id' => $kelas->id,
                        ]);
                    }
                }
            }
        }
    }
}
