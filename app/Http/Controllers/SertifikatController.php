<?php

namespace App\Http\Controllers;

use App\Models\ApplicationMataKuliah;
use App\Models\Event;
use App\Services\GoogleDocsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SertifikatController extends Controller
{
    public function uploadTemplate(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'template' => 'required|file|mimes:pdf|max:10240', // max 10MB
        ]);

        $eventId = (int) $request->integer('event_id');
        $directory = $this->templateDirectory($eventId);
        $file = $request->file('template');

        Storage::disk('local')->makeDirectory($directory);
        $file->storeAs($directory, 'template.pdf', 'local');

        return response()->json([
            'success' => true,
            'message' => 'Template berhasil diupload.',
            'has_template' => true,
        ]);
    }

    public function previewTemplate(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
        ]);

        $path = storage_path('app/private/' . $this->templateFilePath((int) $request->integer('event_id')));
        if (!file_exists($path)) {
            abort(404, 'Template belum diupload.');
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="template.pdf"',
        ]);
    }

    public function saveConfig(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'nama_x' => 'required|numeric|min:0|max:100',
            'nama_y' => 'required|numeric|min:0|max:100',
            'nama_font_size' => 'required|numeric|min:8|max:72',
            'nim_x' => 'required|numeric|min:0|max:100',
            'nim_y' => 'required|numeric|min:0|max:100',
            'nim_font_size' => 'required|numeric|min:8|max:72',
            'sample_nama' => 'nullable|string|max:255',
            'sample_nim' => 'nullable|string|max:100',
        ]);

        $eventId = (int) $request->integer('event_id');
        $config = [
            'event_id' => $eventId,
            'nama' => [
                'x' => (float) $request->input('nama_x'),
                'y' => (float) $request->input('nama_y'),
                'font_size' => (float) $request->input('nama_font_size'),
            ],
            'nim' => [
                'x' => (float) $request->input('nim_x'),
                'y' => (float) $request->input('nim_y'),
                'font_size' => (float) $request->input('nim_font_size'),
            ],
            'sample' => [
                'nama' => $request->input('sample_nama', 'Contoh Nama Lengkap'),
                'nim' => $request->input('sample_nim', '2200012345'),
            ],
        ];

        Storage::disk('local')->makeDirectory($this->templateDirectory($eventId));
        Storage::disk('local')->put(
            $this->configFilePath($eventId),
            json_encode($config, JSON_PRETTY_PRINT)
        );

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi berhasil disimpan.',
            'config' => $config,
        ]);
    }

    public function getConfig(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
        ]);

        $eventId = (int) $request->integer('event_id');
        $configPath = storage_path('app/private/' . $this->configFilePath($eventId));
        $hasTemplate = file_exists(storage_path('app/private/' . $this->templateFilePath($eventId)));
        $config = file_exists($configPath)
            ? json_decode(file_get_contents($configPath), true)
            : $this->defaultConfig($eventId);

        return response()->json([
            'success' => true,
            'config' => $config,
            'has_saved_config' => file_exists($configPath),
            'has_template' => $hasTemplate,
        ]);
    }

    public function generate(Request $request, GoogleDocsService $docsService)
    {
        set_time_limit(600); // 10 minutes timeout

        $request->validate([
            'event_id' => 'required|exists:events,id',
        ]);

        $event = Event::with('semester')->findOrFail($request->event_id);
        $semesterName = $event->semester ? $event->semester->nama : 'Semester';
        $eventName = $this->sanitizeDriveName($event->nama);

        $eventId = (int) $request->integer('event_id');
        $configPath = storage_path('app/private/' . $this->configFilePath($eventId));
        if (!file_exists($configPath)) {
            return response()->json(['success' => false, 'message' => 'Konfigurasi belum disimpan.'], 422);
        }
        $config = json_decode(file_get_contents($configPath), true);

        $templatePath = storage_path('app/private/' . $this->templateFilePath($eventId));
        if (!file_exists($templatePath)) {
            return response()->json(['success' => false, 'message' => 'Template belum diupload.'], 422);
        }

        $approvedChoices = ApplicationMataKuliah::where('status', 'approved')
            ->whereHas('application', function ($q) use ($event) {
                $q->where('event_id', $event->id)
                  ->where('status', 'approved');
            })
            ->with([
                'application.user.profile',
                'eventMataKuliah.mataKuliah',
                'eventMataKuliah.kelas',
            ])
            ->get();

        if ($approvedChoices->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Tidak ada asisten yang disetujui untuk event ini.'], 422);
        }

        // Determine Google Drive root folder
        $rootFolderCfg = config('filesystems.disks.google.folderId', env('GOOGLE_DRIVE_FOLDER', 'root'));
        if ($rootFolderCfg && $rootFolderCfg !== 'root') {
            if (strlen($rootFolderCfg) < 20) {
                $rootFolderName = $rootFolderCfg;
                $rootFolderId = 'root';
            } else {
                $rootFolderName = null;
                $rootFolderId = $rootFolderCfg;
            }
        } else {
            $rootFolderName = null;
            $rootFolderId = 'root';
        }

        $generated = 0;
        $errors = [];

        foreach ($approvedChoices as $choice) {
            try {
                $user = $choice->application->user;
                $profile = $user->profile;
                $emk = $choice->eventMataKuliah;
                $mk = $emk->mataKuliah;
                $kelas = $emk->kelas;

                $nama = trim($profile->nama_lengkap ?? $user->name ?? 'Asisten');
                $nim = trim($user->nim ?? '-');
                $kelasNama = $this->sanitizeDriveName($kelas?->nama ?? 'X');
                $mkNama = $this->sanitizeDriveName($mk?->nama ?? 'MK');
                $safeNama = $this->sanitizeDriveName($nama);
                $safeNim = $this->sanitizeDriveName($nim);

                $pdf = new \setasign\Fpdi\Fpdi();
                $pdf->setSourceFile($templatePath);
                $tplId = $pdf->importPage(1);
                $size = $pdf->getTemplateSize($tplId);

                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($tplId, 0, 0, $size['width'], $size['height']);

                // Set font for nama
                $pdf->SetFont('Helvetica', 'B', $config['nama']['font_size']);
                $pdf->SetTextColor(0, 0, 0);

                // Convert percentage to actual coordinates
                $namaX = ($config['nama']['x'] / 100) * $size['width'];
                $namaY = ($config['nama']['y'] / 100) * $size['height'];

                // Calculate text width for centering
                $namaWidth = $pdf->GetStringWidth($nama);
                $pdf->SetXY($namaX - ($namaWidth / 2), $namaY);
                $pdf->Cell($namaWidth, 10, $nama, 0, 0, 'C');

                // Set font for NIM
                $pdf->SetFont('Helvetica', '', $config['nim']['font_size']);
                $nimX = ($config['nim']['x'] / 100) * $size['width'];
                $nimY = ($config['nim']['y'] / 100) * $size['height'];

                $nimWidth = $pdf->GetStringWidth($nim);
                $pdf->SetXY($nimX - ($nimWidth / 2), $nimY);
                $pdf->Cell($nimWidth, 10, $nim, 0, 0, 'C');

                $fileName = "{$kelasNama}-{$safeNim}-{$safeNama}.pdf";
                $tempDir = storage_path('app/private/sertifikat-temp');
                if (!is_dir($tempDir)) {
                    mkdir($tempDir, 0755, true);
                }
                $tempPath = tempnam($tempDir, 'sertifikat_');
                $pdf->Output('F', $tempPath);

                $folderHierarchy = ['Asisten', $semesterName, $eventName, 'Sertifikat', $mkNama];
                if ($rootFolderName) {
                    array_unshift($folderHierarchy, $rootFolderName);
                }

                $targetFolderId = $docsService->ensureFolderHierarchyAndGetId($folderHierarchy, $rootFolderId);
                $this->deleteExistingDriveFile($docsService, $targetFolderId, $fileName);
                $fileId = $docsService->uploadFileToFolder($tempPath, $fileName, 'application/pdf', $targetFolderId);

                try {
                    $permission = new \Google\Service\Drive\Permission([
                        'type' => 'anyone',
                        'role' => 'reader',
                    ]);
                    $docsService->getDriveService()->permissions->create($fileId, $permission);
                } catch (\Exception $e) {
                    Log::warning("Gagal set public untuk sertifikat: {$fileName}");
                }

                @unlink($tempPath);

                $generated++;
                Log::info("Sertifikat berhasil di-generate: {$fileName}");
            } catch (\Exception $e) {
                $errorMsg = "Gagal generate sertifikat untuk {$choice->application->user->name}: " . $e->getMessage();
                $errors[] = $errorMsg;
                Log::error($errorMsg);
            }
        }

        $message = "Berhasil generate {$generated} sertifikat.";
        if (!empty($errors)) {
            $message .= " ({$errors[0]})";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'generated' => $generated,
            'total' => $approvedChoices->count(),
            'errors' => $errors,
        ]);
    }

    private function defaultConfig(int $eventId): array
    {
        return [
            'event_id' => $eventId,
            'nama' => [
                'x' => 50,
                'y' => 47,
                'font_size' => 32,
            ],
            'nim' => [
                'x' => 50,
                'y' => 56,
                'font_size' => 18,
            ],
            'sample' => [
                'nama' => 'Contoh Nama Lengkap',
                'nim' => '2200012345',
            ],
        ];
    }

    private function templateDirectory(int $eventId): string
    {
        return 'sertifikat-templates/event-' . $eventId;
    }

    private function templateFilePath(int $eventId): string
    {
        return $this->templateDirectory($eventId) . '/template.pdf';
    }

    private function configFilePath(int $eventId): string
    {
        return $this->templateDirectory($eventId) . '/config.json';
    }

    private function sanitizeDriveName(string $value): string
    {
        $value = preg_replace('/[\\\\\\/\\:\\*\\?\\"<>\\|]+/', '-', $value) ?? $value;
        $value = preg_replace('/\\s+/', ' ', $value) ?? $value;

        return Str::limit(trim($value), 150, '');
    }

    private function deleteExistingDriveFile(GoogleDocsService $docsService, string $folderId, string $fileName): void
    {
        $escapedName = str_replace("'", "\\'", $fileName);
        $result = $docsService->getDriveService()->files->listFiles([
            'q' => sprintf("name = '%s' and '%s' in parents and trashed = false", $escapedName, $folderId),
            'spaces' => 'drive',
            'fields' => 'files(id)',
        ]);

        foreach ($result->getFiles() as $file) {
            $docsService->getDriveService()->files->delete($file->id);
        }
    }
}
