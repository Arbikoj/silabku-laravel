<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RecruitmentSeeder::class,
        ]);

        if (config('app.seed_dummy_applicants')) {
            $this->call([
                DummyApplicantSeeder::class,
            ]);
            return;
        }

        $this->command?->warn('DummyApplicantSeeder dilewati. Set SEED_DUMMY_APPLICANTS=true di .env untuk mengaktifkannya.');
    }
}
