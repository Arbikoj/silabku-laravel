<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Daftar mata kuliah + kelas yang tersedia dalam suatu event
        Schema::create('event_mata_kuliah', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliah')->onDelete('cascade');
            $table->foreignId('kelas_id')->constrained('kelas')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['event_id', 'mata_kuliah_id', 'kelas_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_mata_kuliah');
    }
};
