<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Docs;

class CreateBapTemplateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bap:create-template';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a dummy Google Docs template for BAP automatically';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to create BAP Template in Google Docs...');
        
        try {
            // Setup client
            $client = new Client();
            $client->setApplicationName('Silabku BAP Generator');
            $client->setClientId(config('services.google.client_id', env('GOOGLE_DRIVE_CLIENT_ID')));
            $client->setClientSecret(config('services.google.client_secret', env('GOOGLE_DRIVE_CLIENT_SECRET')));
            $client->refreshToken(config('services.google.refresh_token', env('GOOGLE_DRIVE_REFRESH_TOKEN')));
            $client->addScope(Drive::DRIVE_FILE);
            $client->addScope(Docs::DOCUMENTS);

            $docsService = new Docs($client);
            $driveService = new Drive($client);

            // 1. Create a blank document
            $document = new Docs\Document([
                'title' => 'Template Dummy BAP - Silabku'
            ]);
            $document = $docsService->documents->create($document);
            $documentId = $document->documentId;

            $this->info("Created Document ID: {$documentId}");
            $this->info("Please wait while we insert 10 pages of placeholders...");

            // 2. Prepare batch update requests
            $requests = [];

            // We build the text backwards so we don't have to manage changing indices
            // Or we just append text at the end of the document.
            // When appending, index is always the current end of document, but batch request 
            // is executed sequentially.
            // Even better: insert at index 1 repeatedly.
            
            // To do this simply, we will use insertText at index 1 for all items, 
            // but we must build the reverse array so it reads correctly.
            // Wait, we can just insert all at once as a big string!
            $fullText = "FORMAT BERITA ACARA PRAKTIKUM (BAP)\n\n";
            $fullText .= "Nama Asisten : {{nama}}\n";
            $fullText .= "NIM Asisten  : {{nim}}\n";
            $fullText .= "Mata Kuliah  : {{mata_kuliah}}\n";
            $fullText .= "Kelas        : {{kelas}}\n";
            $fullText .= "Laboratorium : {{lab}}\n";
            $fullText .= "Waktu        : {{waktu_praktikum}}\n\n";
            
            for ($i = 1; $i <= 10; $i++) {
                $fullText .= "==================== PERTEMUAN {$i} ====================\n";
                $fullText .= "Hari/Tanggal : {{tanggal_{$i}}}\n";
                $fullText .= "Status       : {{status_{$i}}}\n";
                $fullText .= "Jml. Hadir   : {{hadir_{$i}}} Mahasiswa\n";
                $fullText .= "Jml. Absen   : {{tidak_hadir_{$i}}} Mahasiswa\n";
                $fullText .= "Topik / Materi Pembahasan:\n{{topik_{$i}}}\n\n";
                $fullText .= "Dokumentasi:\n";
                $fullText .= "{{foto_{$i}_1}}\n";
                $fullText .= "{{foto_{$i}_2}}\n";
                $fullText .= "{{foto_{$i}_3}}\n\n";
                
                if ($i < 10) {
                    $fullText .= "--- PAGE BREAK ---\n"; 
                }
            }

            // Insert the big text
            $requests[] = new Docs\Request([
                'insertText' => [
                    'location' => [
                        'index' => 1,
                    ],
                    'text' => $fullText
                ]
            ]);

            $batchUpdateRequest = new Docs\BatchUpdateDocumentRequest([
                'requests' => $requests
            ]);

            $docsService->documents->batchUpdate($documentId, $batchUpdateRequest);

            // Now, optionally move it to a specific folder if GOOGLE_DRIVE_FOLDER is set (or if it's a folder name)
            $folderNameOrId = env('GOOGLE_DRIVE_FOLDER');
            if ($folderNameOrId) {
                // Determine if it's a folder name or ID
                $folderId = $folderNameOrId;
                
                // If the string doesn't look like a standard Google Drive folder ID (typical length 25-35 chars without spaces)
                // We'll search for it as a name.
                if (strlen($folderNameOrId) < 20 || strpos($folderNameOrId, ' ') !== false || preg_match('/^[a-zA-Z0-9_\-]+$/', $folderNameOrId) && strlen($folderNameOrId) < 25) {
                    $this->info("Resolving folder name '{$folderNameOrId}' to Google Drive ID...");
                    $results = $driveService->files->listFiles([
                        'q' => "mimeType='application/vnd.google-apps.folder' and name='{$folderNameOrId}' and trashed=false",
                        'spaces' => 'drive',
                        'fields' => 'files(id, name)',
                    ]);

                    if (count($results->getFiles()) == 0) {
                        $this->info("Folder '{$folderNameOrId}' tidak ditemukan. Membuat ulang foldernya...");
                        $folderMetadata = new Drive\DriveFile([
                            'name' => $folderNameOrId,
                            'mimeType' => 'application/vnd.google-apps.folder'
                        ]);
                        $folder = $driveService->files->create($folderMetadata, ['fields' => 'id']);
                        $folderId = $folder->id;
                    } else {
                        $folderId = $results->getFiles()[0]->id;
                    }
                }

                // Determine current parents to remove
                $file = $driveService->files->get($documentId, ['fields' => 'parents']);
                $previousParents = join(',', $file->parents);

                // Move the file to the new folder
                $emptyFileMetadata = new Drive\DriveFile();
                $driveService->files->update($documentId, $emptyFileMetadata, [
                    'addParents' => $folderId,
                    'removeParents' => $previousParents,
                    'fields' => 'id, parents'
                ]);
                $this->info("Moved the template document to Folder: {$folderNameOrId}");
            }

            // Also make the document visible to anyone with link (optional, but good for template)
            $permission = new Drive\Permission([
                'type' => 'anyone',
                'role' => 'reader',
            ]);
            $driveService->permissions->create($documentId, $permission);

            $this->info("Success! Template url: https://docs.google.com/document/d/{$documentId}/edit");
            $this->info('You can place this Document ID in your .env as BAP_TEMPLATE_DOC_ID=' . $documentId);

        } catch (\Exception $e) {
            $this->error("Error creating template: " . $e->getMessage());
        }
    }
}
