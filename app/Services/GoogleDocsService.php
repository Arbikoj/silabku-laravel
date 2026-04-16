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
    public function moveToFolderHierarchy($documentId, array $folderNames)
    {
        $currentParentId = 'root'; // Mulai pencarian dari root ('root' alias di google drive)
        
        // Aturan: kalau kita ingin root Google Drive beneran tanpa alias, biarkan default,
        // tapi search query di Drive menganggap parent 'root' jika tidak dispesifikasi.
        // Kita akan menelusuri atau buat per level
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
}
