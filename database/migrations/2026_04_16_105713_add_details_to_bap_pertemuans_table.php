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
            $table->enum('status', ['LURING', 'DARING'])->nullable()->after('topik');
            $table->integer('jumlah_hadir')->nullable()->after('status');
            $table->integer('jumlah_tidak_hadir')->nullable()->after('jumlah_hadir');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bap_pertemuans', function (Blueprint $table) {
            $table->dropColumn(['status', 'jumlah_hadir', 'jumlah_tidak_hadir']);
        });
    }
};
