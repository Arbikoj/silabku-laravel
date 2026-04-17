<?php

require __DIR__ . '/vendor/autoload.php';
$str = "2026-04-19T17:00:00.000Z";
$c1 = \Carbon\Carbon::parse($str);
echo "Timezone of c1: " . $c1->timezoneName . "\n";
echo "Date of c1: " . $c1->format('Y-m-d H:i:s') . "\n";

$c2 = \Carbon\Carbon::parse($str)->setTimezone('Asia/Jakarta');
echo "Timezone of c2: " . $c2->timezoneName . "\n";
echo "Date of c2: " . $c2->format('Y-m-d H:i:s') . "\n";

