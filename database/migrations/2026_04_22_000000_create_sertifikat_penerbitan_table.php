<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sertifikat_penerbitan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliah')->cascadeOnDelete();
            $table->unsignedInteger('nomor_urut');
            $table->string('nomor_sertifikat')->unique();
            $table->string('google_drive_file_id')->nullable();
            $table->string('google_drive_file_name')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['event_id', 'user_id', 'mata_kuliah_id'],
                'sertifikat_penerbitan_event_user_matkul_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sertifikat_penerbitan');
    }
};
