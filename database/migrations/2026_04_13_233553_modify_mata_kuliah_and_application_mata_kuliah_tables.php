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
        // 1. Modifikasi tabel mata_kuliah: ubah nilai_minimum dari numeric ke string(2) dan konversi data
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE mata_kuliah ALTER COLUMN nilai_minimum DROP DEFAULT");
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE mata_kuliah ALTER COLUMN nilai_minimum DROP NOT NULL");
        
        \Illuminate\Support\Facades\DB::statement("
            ALTER TABLE mata_kuliah 
            ALTER COLUMN nilai_minimum TYPE VARCHAR(2) 
            USING (
                CASE 
                    WHEN nilai_minimum >= 4 THEN 'A' 
                    WHEN nilai_minimum >= 3.5 THEN 'AB' 
                    WHEN nilai_minimum >= 3 THEN 'B' 
                    WHEN nilai_minimum >= 2.5 THEN 'BC' 
                    WHEN nilai_minimum >= 2 THEN 'C' 
                    WHEN nilai_minimum >= 1 THEN 'D' 
                    WHEN nilai_minimum > 0 THEN 'E'
                    ELSE NULL
                END
            )
        ");

        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->string('nilai_minimum', 2)->nullable()->change();
        });

        // 2. Tambah kolom ke application_mata_kuliah
        Schema::table('application_mata_kuliah', function (Blueprint $table) {
            $table->string('nilai_mata_kuliah', 2)->nullable()->after('event_mata_kuliah_id');
            $table->string('sptjm_gd_id')->nullable()->after('nilai_mata_kuliah');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('application_mata_kuliah', function (Blueprint $table) {
            $table->dropColumn(['nilai_mata_kuliah', 'sptjm_gd_id']);
        });

        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->decimal('nilai_minimum', 4, 2)->default(0.00)->change();
        });
    }
};
