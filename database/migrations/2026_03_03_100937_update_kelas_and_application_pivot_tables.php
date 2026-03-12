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
            $table->unique(['mata_kuliah_id', 'nama']);
        });

        Schema::table('application_mata_kuliah', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->after('event_mata_kuliah_id');
            $table->text('catatan')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('application_mata_kuliah', function (Blueprint $table) {
            $table->dropColumn(['status', 'catatan']);
        });

        Schema::table('kelas', function (Blueprint $table) {
            $table->dropUnique(['mata_kuliah_id', 'nama']);
        });
    }
};
