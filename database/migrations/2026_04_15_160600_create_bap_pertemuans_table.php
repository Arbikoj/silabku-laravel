<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bap_pertemuans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jadwal_praktikum_id')->constrained('jadwal_praktikums')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('pertemuan_ke');
            $table->date('tanggal');
            $table->text('topik')->nullable();
            $table->json('foto_google_drive_ids')->nullable();
            $table->timestamps();
            
            // Ensures an assistant can only have one specific meeting (pertemuan_ke) for a specific jadwal
            $table->unique(['jadwal_praktikum_id', 'user_id', 'pertemuan_ke'], 'bap_unique_pertemuan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bap_pertemuans');
    }
};
