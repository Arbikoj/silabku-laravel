<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('jadwal_praktikums', function (Blueprint $table) {
            $table->foreignId('kelas_id')->nullable()->after('semester_id')->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('jadwal_praktikums', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kelas_id');
        });
    }
};
