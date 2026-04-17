<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$type = Illuminate\Support\Facades\DB::select("SELECT data_type FROM information_schema.columns WHERE table_name = 'bap_pertemuans' AND column_name = 'tanggal'");
echo "Type: " . $type[0]->data_type . "\n";
