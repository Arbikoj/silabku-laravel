<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Docs;

class CreateDynamicBapTemplateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bap:create-dynamic-template';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a blank Google Docs template for Dynamic BAP generation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to create Dynamic BAP Template in Google Docs...');
        
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
                'title' => 'Template BAP Dinamis - Silabku'
            ]);
            $document = $docsService->documents->create($document);
            $documentId = $document->documentId;

            $this->info("Created Document ID: {$documentId}");

            // 2. Insert Kop Surat Placeholder and Content Token
            $requests = [];
            
            $fullText = "[LOGO / KOP SURAT DISINI]\n\n";
            $fullText .= "========================================================================\n\n";
            $fullText .= "Detail Pelaporan:\n";
            $fullText .= "{{BAP_CONTENT}}\n\n";
            $fullText .= "Dicetak pada: " . date('d/m/Y H:i') . "\n";

            $requests[] = new Docs\Request([
                'insertText' => [
                    'location' => ['index' => 1],
                    'text' => $fullText
                ]
            ]);

            $batchUpdateRequest = new Docs\BatchUpdateDocumentRequest([
                'requests' => $requests
            ]);

            $docsService->documents->batchUpdate($documentId, $batchUpdateRequest);

            // 3. Move to folder
            $folderNameOrId = env('GOOGLE_DRIVE_FOLDER');
            if ($folderNameOrId) {
                $folderId = $folderNameOrId;
                if (strlen($folderNameOrId) < 20 || strpos($folderNameOrId, ' ') !== false) {
                    $results = $driveService->files->listFiles([
                        'q' => "mimeType='application/vnd.google-apps.folder' and name='{$folderNameOrId}' and trashed=false",
                        'spaces' => 'drive',
                        'fields' => 'files(id, name)',
                    ]);

                    if (count($results->getFiles()) == 0) {
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

                $file = $driveService->files->get($documentId, ['fields' => 'parents']);
                $previousParents = join(',', $file->parents);

                $emptyFileMetadata = new Drive\DriveFile();
                $driveService->files->update($documentId, $emptyFileMetadata, [
                    'addParents' => $folderId,
                    'removeParents' => $previousParents,
                    'fields' => 'id, parents'
                ]);
                $this->info("Moved to Folder: {$folderNameOrId}");
            }

            // Public visibility
            $permission = new Drive\Permission([
                'type' => 'anyone',
                'role' => 'reader',
            ]);
            $driveService->permissions->create($documentId, $permission);

            $this->info("Success! Template url: https://docs.google.com/document/d/{$documentId}/edit");
            $this->info('Place this ID in .env as BAP_TEMPLATE_DOC_ID=' . $documentId);

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
        }
    }
}
