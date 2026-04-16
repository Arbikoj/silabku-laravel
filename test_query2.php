<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jadwals = \App\Models\JadwalPraktikum::where('semester_id', 1)->get();
foreach ($jadwals as $j) {
    echo 'Jadwal: ' . $j->id . ' Sem: ' . $j->semester_id . ' MK: ' . $j->mata_kuliah_id . ' Kelas: ' . $j->kelas_id . PHP_EOL;
}
