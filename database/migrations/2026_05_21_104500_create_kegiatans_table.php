<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kegiatans', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kegiatan');
            $table->date('tanggal');
            $table->string('hari');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->foreignId('laboratorium_id')->nullable()->constrained('laboratoriums')->nullOnDelete();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatans');
    }
};
