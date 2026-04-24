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
        $semesters = Semester::all();
        $kelasList = Kelas::with('mataKuliah')->get();

        if ($semesters->isEmpty() || $kelasList->isEmpty()) {
            return;
        }

        $hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        $slotWaktu = [
            ['07:30', '09:30'],
            ['10:00', '12:00'],
            ['13:00', '15:00'],
            ['15:00', '17:00'],
        ];

        foreach ($semesters as $semester) {
            foreach ($labModels as $lab) {
                foreach ($hariList as $hari) {
                    foreach ($slotWaktu as $slot) {
                        if (rand(0, 10) > 4) { // 60% chance per slot per lab per semester
                            $k = $kelasList->random();
                            JadwalPraktikum::firstOrCreate([
                                'laboratorium_id' => $lab->id,
                                'semester_id' => $semester->id,
                                'mata_kuliah_id' => $k->mata_kuliah_id,
                                'kelas_id' => $k->id,
                                'hari' => $hari,
                                'jam_mulai' => $slot[0],
                                'jam_selesai' => $slot[1],
                            ], [
                                'keterangan' => 'Praktikum ' . ($k->mataKuliah->nama ?? 'Mata Kuliah'),
                            ]);
                        }
                    }
                }
            }
        }
    }
}
