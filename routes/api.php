<?php

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
// ── Oprec Asisten ─────────────────────────────────────────────
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SemesterController;
use App\Http\Controllers\MataKuliahController;
use App\Http\Controllers\KelasController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ApplicationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user()->load('profile');
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('/users', UserController::class)->except(['store']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ── Profile ───────────────────────────────────────────────
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);

    // ── Sertifikat (mahasiswa) ────────────────────────────────
    Route::get('/sertifikat/my', [\App\Http\Controllers\SertifikatController::class, 'mySertifikat']);

    // ── Semesters (admin only) ────────────────────────────────
    Route::apiResource('/semesters', SemesterController::class);

    // ── Mata Kuliah (admin only) ──────────────────────────────
    Route::get('/mata-kuliah/all', [MataKuliahController::class, 'all']);
    Route::apiResource('/mata-kuliah', MataKuliahController::class);

    // ── Laboratorium (admin only) ─────────────────────────────
    Route::get('/laboratorium/all', [\App\Http\Controllers\LaboratoriumController::class, 'all']);
    Route::get('/kelas/all', [\App\Http\Controllers\KelasController::class, 'all']);
    Route::apiResource('/laboratorium', \App\Http\Controllers\LaboratoriumController::class);

    // ── Kelas (admin only) ────────────────────────────────────
    Route::apiResource('/kelas', KelasController::class);

    // ── Events ────────────────────────────────────────────────
    Route::post('/events/{event}/toggle-open', [EventController::class, 'toggleOpen']);
    Route::apiResource('/events', EventController::class);

    // ── Jadwal Praktikum ──────────────────────────────────────
    Route::apiResource('/jadwal-praktikum', \App\Http\Controllers\JadwalPraktikumController::class)->only(['index', 'show']);
    Route::middleware('role:admin,dosen')->group(function () {
        Route::apiResource('/jadwal-praktikum', \App\Http\Controllers\JadwalPraktikumController::class)->except(['index', 'show']);
    });

    // ── Applications ──────────────────────────────────────────
    Route::get('/applications/open-events', [ApplicationController::class, 'openEvents']);
    Route::get('/applications/my', [ApplicationController::class, 'myApplications']);
    Route::get('/applications/selection-board', [ApplicationController::class, 'selectionBoard']);
    Route::post('/applications/apply', [ApplicationController::class, 'apply']);
    Route::post('/applications/{application}/approve', [ApplicationController::class, 'approve']);
    Route::post('/applications/{application}/reject', [ApplicationController::class, 'reject']);
    Route::post('/applications/choices/{choice}/approve', [ApplicationController::class, 'approveChoice']);
    Route::post('/applications/choices/{choice}/reject', [ApplicationController::class, 'rejectChoice']);
    Route::get('/applications/choices/{choice}/switch-options', [ApplicationController::class, 'switchOptions']);
    Route::get('/applications/choices/{choice}/replacement-candidates', [ApplicationController::class, 'replacementCandidates']);
    Route::post('/applications/choices/{choice}/switch', [ApplicationController::class, 'switchChoice']);
    Route::post('/applications/choices/{choice}/replace-approved', [ApplicationController::class, 'replaceApprovedChoice']);
    Route::post('/applications/{application}/replace', [ApplicationController::class, 'replaceApplicant']);
    Route::apiResource('/applications', ApplicationController::class)->only(['index', 'show']);

    // ── Database Asisten (approved) ───────────────────────────
    Route::middleware('role:admin,dosen')->group(function () {
        Route::get('/database/asisten', [ApplicationController::class, 'database']);
        Route::get('/database/asisten-unik', [ApplicationController::class, 'databaseUnique']);

        // ── Sertifikat ──────────────────────────────────────────
        Route::prefix('sertifikat')->name('sertifikat.')->group(function () {
            Route::get('/prepare-data', [\App\Http\Controllers\SertifikatController::class, 'prepareData'])->name('prepare-data');
            Route::post('/upload-template', [\App\Http\Controllers\SertifikatController::class, 'uploadTemplate'])->name('upload-template');
            Route::post('/download-sample', [\App\Http\Controllers\SertifikatController::class, 'downloadSample'])->name('download-sample');
            Route::get('/preview-template', [\App\Http\Controllers\SertifikatController::class, 'previewTemplate'])->name('preview-template');
            Route::post('/save-config', [\App\Http\Controllers\SertifikatController::class, 'saveConfig'])->name('save-config');
            Route::get('/get-config', [\App\Http\Controllers\SertifikatController::class, 'getConfig'])->name('get-config');
            Route::post('/generate', [\App\Http\Controllers\SertifikatController::class, 'generate'])->name('generate');
        });
    });
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/users', [UserController::class, 'store']);
