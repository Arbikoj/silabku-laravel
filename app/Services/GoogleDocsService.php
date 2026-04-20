<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Docs;
use Illuminate\Support\Facades\Log;

class GoogleDocsService
{
    protected $client;
    protected $driveService;
    protected $docsService;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setApplicationName('Silabku API');
        $this->client->setClientId(config('services.google.client_id', env('GOOGLE_DRIVE_CLIENT_ID')));
        $this->client->setClientSecret(config('services.google.client_secret', env('GOOGLE_DRIVE_CLIENT_SECRET')));
        $this->client->refreshToken(config('services.google.refresh_token', env('GOOGLE_DRIVE_REFRESH_TOKEN')));
        $this->client->addScope(Drive::DRIVE_FILE);
        $this->client->addScope(Docs::DOCUMENTS);

        $this->driveService = new Drive($this->client);
        $this->docsService = new Docs($this->client);
    }

    /**
     * Delete previous files with exact name
     */
    public function deleteDocumentByName($name)
    {
        // Cari file dengan nama yang sama persis dan tipe mimetype google docs
        $results = $this->driveService->files->listFiles([
            'q' => "name = '{$name}' and mimeType = 'application/vnd.google-apps.document' and trashed = false",
            'spaces' => 'drive',
            'fields' => 'files(id)'
        ]);

        foreach ($results->getFiles() as $file) {
            $this->driveService->files->delete($file->id);
        }
    }

    /**
     * Duplicate the template and return the new document ID
     */
    public function duplicateTemplate($templateId, $newName = 'BAP Baru')
    {
        $file = new Drive\DriveFile();
        $file->setName($newName);
        
        $copiedFile = $this->driveService->files->copy($templateId, $file);
        
        // Make it readable to anyone
        $permission = new Drive\Permission([
            'type' => 'anyone',
            'role' => 'reader',
        ]);
        $this->driveService->permissions->create($copiedFile->getId(), $permission);
        
        return $copiedFile->getId();
    }

    /**
     * Pindahkan dokumen ke struktur folder yang dinamis (buat jika belum ada)
     */
    public function ensureFolderHierarchyAndGetId(array $folderNames, $startParentId = 'root')
    {
        $currentParentId = $startParentId; // Mulai pencarian dari parent (root alias di google drive atau yang diberikan)
        
        foreach ($folderNames as $folderName) {
            $folderNameClean = str_replace("'", "\'", $folderName);
            $query = "mimeType = 'application/vnd.google-apps.folder' and name = '{$folderNameClean}' and '{$currentParentId}' in parents and trashed = false";
            
            $results = $this->driveService->files->listFiles([
                'q' => $query,
                'spaces' => 'drive',
                'fields' => 'files(id, name)'
            ]);

            $files = $results->getFiles();
            
            if (count($files) == 0) {
                // Buat folder baru di bawah currentParentId
                $folderMetadata = new Drive\DriveFile([
                    'name' => $folderName,
                    'mimeType' => 'application/vnd.google-apps.folder',
                    'parents' => [$currentParentId]
                ]);
                
                $folder = $this->driveService->files->create($folderMetadata, ['fields' => 'id']);
                $currentParentId = $folder->id;
            } else {
                $currentParentId = $files[0]->id;
            }
        }

        return $currentParentId;
    }

    public function moveToFolderHierarchy($documentId, array $folderNames, $startParentId = 'root')
    {
        $currentParentId = $this->ensureFolderHierarchyAndGetId($folderNames, $startParentId);

        // currentParentId sekarang berisi ID folder terdalam. Pindahkan file Doc ke sana.
        $file = $this->driveService->files->get($documentId, ['fields' => 'parents']);
        $previousParents = join(',', $file->parents);

        $emptyFileMetadata = new Drive\DriveFile();
        $this->driveService->files->update($documentId, $emptyFileMetadata, [
            'addParents' => $currentParentId,
            'removeParents' => $previousParents,
            'fields' => 'id, parents'
        ]);
    }

    public function uploadFileToFolder($fileRealPath, $fileName, $mimeType, $folderId)
    {
        $fileMetadata = new Drive\DriveFile([
            'name' => $fileName,
            'parents' => [$folderId]
        ]);
        
        $content = file_get_contents($fileRealPath);
        $file = $this->driveService->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => $mimeType,
            'uploadType' => 'multipart',
            'fields' => 'id'
        ]);
        
        return $file->id;
    }

    public function getDriveService()
    {
        return $this->driveService;
    }

    public function getDocsService()
    {
        return $this->docsService;
    }

    /**
     * Find the start index of a text token in the document
     */
    public function findTextIndex($documentId, $token)
    {
        $doc = $this->docsService->documents->get($documentId);
        $content = $doc->getBody()->getContent();
        
        $index = -1;
        $this->recursiveFindIndex($content, $token, $index);
        return $index;
    }

    private function recursiveFindIndex($elements, $token, &$foundIndex)
    {
        if ($foundIndex !== -1) return;

        foreach ($elements as $element) {
            if ($element->getParagraph()) {
                foreach ($element->getParagraph()->getElements() as $pe) {
                    if ($pe->getTextRun()) {
                        $content = $pe->getTextRun()->getContent();
                        $pos = strpos($content, $token);
                        if ($pos !== false) {
                            $foundIndex = $pe->getStartIndex() + $pos;
                            return;
                        }
                    }
                }
            } elseif ($element->getTable()) {
                foreach ($element->getTable()->getTableRows() as $row) {
                    foreach ($row->getTableCells() as $cell) {
                        $this->recursiveFindIndex($cell->getContent(), $token, $foundIndex);
                        if ($foundIndex !== -1) return;
                    }
                }
            }
        }
    }

    /**
     * Replace text tokens and insert images batch update
     * 
     * @param string $documentId 
     * @param array $replacements ['{{token}}' => 'value']
     * @param array $images ['{{token}}' => 'public_url']
     */
    public function generateBapFromTemplate($documentId, $replacements, $images = [])
    {
        $requests = [];

        // 1. Text Replacements
        foreach ($replacements as $search => $replaceText) {
            $requests[] = new Docs\Request([
                'replaceAllText' => [
                    'containsText' => [
                        'text' => $search,
                        'matchCase' => true,
                    ],
                    'replaceText' => (string)$replaceText,
                ],
            ]);
        }

        // Apply text replacements first so document structure is predictable
        if (!empty($requests)) {
            $batchUpdateRequest = new Docs\BatchUpdateDocumentRequest(['requests' => $requests]);
            $this->docsService->documents->batchUpdate($documentId, $batchUpdateRequest);
        }

        // 2. Image Replacements
        // It's tricky to replace arbitrary text with images using just replaceAllText.
        // We will read the document, find the string, delete it, and insert an image at that index.
        // Because indexes change when we delete/insert, we should process from bottom to top (highest index first).
        
        if (!empty($images)) {
            $doc = $this->docsService->documents->get($documentId);
            $content = $doc->getBody()->getContent();
            
            $imagePlacements = [];
            
            // Simplified recursive search for text runs
            $this->findTextTokens($content, $images, $imagePlacements);

            // Sort by index descending! Important so we don't shift indexes we haven't processed
            usort($imagePlacements, function($a, $b) {
                return $b['index'] - $a['index'];
            });

            $imageRequests = [];
            foreach ($imagePlacements as $placement) {
                $tokenLength = strlen($placement['token']);
                $startIndex = $placement['index'];
                
                // Only insert image if we have a valid URL
                if (filter_var($placement['url'], FILTER_VALIDATE_URL)) {
                    // a) Delete the text token
                    $imageRequests[] = new Docs\Request([
                        'deleteContentRange' => [
                            'range' => [
                                'startIndex' => $startIndex,
                                'endIndex' => $startIndex + $tokenLength
                            ]
                        ]
                    ]);
                    
                    // b) Insert the image at that index
                    $imageRequests[] = new Docs\Request([
                        'insertInlineImage' => [
                            'uri' => $placement['url'],
                            'objectSize' => [
                                'width' => ['magnitude' => 300, 'unit' => 'PT']
                            ],
                            'location' => [
                                'index' => $startIndex
                            ]
                        ]
                    ]);
                } else {
                    // Just replace with empty string if no valid URL
                    $imageRequests[] = new Docs\Request([
                        'replaceAllText' => [
                            'containsText' => [
                                'text' => $placement['token'],
                                'matchCase' => true,
                            ],
                            'replaceText' => '',
                        ],
                    ]);
                }
            }

            if (!empty($imageRequests)) {
                try {
                    $batchUpdateRequest = new Docs\BatchUpdateDocumentRequest(['requests' => $imageRequests]);
                    $this->docsService->documents->batchUpdate($documentId, $batchUpdateRequest);
                } catch (\Exception $e) {
                    Log::warning('Google Docs image insertion failed: ' . $e->getMessage());
                }
            }
        }
    }

    private function findTextTokens($elements, $tokensToFind, &$results)
    {
        foreach ($elements as $element) {
            if ($element->getParagraph()) {
                foreach ($element->getParagraph()->getElements() as $pe) {
                    if ($pe->getTextRun()) {
                        $text = $pe->getTextRun()->getContent();
                        foreach ($tokensToFind as $token => $url) {
                            $pos = strpos($text, $token);
                            if ($pos !== false) {
                                $results[] = [
                                    'token' => $token,
                                    'url' => $url,
                                    'index' => $pe->getStartIndex() + $pos
                                ];
                            }
                        }
                    }
                }
            } elseif ($element->getTable()) {
                foreach ($element->getTable()->getTableRows() as $row) {
                    foreach ($row->getTableCells() as $cell) {
                        $this->findTextTokens($cell->getContent(), $tokensToFind, $results);
                    }
                }
            }
        }
    }

    /**
     * Generate BAP Tables dynamically at a specific index
     * 
     * @param string $documentId
     * @param int $startIndex
     * @param array $meetings List of meeting data
     * @param array $generalInfo [judul, kelas, asisten, link]
     */
    public function generateDynamicBapTables($documentId, $startIndex, $meetings, $generalInfo)
    {
        // Process meetings in reverse so Meeting 1 ends up at the top
        $reversedMeetings = array_reverse($meetings->toArray());
        
        foreach ($reversedMeetings as $meeting) {
            // 1. Insert BAP table at startIndex
            $this->insertSingleBapTable($documentId, $startIndex, $meeting, $generalInfo);
            
            // 1.5. Add page break BEFORE this BAP table (except meeting 1)
            if ($meeting['pertemuan_ke'] > 1) {
                $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest([
                    'requests' => [
                        new Docs\Request([
                            'insertSectionBreak' => [
                                'sectionType' => 'NEXT_PAGE',
                                'location' => ['index' => $startIndex]
                            ]
                        ])
                    ]
                ]));
            }
            
            // 2. Re-read document to find the END of the BAP table we just created
            $doc = $this->docsService->documents->get($documentId);
            $content = $doc->getBody()->getContent();
            $endOfBapTable = $startIndex;
            foreach ($content as $element) {
                if ($element->getTable() && $element->getStartIndex() >= $startIndex) {
                    $endOfBapTable = $element->getEndIndex();
                    break;
                }
            }
            
            // 3. Insert photo table AFTER the BAP table
            $this->insertPhotoTable($documentId, $endOfBapTable, $meeting);
        }
    }

    private function insertSingleBapTable($documentId, $index, $meeting, $generalInfo)
    {
        $requests = [];

        // 1. Insert Table (10 rows, 4 columns)
        $requests[] = new Docs\Request([
            'insertTable' => [
                'rows' => 10,
                'columns' => 4,
                'location' => ['index' => $index]
            ]
        ]);

        $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest(['requests' => $requests]));

        // Re-fetch to find the table we just inserted
        $doc = $this->docsService->documents->get($documentId);
        $content = $doc->getBody()->getContent();
        $table = null;
        $tableIndex = -1;
        foreach ($content as $element) {
            if ($element->getTable() && $element->getStartIndex() >= $index) {
                $table = $element->getTable();
                $tableIndex = $element->getStartIndex();
                break;
            }
        }
        if (!$table || $tableIndex === -1) return;

        // 2. FILL CONTENT FIRST (on a clean 10x4 grid)
        $this->fillTableContent($documentId, $tableIndex, $meeting, $generalInfo);
        
        // 3. APPLY MERGES & STYLING LAST
        $updateRequests = [];

        // Header Row Merge
        $updateRequests[] = new Docs\Request([
            'mergeTableCells' => [
                'tableRange' => [
                    'tableCellLocation' => ['tableStartLocation' => ['index' => $tableIndex], 'rowIndex' => 0, 'columnIndex' => 0],
                    'rowSpan' => 1, 'columnSpan' => 4
                ]
            ]
        ]);
        // Labels Rows Merge
        for ($r = 1; $r <= 4; $r++) {
            $updateRequests[] = new Docs\Request([
                'mergeTableCells' => [
                    'tableRange' => [
                        'tableCellLocation' => ['tableStartLocation' => ['index' => $tableIndex], 'rowIndex' => $r, 'columnIndex' => 1],
                        'rowSpan' => 1, 'columnSpan' => 3
                    ]
                ]
            ]);
        }
        // Vertical Merges for Meeting Details
        for ($c = 0; $c <= 2; $c++) {
            $updateRequests[] = new Docs\Request([
                'mergeTableCells' => [
                    'tableRange' => [
                        'tableCellLocation' => ['tableStartLocation' => ['index' => $tableIndex], 'rowIndex' => 6, 'columnIndex' => $c],
                        'rowSpan' => 4, 'columnSpan' => 1
                    ]
                ]
            ]);
        }

        // Styling
        $updateRequests[] = new Docs\Request([
            'updateTableCellStyle' => [
                'tableCellStyle' => ['backgroundColor' => ['color' => ['rgbColor' => ['red' => 0.95, 'green' => 0.95, 'blue' => 0.95]]]],
                'fields' => 'backgroundColor',
                'tableRange' => [
                    'tableCellLocation' => ['tableStartLocation' => ['index' => $tableIndex], 'rowIndex' => 0, 'columnIndex' => 0],
                    'rowSpan' => 1, 'columnSpan' => 4
                ]
            ]
        ]);
        $updateRequests[] = new Docs\Request([
            'updateTableCellStyle' => [
                'tableCellStyle' => ['backgroundColor' => ['color' => ['rgbColor' => ['red' => 0.98, 'green' => 0.98, 'blue' => 0.98]]]],
                'fields' => 'backgroundColor',
                'tableRange' => [
                    'tableCellLocation' => ['tableStartLocation' => ['index' => $tableIndex], 'rowIndex' => 5, 'columnIndex' => 0],
                    'rowSpan' => 1, 'columnSpan' => 4
                ]
            ]
        ]);

        $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest(['requests' => $updateRequests]));
        
        // 4. Center Align Header
        $this->centerAlignCell($documentId, $tableIndex, 0, 0);
    }

    private function centerAlignCell($documentId, $tableIndex, $rowIndex, $colIndex)
    {
        $doc = $this->docsService->documents->get($documentId);
        $content = $doc->getBody()->getContent();
        $table = null;
        foreach ($content as $element) {
            if ($element->getTable() && $element->getStartIndex() == $tableIndex) {
                $table = $element->getTable();
                break;
            }
        }
        if (!$table) return;

        $cell = $table->getTableRows()[$rowIndex]->getTableCells()[$colIndex];
        $startIndex = $cell->getContent()[0]->getStartIndex();
        // The last element is a structural element (usually a paragraph)
        $endIndex = $cell->getContent()[count($cell->getContent()) - 1]->getEndIndex();

        $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest([
            'requests' => [
                new Docs\Request([
                    'updateParagraphStyle' => [
                        'paragraphStyle' => ['alignment' => 'CENTER'],
                        'fields' => 'alignment',
                        'range' => ['startIndex' => $startIndex, 'endIndex' => $endIndex]
                    ]
                ])
            ]
        ]));
    }

    private function fillTableContent($documentId, $tableIndex, $meeting, $generalInfo)
    {
        $doc = $this->docsService->documents->get($documentId);
        $content = $doc->getBody()->getContent();
        $table = null;
        foreach ($content as $element) {
            if ($element->getTable() && $element->getStartIndex() == $tableIndex) {
                $table = $element->getTable();
                break;
            }
        }

        if (!$table) return;

        $p_ke = $meeting['pertemuan_ke'];
        $fillRequests = [];
        $getCellIndex = function($r, $c) use ($table) {
            $cell = $table->getTableRows()[$r]->getTableCells()[$c];
            return $cell->getContent()[0]->getStartIndex();
        };

        $cellsToFill = [
            ['r' => 0, 'c' => 0, 'text' => "BERITA ACARA PRAKTIKUM"],
            
            ['r' => 1, 'c' => 0, 'text' => "Judul Praktikum"],
            ['r' => 1, 'c' => 1, 'text' => $generalInfo['judul']],
            ['r' => 2, 'c' => 0, 'text' => "Kelas"],
            ['r' => 2, 'c' => 1, 'text' => $generalInfo['kelas']],
            ['r' => 3, 'c' => 0, 'text' => "Nama Asisten"],
            ['r' => 3, 'c' => 1, 'text' => $generalInfo['asisten']],
            ['r' => 4, 'c' => 0, 'text' => "Link Praktikum"],
            ['r' => 4, 'c' => 1, 'text' => $generalInfo['link']],
            
            ['r' => 5, 'c' => 0, 'text' => "Pertemuan ke-"],
            ['r' => 5, 'c' => 1, 'text' => "Hari/Tanggal/Jam"],
            ['r' => 5, 'c' => 2, 'text' => "Dosen PJ"],
            ['r' => 5, 'c' => 3, 'text' => "Deskripsi & Materi Praktikum"],
            
            ['r' => 6, 'c' => 0, 'text' => (string)$p_ke],
            ['r' => 6, 'c' => 1, 'text' => $meeting['waktu'] . " WIB"],
            ['r' => 6, 'c' => 2, 'text' => $meeting['dosen_pj'] ?? '-'],
            ['r' => 6, 'c' => 3, 'text' => "Judul Materi: \n" . $meeting['topik']],
            
            ['r' => 7, 'c' => 3, 'text' => "Lokasi:\n" . ($generalInfo['lab'] ?? '-')],
            ['r' => 8, 'c' => 3, 'text' => "Jumlah Peserta Hadir : " . ($meeting['hadir'] ?? '0')],
            ['r' => 9, 'c' => 3, 'text' => "Jumlah Peserta tidak Hadir : " . ($meeting['tidak_hadir'] ?? '0')],
        ];

        usort($cellsToFill, function($a, $b) {
            if ($a['r'] != $b['r']) return $b['r'] - $a['r'];
            return $b['c'] - $a['c'];
        });

        foreach ($cellsToFill as $cell) {
            $fillRequests[] = new Docs\Request([
                'insertText' => [
                    'location' => ['index' => $getCellIndex($cell['r'], $cell['c'])],
                    'text' => $cell['text']
                ]
            ]);
            if ($cell['r'] == 0 || $cell['r'] == 5 || ($cell['c'] == 0 && $cell['r'] < 5)) {
                $fillRequests[] = new Docs\Request([
                    'updateTextStyle' => [
                        'textStyle' => ['bold' => true],
                        'fields' => 'bold',
                        'range' => [
                            'startIndex' => $getCellIndex($cell['r'], $cell['c']),
                            'endIndex' => $getCellIndex($cell['r'], $cell['c']) + strlen($cell['text'])
                        ]
                    ]
                ]);
            }
        }

        if (!empty($fillRequests)) {
            $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest(['requests' => $fillRequests]));
        }
    }

    private function insertPhotoTable($documentId, $index, $meeting)
    {
        $p_ke = $meeting['pertemuan_ke'];
        
        // 1. Insert section break for new page
        $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest([
            'requests' => [
                new Docs\Request([
                    'insertSectionBreak' => [
                        'sectionType' => 'NEXT_PAGE',
                        'location' => ['index' => $index]
                    ]
                ])
            ]
        ]));
        
        // 2. Re-read doc to find insertion point after section break
        $doc = $this->docsService->documents->get($documentId);
        $content = $doc->getBody()->getContent();
        $tableInsertIndex = $index + 1;
        foreach ($content as $element) {
            if ($element->getParagraph() && $element->getStartIndex() > $index) {
                $tableInsertIndex = $element->getStartIndex();
                break;
            }
        }
        
        // 3. Insert the photo table
        $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest([
            'requests' => [
                new Docs\Request([
                    'insertTable' => [
                        'rows' => 4,
                        'columns' => 1,
                        'location' => ['index' => $tableInsertIndex]
                    ]
                ])
            ]
        ]));

        // 4. Find the photo table we just inserted
        $doc = $this->docsService->documents->get($documentId);
        $content = $doc->getBody()->getContent();
        $tableIndex = -1;
        $table = null;
        foreach ($content as $element) {
            if ($element->getTable() && $element->getStartIndex() >= $tableInsertIndex) {
                $tableIndex = $element->getStartIndex();
                $table = $element->getTable();
                break;
            }
        }
        if (!$table) return;

        // 3. Fill Content - insert from LAST row to FIRST to prevent index shifting
        $getCellIndex = function($r, $c) use ($table) {
            return $table->getTableRows()[$r]->getTableCells()[$c]->getContent()[0]->getStartIndex();
        };

        $requests = [
            new Docs\Request([
                'insertText' => [
                    'location' => ['index' => $getCellIndex(3, 0)],
                    'text' => "{{foto_{$p_ke}_3}}"
                ]
            ]),
            new Docs\Request([
                'insertText' => [
                    'location' => ['index' => $getCellIndex(2, 0)],
                    'text' => "{{foto_{$p_ke}_2}}"
                ]
            ]),
            new Docs\Request([
                'insertText' => [
                    'location' => ['index' => $getCellIndex(1, 0)],
                    'text' => "{{foto_{$p_ke}_1}}"
                ]
            ]),
            new Docs\Request([
                'insertText' => [
                    'location' => ['index' => $getCellIndex(0, 0)],
                    'text' => "Foto Berjalannya Praktikum (Minimal 3 Foto)"
                ]
            ]),
            // Styling Header
            new Docs\Request([
                'updateTableCellStyle' => [
                    'tableCellStyle' => ['backgroundColor' => ['color' => ['rgbColor' => ['red' => 0.95, 'green' => 0.95, 'blue' => 0.95]]]],
                    'fields' => 'backgroundColor',
                    'tableRange' => [
                        'tableCellLocation' => ['tableStartLocation' => ['index' => $tableIndex], 'rowIndex' => 0, 'columnIndex' => 0],
                        'rowSpan' => 1, 'columnSpan' => 1
                    ]
                ]
            ])
        ];

        $this->docsService->documents->batchUpdate($documentId, new Docs\BatchUpdateDocumentRequest(['requests' => $requests]));
        
        // Center Align all cells (header + photos)
        for ($row = 0; $row <= 3; $row++) {
            $this->centerAlignCell($documentId, $tableIndex, $row, 0);
        }
    }
}
