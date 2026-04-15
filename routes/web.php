<?php

use App\Http\Controllers\DataController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // ── Profil Asisten (mahasiswa) ───────────────────────────
    Route::get('/profil', fn() => Inertia::render('oprec/profil/page'))->name('profil.index');
    Route::get('/profil/transkrip', [\App\Http\Controllers\ProfileController::class, 'transkrip'])->name('profil.transkrip');
    Route::get('/profil/ktm', [\App\Http\Controllers\ProfileController::class, 'ktm'])->name('profil.ktm');

    // ── Oprec routes (mahasiswa = role:user) ─────────────────
    Route::prefix('oprec')->name('oprec.')->group(function () {
        Route::get('/events', fn() => Inertia::render('oprec/events/page'))->name('events');
        Route::get('/apply/{eventId}', fn($eventId) => Inertia::render('oprec/events/apply', ['eventId' => $eventId]))->name('apply');
        Route::get('/my-applications', fn() => Inertia::render('oprec/my-applications/page'))->name('my-applications');
    });

    // ── Admin routes ─────────────────────────────────────────
    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
        Route::get('/semesters', fn() => Inertia::render('admin/semesters/page'))->name('semesters');
        Route::get('/mata-kuliah', fn() => Inertia::render('admin/mata-kuliah/page'))->name('mata-kuliah');
        Route::get('/laboratorium', fn() => Inertia::render('admin/laboratorium/page'))->name('laboratorium');
        Route::get('/kelas-list', fn() => Inertia::render('admin/kelas/page'))->name('kelas');
        Route::get('/events', fn() => Inertia::render('admin/events/page'))->name('events');
        Route::get('/events/{id}', fn($id) => Inertia::render('admin/events/detail', ['eventId' => $id]))->name('events.detail');
    });

    // ── Jadwal Praktikum ──────────────────────────────────────
    Route::get('/jadwal', fn() => Inertia::render('jadwal/page'))
        ->middleware('role:admin,dosen')
        ->name('jadwal.index');

    // ── Seleksi (admin + dosen) ──────────────────────────────
    Route::get('/seleksi', fn() => Inertia::render('admin/applications/page'))
        ->middleware('role:admin,dosen')
        ->name('seleksi.index');
    Route::get('/seleksi/choices/{choice}/sptjm', [\App\Http\Controllers\ApplicationController::class, 'reviewerChoiceSptjm'])
        ->middleware('role:admin,dosen')
        ->name('seleksi.choice.sptjm');
    Route::get('/seleksi/choices/{choice}/transkrip', [\App\Http\Controllers\ApplicationController::class, 'reviewerChoiceTranscript'])
        ->middleware('role:admin,dosen')
        ->name('seleksi.choice.transkrip');

    // ── Database Asisten ─────────────────────────────────────
    Route::prefix('database')->name('database.')->middleware('role:admin,dosen')->group(function () {
        Route::get('/', fn() => Inertia::render('database/asisten/page'))->name('asisten');
        Route::get('/event', fn() => Inertia::render('database/per-event/page'))->name('per-event');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
