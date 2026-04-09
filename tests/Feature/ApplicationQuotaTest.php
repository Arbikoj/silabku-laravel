<?php

use App\Models\Application;
use App\Models\ApplicationMataKuliah;
use App\Models\Event;
use App\Models\EventMataKuliah;
use App\Models\Kelas;
use App\Models\MataKuliah;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('blocks approving a choice when the class quota is already full', function () {
    $reviewer = User::factory()->create([
        'role' => 'admin',
    ]);

    Sanctum::actingAs($reviewer);

    $semester = Semester::create([
        'nama' => 'Gasal 2026/2027',
        'tipe' => 'gasal',
        'tahun' => 2026,
        'is_active' => true,
    ]);

    $mataKuliah = MataKuliah::create([
        'kode' => 'IF303',
        'nama' => 'Basis Data',
        'sks' => 3,
        'nilai_minimum' => 0,
    ]);

    $kelas = Kelas::create([
        'mata_kuliah_id' => $mataKuliah->id,
        'nama' => 'RA',
        'jumlah_mhs' => 8,
    ]);

    $event = Event::create([
        'nama' => 'Seleksi Asisten Basis Data',
        'tipe' => 'praktikum',
        'semester_id' => $semester->id,
        'is_open' => true,
    ]);

    $eventMataKuliah = EventMataKuliah::create([
        'event_id' => $event->id,
        'mata_kuliah_id' => $mataKuliah->id,
        'kelas_id' => $kelas->id,
    ]);

    $firstApplicant = User::factory()->create();
    $secondApplicant = User::factory()->create();

    $firstApplication = Application::create([
        'user_id' => $firstApplicant->id,
        'event_id' => $event->id,
        'status' => 'approved',
    ]);

    ApplicationMataKuliah::create([
        'application_id' => $firstApplication->id,
        'event_mata_kuliah_id' => $eventMataKuliah->id,
        'status' => 'approved',
    ]);

    $secondApplication = Application::create([
        'user_id' => $secondApplicant->id,
        'event_id' => $event->id,
        'status' => 'pending',
    ]);

    $pendingChoice = ApplicationMataKuliah::create([
        'application_id' => $secondApplication->id,
        'event_mata_kuliah_id' => $eventMataKuliah->id,
        'status' => 'pending',
    ]);

    $response = $this->postJson("/api/applications/choices/{$pendingChoice->id}/approve");

    $response
        ->assertStatus(422)
        ->assertJsonPath('quota.kuota_asisten', 1)
        ->assertJsonPath('quota.approved_count', 1);

    expect($pendingChoice->fresh()->status)->toBe('pending');
});
