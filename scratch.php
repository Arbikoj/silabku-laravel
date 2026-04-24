<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$docsService = app(\App\Services\GoogleDocsService::class);
$results = $docsService->getDriveService()->files->listFiles([
    'q' => "mimeType = 'application/vnd.google-apps.document' and trashed = false",
    'spaces' => 'drive',
    'fields' => 'files(id, name)',
    'pageSize' => 10
]);

foreach ($results->getFiles() as $file) {
    echo "ID: " . $file->id . " Name: " . $file->name . "\n";
}
