<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\ApplicationMataKuliah;
use App\Models\Event;
use App\Models\EventMataKuliah;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DummyApplicantSeeder extends Seeder
{
    private const GRADE_POINTS = [
        'A' => 4.0,
        'AB' => 3.5,
        'B' => 3.0,
        'BC' => 2.5,
        'C' => 2.0,
        'D' => 1.0,
        'E' => 0.0,
    ];

    private const FIRST_NAMES = [
        'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eka', 'Farhan', 'Gita', 'Hendra', 'Intan', 'Joko',
        'Kevin', 'Lestari', 'Maya', 'Nanda', 'Putra', 'Qori', 'Rizky', 'Salsa', 'Taufik', 'Vina',
        'Wahyu', 'Yuni', 'Zaki', 'Alya', 'Bagas', 'Chandra', 'Dimas', 'Fani', 'Galih', 'Hasna',
    ];

    private const LAST_NAMES = [
        'Pratama', 'Saputra', 'Wijaya', 'Permata', 'Lestari', 'Ramadhan', 'Maharani', 'Nugroho', 'Siregar', 'Hidayat',
        'Kusuma', 'Anjani', 'Purnama', 'Utami', 'Setiawan',
    ];

    private const BANKS = ['BCA', 'BNI', 'BRI', 'Mandiri', 'BSI'];

    public function run(): void
    {
        $events = Event::with(['eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas'])->get();

        if ($events->isEmpty()) {
            $this->command?->warn('DummyApplicantSeeder dilewati: belum ada event.');
            return;
        }

        $reviewerId = User::query()
            ->whereIn('role', ['admin', 'dosen'])
            ->value('id');

        $passwordHash = Hash::make('password');
        $poolSize = 563;
        $usersPool = [];

        $this->command?->info("Menyiapkan pool {$poolSize} mahasiswa recruitment...");

        for ($i = 1; $i <= $poolSize; $i++) {
            $fullName = $this->buildCandidateName($i);
            $user = User::firstOrCreate(
                ['email' => sprintf('pelamar-%03d@student.id', $i)],
                [
                    'name' => $fullName,
                    'nim' => $this->buildNim($i),
                    'password' => $passwordHash,
                    'role' => 'user',
                ]
            );

            Profile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'nama_lengkap' => $fullName,
                    'no_wa' => '0812' . str_pad((string) (77000000 + $i), 8, '0', STR_PAD_LEFT),
                    'norek' => '88' . str_pad((string) (10000000 + $i), 8, '0', STR_PAD_LEFT),
                    'nama_rek' => $fullName,
                    'bank' => self::BANKS[$i % count(self::BANKS)],
                    'nilai_ipk' => round(2.5 + (mt_rand(0, 150) / 100), 2),
                ]
            );
            $usersPool[] = $user;
        }

        foreach ($events as $event) {
            $eventMatkuls = $event->eventMataKuliah;

            if ($eventMatkuls->isEmpty()) {
                continue;
            }

            foreach ($eventMatkuls as $eventMatkul) {
                $quota = $this->calculateAssistantQuota((int) $eventMatkul->kelas->jumlah_mhs);
                $applicantCount = min($poolSize, rand($quota + 1, $quota + 4));

                $shuffledPool = collect($usersPool)->shuffle();
                $selectedUsers = $shuffledPool->take($applicantCount);

                $createdChoiceIds = [];

                foreach ($selectedUsers as $index => $user) {
                    $grade = $this->buildGradeForPosition($eventMatkul->mataKuliah->nilai_minimum, $index, $quota, $applicantCount);

                    $application = Application::firstOrCreate([
                        'user_id' => $user->id,
                        'event_id' => $event->id,
                    ], [
                        'status' => 'pending',
                    ]);

                    $choice = ApplicationMataKuliah::firstOrCreate([
                        'application_id' => $application->id,
                        'event_mata_kuliah_id' => $eventMatkul->id,
                    ], [
                        'nilai_mata_kuliah' => $grade,
                        'status' => 'pending',
                    ]);

                    $createdChoiceIds[] = $choice->id;
                }

                // Ranking & Approval logic
                $rankedChoices = ApplicationMataKuliah::with('application.user.profile')
                    ->whereIn('id', $createdChoiceIds)
                    ->get()
                    ->sortBy([
                        fn(ApplicationMataKuliah $choice) => $this->meetsMinimumGrade($choice->nilai_mata_kuliah, $eventMatkul->mataKuliah->nilai_minimum) ? 0 : 1,
                        fn(ApplicationMataKuliah $choice) => -1 * $this->gradePoint($choice->nilai_mata_kuliah),
                        fn(ApplicationMataKuliah $choice) => -1 * (float) ($choice->application?->user?->profile?->nilai_ipk ?? 0),
                        fn(ApplicationMataKuliah $choice) => $choice->id,
                    ])
                    ->values();

                $eligibleChoices = $rankedChoices
                    ->filter(fn(ApplicationMataKuliah $choice) => $this->meetsMinimumGrade($choice->nilai_mata_kuliah, $eventMatkul->mataKuliah->nilai_minimum))
                    ->values();

                $approvedIds = $eligibleChoices->take($quota)->pluck('id')->all();

                foreach ($rankedChoices as $choice) {
                    $isEligible = $this->meetsMinimumGrade($choice->nilai_mata_kuliah, $eventMatkul->mataKuliah->nilai_minimum);

                    if (in_array($choice->id, $approvedIds, true)) {
                        $choice->update([
                            'status' => 'approved',
                            'catatan' => 'Memenuhi kuota.',
                        ]);
                    } else {
                        $choice->update([
                            'status' => $isEligible ? 'pending' : 'rejected',
                            'catatan' => $isEligible ? 'Masuk daftar tunggu.' : 'Nilai tidak cukup.',
                        ]);
                    }

                    $this->syncApplicationStatus($choice->application()->first(), $reviewerId);
                }
            }
            $this->command?->info("Selesai seeding untuk event: {$event->nama}");
        }

        $this->command?->info('Dummy pelamar berhasil dibuat dengan pool terbatas (563 mahasiswa).');
    }

    private function calculateAssistantQuota(int $studentCount): int
    {
        return (int) ceil($studentCount / 8);
    }

    private function buildCandidateName(int $index): string
    {
        $firstName = self::FIRST_NAMES[($index - 1) % count(self::FIRST_NAMES)];
        $lastName = self::LAST_NAMES[intdiv($index - 1, count(self::FIRST_NAMES)) % count(self::LAST_NAMES)];

        return $firstName . ' ' . $lastName;
    }

    private function buildNim(int $index): string
    {
        return '24' . str_pad((string) $index, 8, '0', STR_PAD_LEFT);
    }

    private function buildGradeForPosition(?string $minimumGrade, int $position, int $quota, int $applicantCount): string
    {
        $strongGrades = $this->eligibleGrades($minimumGrade);
        $allGrades = array_keys(self::GRADE_POINTS);
        $belowMinimumGrades = array_values(array_diff($allGrades, $strongGrades));

        if ($position < $quota) {
            return $strongGrades[$position % count($strongGrades)];
        }

        if ($position < min($quota + 2, $applicantCount)) {
            return $strongGrades[array_rand($strongGrades)];
        }

        if (!empty($belowMinimumGrades) && $position % 3 === 0) {
            return $belowMinimumGrades[array_rand($belowMinimumGrades)];
        }

        return $allGrades[array_rand($allGrades)];
    }

    private function buildIpkFromGrade(string $grade, int $position): float
    {
        $base = $this->gradePoint($grade);
        $adjustment = (($position % 5) * 0.07) - 0.08;

        return round(min(4.0, max(2.0, $base + $adjustment)), 2);
    }

    private function eligibleGrades(?string $minimumGrade): array
    {
        if (!$minimumGrade || !isset(self::GRADE_POINTS[$minimumGrade])) {
            return array_keys(self::GRADE_POINTS);
        }

        return array_values(array_filter(
            array_keys(self::GRADE_POINTS),
            fn(string $grade) => $this->gradePoint($grade) >= $this->gradePoint($minimumGrade)
        ));
    }

    private function meetsMinimumGrade(?string $grade, ?string $minimumGrade): bool
    {
        if (!$minimumGrade) {
            return true;
        }

        if (!$grade || !isset(self::GRADE_POINTS[$grade])) {
            return false;
        }

        return $this->gradePoint($grade) >= $this->gradePoint($minimumGrade);
    }

    private function gradePoint(?string $grade): float
    {
        return self::GRADE_POINTS[$grade] ?? -1;
    }

    private function syncApplicationStatus(?Application $application, ?int $reviewerId): void
    {
        if (!$application) {
            return;
        }

        $statuses = $application->applicationMataKuliah()->pluck('status');

        if ($statuses->contains('approved')) {
            $status = 'approved';
        } elseif ($statuses->isNotEmpty() && $statuses->every(fn(string $item) => $item === 'rejected')) {
            $status = 'rejected';
        } else {
            $status = 'pending';
        }

        $application->update([
            'status' => $status,
            'reviewed_by' => $status === 'pending' ? null : $reviewerId,
            'reviewed_at' => $status === 'pending' ? null : now(),
        ]);
    }
}
