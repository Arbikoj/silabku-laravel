<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$files = \Illuminate\Support\Facades\Storage::disk('google')->files('Asisten');
if (count($files) > 0) {
    echo "Found file: " . $files[0] . PHP_EOL;
    try {
        \Illuminate\Support\Facades\Storage::disk('google')->setVisibility($files[0], 'public');
        echo "Set public success." . PHP_EOL;
        echo "URL: " . \Illuminate\Support\Facades\Storage::disk('google')->url($files[0]) . PHP_EOL;
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . PHP_EOL;
    }
} else {
    echo "No files found to test." . PHP_EOL;
}
