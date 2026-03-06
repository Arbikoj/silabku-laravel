<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliah')->onDelete('cascade');
            $table->string('nama', 10);             // RA, RB, RC
            $table->unsignedInteger('jumlah_mhs')->default(0); // jumlah mahasiswa di kelas ini
            // kuota_asisten dihitung: ceil(jumlah_mhs / 8), tidak perlu disimpan
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelas');
    }
};
