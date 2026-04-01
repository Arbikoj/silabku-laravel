<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\Event;
use App\Models\Application;
use App\Models\ApplicationMataKuliah;
use App\Models\EventMataKuliah;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DummyApplicantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan ada event yang terbuka (ambil event pertama)
        $event = Event::first();
        if (!$event) {
            $this->command->info('Tidak ada event yang ditemukan. Buat event terlebih dahulu.');
            return;
        }

        $eventMatkuls = EventMataKuliah::where('event_id', $event->id)->get();
        if ($eventMatkuls->isEmpty()) {
            $this->command->info('Tidak ada opsi mata kuliah untuk event ini.');
            return;
        }

        $statuses = ['pending', 'approved', 'rejected'];
        $banks = ['BCA', 'BNI', 'BRI', 'Mandiri', 'BSI'];
        $catatanPenolakan = [
            'Nilai kurang memenuhi kualifikasi',
            'Kuota telah terpenuhi',
            'IPK tidak mencapai batas minimum',
            'Tidak lulus tes seleksi',
        ];

        $this->command->info('Membuat ~100 data dummy pelamar...');

        $password = Hash::make('password'); // Cache password hash supaya cepat

        for ($i = 0; $i < 100; $i++) {
            $name = 'Pelamar ' . $i . ' ' . Str::random(3);
            
            // 1. Buat User Mahasiswa
            $user = User::create([
                'name' => $name,
                'nim' => '12' . str_pad($i, 6, '0', STR_PAD_LEFT) . rand(10, 99),
                'email' => 'pelamar' . $i . '_' . Str::random(4) . '@student.id',
                'password' => $password,
                'role' => 'user',
            ]);

            // 2. Buat Profile Mahasiswa
            Profile::create([
                'user_id' => $user->id,
                'nama_lengkap' => $name,
                'no_wa' => '08123' . rand(100000, 999999),
                'norek' => rand(100000000, 999999999),
                'nama_rek' => $name,
                'bank' => $banks[array_rand($banks)],
                'nilai_ipk' => rand(200, 400) / 100,
            ]);

            // 3. Buat Application (Parent)
            $applicationStatus = $statuses[array_rand($statuses)];
            $app = Application::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'status' => $applicationStatus,
            ]);

            // 4. Pilih 1 - 3 mata kuliah secara acak dari event matkul yang tersedia
            $selectedEventMatkuls = $eventMatkuls->random(rand(1, min(3, $eventMatkuls->count())));

            foreach ($selectedEventMatkuls as $emk) {
                // Tentukan status untuk masing-masing matkul (bisa sama dengan parent atau diacak khusus untuk status pending/rejected di parent)
                $matkulStatus = $applicationStatus === 'pending' ? 'pending' : $statuses[array_rand($statuses)];
                
                $catatan = null;
                if ($matkulStatus === 'rejected') {
                    $catatan = $catatanPenolakan[array_rand($catatanPenolakan)];
                }

                ApplicationMataKuliah::create([
                    'application_id' => $app->id,
                    'event_mata_kuliah_id' => $emk->id,
                    'status' => $matkulStatus,
                    'catatan' => $catatan,
                ]);
            }
        }

        $this->command->info('100 dummy pelamar berhasil dibuat!');
    }
}
