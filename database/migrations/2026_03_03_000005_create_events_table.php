<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('nama');                                           // e.g. "Asisten Praktikum Genap 2026"
            $table->enum('tipe', ['praktikum', 'tutorial']);
            $table->foreignId('semester_id')->constrained('semesters')->onDelete('cascade');
            $table->boolean('is_open')->default(false);                       // pendaftaran terbuka/tutup
            $table->timestamp('tanggal_buka')->nullable();
            $table->timestamp('tanggal_tutup')->nullable();
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
