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
        Schema::create('absensi_asisten_pertemuans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_mata_kuliah_id')
                ->constrained('application_mata_kuliah')
                ->onDelete('cascade');
            $table->unsignedInteger('pertemuan_ke');
            $table->timestamps();

            $table->unique(['application_mata_kuliah_id', 'pertemuan_ke'], 'absensi_unique_pertemuan');
            $table->index(['application_mata_kuliah_id', 'pertemuan_ke'], 'absensi_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absensi_asisten_pertemuans');
    }
};

