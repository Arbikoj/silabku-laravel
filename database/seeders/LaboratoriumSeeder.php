<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Laboratorium;
use App\Models\JadwalPraktikum;
use App\Models\Semester;
use App\Models\Kelas;

class LaboratoriumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $labs = [
            ['name' => 'Lab Sains Data', 'bio' => 'Labtek 4'],
            ['name' => 'Lab Matematika', 'bio' => 'Labtek 2'],
            ['name' => 'Lab Aktuaria', 'bio' => 'Labtek 5'],
            ['name' => 'Labkom 1 Labtek 3', 'bio' => 'Labtek 3'],
            ['name' => 'Labkom 2 Labtek 3', 'bio' => 'Labtek 3'],
            ['name' => 'Labkom 3 Labtek 3', 'bio' => 'Labtek 3'],
            ['name' => 'Labkom 4 Labtek 3', 'bio' => 'Labtek 3'],
            ['name' => 'Labkom 5 Labtek 3', 'bio' => 'Labtek 3'],
            ['name' => 'Labkom 1 Labtek 5 (OZT)', 'bio' => 'Labtek 5 (OZT)'],
            ['name' => 'Labkom 2 Labtek 5 (OZT)', 'bio' => 'Labtek 5 (OZT)'],
            ['name' => 'Labkom 3 Labtek 5 (OZT)', 'bio' => 'Labtek 5 (OZT)'],
            ['name' => 'Labkom 4 Labtek 5 (OZT)', 'bio' => 'Labtek 5 (OZT)'],
            ['name' => 'Labkom 5 Labtek 5 (OZT)', 'bio' => 'Labtek 5 (OZT)'],
        ];

        $labModels = [];
        foreach ($labs as $lab) {
            $labModels[] = Laboratorium::firstOrCreate(
                ['name' => $lab['name'], 'bio' => $lab['bio']]
            );
        }

        // Dummy Data for Jadwal Praktikum
        $semester = Semester::first();
        $kelasList = Kelas::with('mataKuliah')->get();

        if (!$semester || $kelasList->isEmpty()) {
            return;
        }

        $hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        foreach ($labModels as $lab) {
            foreach ($hariList as $hari) {
                // Sesi 1
                $k1 = $kelasList->random();
                JadwalPraktikum::firstOrCreate([
                    'laboratorium_id' => $lab->id,
                    'semester_id' => $semester->id,
                    'mata_kuliah_id' => $k1->mata_kuliah_id,
                    'kelas_id' => $k1->id,
                    'hari' => $hari,
                    'jam_mulai' => '08:00',
                    'jam_selesai' => '10:00',
                ], [
                    'keterangan' => 'Dummy jadwal',
                ]);

                // Sesi 2
                $k2 = $kelasList->random();
                JadwalPraktikum::firstOrCreate([
                    'laboratorium_id' => $lab->id,
                    'semester_id' => $semester->id,
                    'mata_kuliah_id' => $k2->mata_kuliah_id,
                    'kelas_id' => $k2->id,
                    'hari' => $hari,
                    'jam_mulai' => '13:00',
                    'jam_selesai' => '15:00',
                ], [
                    'keterangan' => 'Dummy jadwal',
                ]);
            }
        }
    }
}
