<?php
require __DIR__ . '/vendor/autoload.php';

use App\Services\GoogleDocsService;
use Illuminate\Support\Facades\Log;

// This script is to test table generation logic
// We need to simulate the Laravel environment to use the service

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$docsService = new GoogleDocsService();

// Create a test doc
$driveService = $docsService->getDriveService();
$fileMetadata = new \Google\Service\Drive\DriveFile([
    'name' => 'Test Dynamic Table BAP',
    'mimeType' => 'application/vnd.google-apps.document'
]);
$file = $driveService->files->create($fileMetadata, ['fields' => 'id']);
$docId = $file->id;

echo "Created test doc: https://docs.google.com/document/d/{$docId}/edit\n";

// Now try to insert a complex table
// Rows: 1 title + 4 general info + 1 header + 4 meeting data = 10 rows
// Columns: 4

$requests = [
    new \Google\Service\Docs\Request([
        'insertTable' => [
            'rows' => 10,
            'columns' => 4,
            'location' => [
                'index' => 1
            ]
        ]
    ])
];

$docsService->getDocsService()->documents->batchUpdate($docId, new \Google\Service\Docs\BatchUpdateDocumentRequest(['requests' => $requests]));

// Now fetch the doc to get indices
$doc = $docsService->getDocsService()->documents->get($docId);
$content = $doc->getBody()->getContent();
$table = null;
foreach ($content as $element) {
    if ($element->getTable()) {
        $table = $element->getTable();
        break;
    }
}

if (!$table) {
    echo "Table not found!\n";
    exit;
}

$fillRequests = [];

// 1. Merge Title Row
$fillRequests[] = new \Google\Service\Docs\Request([
    'mergeTableCells' => [
        'tableRange' => [
            'tableCellLocation' => [
                'tableStartLocation' => [
                    'index' => $table->getStartIndex()
                ],
                'rowIndex' => 0,
                'columnIndex' => 0
            ],
            'rowSpan' => 1,
            'columnSpan' => 4
        ]
    ]
]);

// 2. Set Background for Header
$fillRequests[] = new \Google\Service\Docs\Request([
    'updateTableCellStyle' => [
        'tableCellStyle' => [
            'backgroundColor' => [
                'color' => [
                    'rgbColor' => [
                        'blue' => 0.9,
                        'green' => 0.9,
                        'red' => 0.9
                    ]
                ]
            ]
        ],
        'fields' => 'backgroundColor',
        'tableRange' => [
            'tableCellLocation' => [
                'tableStartLocation' => [
                    'index' => $table->getStartIndex()
                ],
                'rowIndex' => 0,
                'columnIndex' => 0
            ],
            'rowSpan' => 1,
            'columnSpan' => 4
        ]
    ]
]);

// 3. Insert Text - Since we know the table indices now, we can insert text
// But every insertText shifts following indices unless we go from bottom to top.
// Or we use replacement tokens? But cells are empty.
// Actually, empty cells have index: start + 1.

// Let's use a simpler approach:
// We can use replaceAllText if we insert unique tokens into cells first.
// Wait, can we insert text into multiple cells in one batch? YES.

$docsService->getDocsService()->documents->batchUpdate($docId, new \Google\Service\Docs\BatchUpdateDocumentRequest(['requests' => $fillRequests]));

echo "Merged cells and set background. Done.\n";
