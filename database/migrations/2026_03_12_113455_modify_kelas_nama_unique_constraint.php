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
        if (!Schema::hasIndex('kelas', 'kelas_mata_kuliah_id_nama_unique')) {
            Schema::table('kelas', function (Blueprint $table) {
                $table->unique(['mata_kuliah_id', 'nama'], 'kelas_mata_kuliah_id_nama_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasIndex('kelas', 'kelas_mata_kuliah_id_nama_unique')) {
            Schema::table('kelas', function (Blueprint $table) {
                $table->dropUnique('kelas_mata_kuliah_id_nama_unique');
            });
        }
    }
};
