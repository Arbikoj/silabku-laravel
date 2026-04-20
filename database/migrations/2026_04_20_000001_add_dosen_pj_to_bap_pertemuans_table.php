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
        Schema::table('bap_pertemuans', function (Blueprint $table) {
            $table->string('dosen_pj')->nullable()->after('tanggal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bap_pertemuans', function (Blueprint $table) {
            $table->dropColumn('dosen_pj');
        });
    }
};
