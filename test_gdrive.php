<?php
require 'vendor/autoload.php';

use Google\Client;
use Google\Service\Drive;

// Manual env check instead of parse_ini_file
$lines = file('.env');
$env = [];
foreach ($lines as $line) {
    if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
        list($key, $val) = explode('=', $line, 2);
        $env[trim($key)] = trim($val, " \t\n\r\0\x0B\"");
    }
}

$client = new Client();
$client->setClientId($env['GOOGLE_DRIVE_CLIENT_ID']);
$client->setClientSecret($env['GOOGLE_DRIVE_CLIENT_SECRET']);
$client->refreshToken($env['GOOGLE_DRIVE_REFRESH_TOKEN']);
$client->addScope(Drive::DRIVE_FILE);

$service = new Drive($client);

try {
    echo "Testing connection...\n";
    $files = $service->files->listFiles(['pageSize' => 5]);
    echo "Connection successful. Found " . count($files->getFiles()) . " files.\n";
    
    $folderName = $env['GOOGLE_DRIVE_FOLDER_ID'];
    echo "Searching for folder: $folderName\n";
    
    $query = "name = '$folderName' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    $results = $service->files->listFiles([
        'q' => $query,
        'spaces' => 'drive',
        'fields' => 'nextPageToken, files(id, name)',
    ]);
    
    if (count($results->getFiles()) == 0) {
        echo "Folder NOT found by ID. Checking if it's a name...\n";
    } else {
        foreach ($results->getFiles() as $file) {
            echo "Found folder: " . $file->getName() . " (ID: " . $file->getId() . ")\n";
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
