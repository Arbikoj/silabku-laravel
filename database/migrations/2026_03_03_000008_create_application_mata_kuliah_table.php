<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Matkul+kelas yang dipilih mahasiswa per aplikasi (bisa lebih dari satu)
        Schema::create('application_mata_kuliah', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->onDelete('cascade');
            $table->foreignId('event_mata_kuliah_id')->constrained('event_mata_kuliah')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['application_id', 'event_mata_kuliah_id'], 'app_mk_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_mata_kuliah');
    }
};
