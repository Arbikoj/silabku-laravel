<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nama_lengkap')->nullable();
            $table->string('no_wa')->nullable();
            $table->string('norek')->nullable();       // nomor rekening
            $table->string('nama_rek')->nullable();    // nama pemilik rekening
            $table->string('bank')->nullable();         // bank (BRI, BCA, dll)
            $table->string('foto')->nullable();         // path foto profil
            $table->string('nilai_ipk', 10)->nullable(); // IPK / nilai acuan syarat
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
