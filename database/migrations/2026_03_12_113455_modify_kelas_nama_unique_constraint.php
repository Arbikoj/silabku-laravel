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
        Schema::table('kelas', function (Blueprint $table) {
            try {
                $table->unique(['mata_kuliah_id', 'nama'], 'kelas_mata_kuliah_id_nama_unique');
            } catch (\Exception $e) {
                // Ignore if it already exists
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->dropUnique('kelas_mata_kuliah_id_nama_unique');
        });
    }
};
