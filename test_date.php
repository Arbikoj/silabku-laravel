<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$str1 = "2026-04-19T17:00:00.000Z";
$c1 = \Carbon\Carbon::parse($str1)->setTimezone('Asia/Jakarta');
echo "Parsed ISO: " . $c1->format('Y-m-d H:i:s P') . "\n";

$str2 = "2026-04-20";
$c2 = \Carbon\Carbon::parse($str2)->setTimezone('Asia/Jakarta');
echo "Parsed Y-m-d: " . $c2->format('Y-m-d H:i:s P') . "\n";

