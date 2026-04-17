<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$docs = app(App\Services\GoogleDocsService::class);
try {
    $docs->ensureFolderHierarchyAndGetId(['Test'], 'LAB-SAINS-DATA');
    echo "Success!";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
