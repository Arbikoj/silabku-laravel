<?php

namespace App\Http\Controllers;

use App\Models\ApplicationMataKuliah;
use App\Models\Event;
use App\Models\SertifikatPenerbitan;
use App\Services\GoogleDocsService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SertifikatController extends Controller
{
    private const FONT_DEFINITIONS_DIR = 'storage/app/private/sertifikat-fonts/defs';

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

    public function downloadSample(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'nama_x' => 'required|numeric|min:0|max:100',
            'nama_y' => 'required|numeric|min:0|max:100',
            'nama_font_size' => 'required|numeric|min:8|max:72',
            'nama_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'nama_is_bold' => 'required|boolean',
            'nama_is_italic' => 'required|boolean',
            'nama_is_underline' => 'required|boolean',
            'nomor_x' => 'required|numeric|min:0|max:100',
            'nomor_y' => 'required|numeric|min:0|max:100',
            'nomor_font_size' => 'required|numeric|min:8|max:72',
            'nomor_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'nomor_is_bold' => 'required|boolean',
            'nomor_is_italic' => 'required|boolean',
            'nomor_is_underline' => 'required|boolean',
            'mata_kuliah_x' => 'required|numeric|min:0|max:100',
            'mata_kuliah_y' => 'required|numeric|min:0|max:100',
            'mata_kuliah_font_size' => 'required|numeric|min:8|max:72',
            'mata_kuliah_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'mata_kuliah_is_bold' => 'required|boolean',
            'mata_kuliah_is_italic' => 'required|boolean',
            'mata_kuliah_is_underline' => 'required|boolean',
            'custom_x' => 'required|numeric|min:0|max:100',
            'custom_y' => 'required|numeric|min:0|max:100',
            'custom_font_size' => 'required|numeric|min:8|max:72',
            'custom_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'custom_is_bold' => 'required|boolean',
            'custom_is_italic' => 'required|boolean',
            'custom_is_underline' => 'required|boolean',
            'sample_nama' => 'nullable|string|max:255',
            'sample_nomor' => 'nullable|string|max:255',
            'sample_mata_kuliah' => 'nullable|string|max:255',
            'sample_custom' => 'nullable|string|max:255',
        ]);

        $eventId = (int) $request->integer('event_id');
        $templatePath = storage_path('app/private/' . $this->templateFilePath($eventId));
        if (!file_exists($templatePath)) {
            return response()->json(['success' => false, 'message' => 'Template belum diupload.'], 422);
        }

        $config = [
            'nama' => [
                'x' => (float) $request->input('nama_x'),
                'y' => (float) $request->input('nama_y'),
                'font_size' => (float) $request->input('nama_font_size'),
                'font_family' => $request->input('nama_font_family'),
                'is_bold' => (bool) $request->boolean('nama_is_bold'),
                'is_italic' => (bool) $request->boolean('nama_is_italic'),
                'is_underline' => (bool) $request->boolean('nama_is_underline'),
            ],
            'nomor' => [
                'x' => (float) $request->input('nomor_x'),
                'y' => (float) $request->input('nomor_y'),
                'font_size' => (float) $request->input('nomor_font_size'),
                'font_family' => $request->input('nomor_font_family'),
                'is_bold' => (bool) $request->boolean('nomor_is_bold'),
                'is_italic' => (bool) $request->boolean('nomor_is_italic'),
                'is_underline' => (bool) $request->boolean('nomor_is_underline'),
            ],
            'mata_kuliah' => [
                'x' => (float) $request->input('mata_kuliah_x'),
                'y' => (float) $request->input('mata_kuliah_y'),
                'font_size' => (float) $request->input('mata_kuliah_font_size'),
                'font_family' => $request->input('mata_kuliah_font_family'),
                'is_bold' => (bool) $request->boolean('mata_kuliah_is_bold'),
                'is_italic' => (bool) $request->boolean('mata_kuliah_is_italic'),
                'is_underline' => (bool) $request->boolean('mata_kuliah_is_underline'),
            ],
            'custom' => [
                'x' => (float) $request->input('custom_x'),
                'y' => (float) $request->input('custom_y'),
                'font_size' => (float) $request->input('custom_font_size'),
                'font_family' => $request->input('custom_font_family'),
                'is_bold' => (bool) $request->boolean('custom_is_bold'),
                'is_italic' => (bool) $request->boolean('custom_is_italic'),
                'is_underline' => (bool) $request->boolean('custom_is_underline'),
            ],
        ];

        $pdf = new \setasign\Fpdi\Fpdi();
        $pdf->setSourceFile($templatePath);
        $tplId = $pdf->importPage(1);
        $size = $pdf->getTemplateSize($tplId);

        $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $pdf->useTemplate($tplId, 0, 0, $size['width'], $size['height']);
        $pdf->SetTextColor(0, 0, 0);

        $this->renderCertificateText(
            $pdf,
            $size,
            $config,
            trim((string) $request->input('sample_nama', 'Contoh Nama Lengkap')),
            trim((string) $request->input('sample_nomor', '141/DST/IT9.3.1/HM.02.06/2026')),
            trim((string) $request->input('sample_mata_kuliah', 'Algoritma dan Pemrograman')),
            trim((string) $request->input('sample_custom', 'Asisten Praktikum'))
        );

        $content = $pdf->Output('S');

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="contoh-sertifikat.pdf"',
        ]);
    }

    public function saveConfig(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'nama_x' => 'required|numeric|min:0|max:100',
            'nama_y' => 'required|numeric|min:0|max:100',
            'nama_font_size' => 'required|numeric|min:8|max:72',
            'nama_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'nama_is_bold' => 'required|boolean',
            'nama_is_italic' => 'required|boolean',
            'nama_is_underline' => 'required|boolean',
            'nomor_x' => 'required|numeric|min:0|max:100',
            'nomor_y' => 'required|numeric|min:0|max:100',
            'nomor_font_size' => 'required|numeric|min:8|max:72',
            'nomor_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'nomor_is_bold' => 'required|boolean',
            'nomor_is_italic' => 'required|boolean',
            'nomor_is_underline' => 'required|boolean',
            'mata_kuliah_x' => 'required|numeric|min:0|max:100',
            'mata_kuliah_y' => 'required|numeric|min:0|max:100',
            'mata_kuliah_font_size' => 'required|numeric|min:8|max:72',
            'mata_kuliah_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'mata_kuliah_is_bold' => 'required|boolean',
            'mata_kuliah_is_italic' => 'required|boolean',
            'mata_kuliah_is_underline' => 'required|boolean',
            'custom_x' => 'required|numeric|min:0|max:100',
            'custom_y' => 'required|numeric|min:0|max:100',
            'custom_font_size' => 'required|numeric|min:8|max:72',
            'custom_font_family' => 'required|string|in:helvetica,roboto,opensans,montserrat',
            'custom_is_bold' => 'required|boolean',
            'custom_is_italic' => 'required|boolean',
            'custom_is_underline' => 'required|boolean',
            'sample_nama' => 'nullable|string|max:255',
            'sample_nomor' => 'nullable|string|max:255',
            'sample_mata_kuliah' => 'nullable|string|max:255',
            'sample_custom' => 'nullable|string|max:255',
        ]);

        $eventId = (int) $request->integer('event_id');
        $config = [
            'event_id' => $eventId,
            'nama' => [
                'x' => (float) $request->input('nama_x'),
                'y' => (float) $request->input('nama_y'),
                'font_size' => (float) $request->input('nama_font_size'),
                'font_family' => $request->input('nama_font_family'),
                'is_bold' => (bool) $request->boolean('nama_is_bold'),
                'is_italic' => (bool) $request->boolean('nama_is_italic'),
                'is_underline' => (bool) $request->boolean('nama_is_underline'),
            ],
            'nomor' => [
                'x' => (float) $request->input('nomor_x'),
                'y' => (float) $request->input('nomor_y'),
                'font_size' => (float) $request->input('nomor_font_size'),
                'font_family' => $request->input('nomor_font_family'),
                'is_bold' => (bool) $request->boolean('nomor_is_bold'),
                'is_italic' => (bool) $request->boolean('nomor_is_italic'),
                'is_underline' => (bool) $request->boolean('nomor_is_underline'),
            ],
            'mata_kuliah' => [
                'x' => (float) $request->input('mata_kuliah_x'),
                'y' => (float) $request->input('mata_kuliah_y'),
                'font_size' => (float) $request->input('mata_kuliah_font_size'),
                'font_family' => $request->input('mata_kuliah_font_family'),
                'is_bold' => (bool) $request->boolean('mata_kuliah_is_bold'),
                'is_italic' => (bool) $request->boolean('mata_kuliah_is_italic'),
                'is_underline' => (bool) $request->boolean('mata_kuliah_is_underline'),
            ],
            'custom' => [
                'x' => (float) $request->input('custom_x'),
                'y' => (float) $request->input('custom_y'),
                'font_size' => (float) $request->input('custom_font_size'),
                'font_family' => $request->input('custom_font_family'),
                'is_bold' => (bool) $request->boolean('custom_is_bold'),
                'is_italic' => (bool) $request->boolean('custom_is_italic'),
                'is_underline' => (bool) $request->boolean('custom_is_underline'),
            ],
            'sample' => [
                'nama' => $request->input('sample_nama', 'Contoh Nama Lengkap'),
                'nomor' => $request->input('sample_nomor', '141/DST/IT9.3.1/HM.02.06/2026'),
                'mata_kuliah' => $request->input('sample_mata_kuliah', 'Algoritma dan Pemrograman'),
                'custom' => $request->input('sample_custom', 'Asisten Praktikum'),
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

    public function prepareData(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'nomor_awal' => 'required|integer|min:1',
            'nomor_akhir' => 'required|string|max:255',
        ]);

        $event = Event::with('semester')->findOrFail($request->integer('event_id'));
        $nomorAwal = (int) $request->integer('nomor_awal');
        $nomorAkhir = trim((string) $request->input('nomor_akhir'));

        $recipients = $this->buildCertificateRecipients($event)
            ->values()
            ->map(function (array $recipient, int $index) use ($nomorAwal, $nomorAkhir) {
                $recipient['nomor_urut'] = $nomorAwal + $index;
                $recipient['nomor_sertifikat'] = $this->formatCertificateNumber($recipient['nomor_urut'], $nomorAkhir);

                return $recipient;
            })
            ->values();

        return response()->json([
            'success' => true,
            'event' => [
                'id' => $event->id,
                'nama' => $event->nama,
                'semester' => $event->semester?->nama,
            ],
            'items' => $recipients,
            'total' => $recipients->count(),
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
            ? array_replace_recursive(
                $this->defaultConfig($eventId),
                json_decode(file_get_contents($configPath), true) ?? []
            )
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
            'nomor_awal' => 'required|integer|min:1',
            'nomor_akhir' => 'required|string|max:255',
        ]);

        $event = Event::with('semester')->findOrFail($request->integer('event_id'));
        $semesterName = $event->semester ? $event->semester->nama : 'Semester';
        $eventName = $this->sanitizeDriveName($event->nama);
        $nomorAwal = (int) $request->integer('nomor_awal');
        $nomorAkhir = trim((string) $request->input('nomor_akhir'));

        $eventId = (int) $request->integer('event_id');
        $configPath = storage_path('app/private/' . $this->configFilePath($eventId));
        if (!file_exists($configPath)) {
            return response()->json(['success' => false, 'message' => 'Konfigurasi belum disimpan.'], 422);
        }
        $config = array_replace_recursive(
            $this->defaultConfig($eventId),
            json_decode(file_get_contents($configPath), true) ?? []
        );

        $templatePath = storage_path('app/private/' . $this->templateFilePath($eventId));
        if (!file_exists($templatePath)) {
            return response()->json(['success' => false, 'message' => 'Template belum diupload.'], 422);
        }

        $recipients = $this->buildCertificateRecipients($event)->values();
        if ($recipients->isEmpty()) {
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

        foreach ($recipients as $index => $recipient) {
            try {
                $nama = $recipient['nama'];
                $nomorUrut = $nomorAwal + $index;
                $nomorSertifikat = $this->formatCertificateNumber($nomorUrut, $nomorAkhir);
                $mkNama = $this->sanitizeDriveName($recipient['mata_kuliah']);
                $safeNama = $this->sanitizeDriveName($nama);
                $safeNim = $this->sanitizeDriveName($recipient['nim']);

                $pdf = new \setasign\Fpdi\Fpdi();
                $pdf->setSourceFile($templatePath);
                $tplId = $pdf->importPage(1);
                $size = $pdf->getTemplateSize($tplId);

                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($tplId, 0, 0, $size['width'], $size['height']);
                $pdf->SetTextColor(0, 0, 0);
                $this->renderCertificateText(
                    $pdf,
                    $size,
                    $config,
                    $nama,
                    $nomorSertifikat,
                    $recipient['mata_kuliah'],
                    (string) ($config['sample']['custom'] ?? 'Asisten Praktikum')
                );

                $fileName = "{$safeNim}-{$safeNama}.pdf";
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

                SertifikatPenerbitan::updateOrCreate(
                    [
                        'event_id' => $event->id,
                        'user_id' => $recipient['user_id'],
                        'mata_kuliah_id' => $recipient['mata_kuliah_id'],
                    ],
                    [
                        'nomor_urut' => $nomorUrut,
                        'nomor_sertifikat' => $nomorSertifikat,
                        'google_drive_file_id' => $fileId,
                        'google_drive_file_name' => $fileName,
                        'generated_at' => now(),
                    ]
                );

                $generated++;
                Log::info("Sertifikat berhasil di-generate: {$fileName} ({$nomorSertifikat})");
            } catch (\Exception $e) {
                $errorMsg = "Gagal generate sertifikat untuk {$recipient['nama']} ({$recipient['mata_kuliah']}): " . $e->getMessage();
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
            'total' => $recipients->count(),
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
                'font_family' => 'helvetica',
                'is_bold' => true,
                'is_italic' => false,
                'is_underline' => false,
            ],
            'nomor' => [
                'x' => 18,
                'y' => 16,
                'font_size' => 16,
                'font_family' => 'helvetica',
                'is_bold' => false,
                'is_italic' => false,
                'is_underline' => false,
            ],
            'mata_kuliah' => [
                'x' => 50,
                'y' => 56,
                'font_size' => 18,
                'font_family' => 'helvetica',
                'is_bold' => false,
                'is_italic' => false,
                'is_underline' => false,
            ],
            'custom' => [
                'x' => 18,
                'y' => 72,
                'font_size' => 16,
                'font_family' => 'helvetica',
                'is_bold' => false,
                'is_italic' => false,
                'is_underline' => false,
            ],
            'sample' => [
                'nama' => 'Contoh Nama Lengkap',
                'nomor' => '141/DST/IT9.3.1/HM.02.06/2026',
                'mata_kuliah' => 'Algoritma dan Pemrograman',
                'custom' => 'Asisten Praktikum',
            ],
        ];
    }

    private function buildCertificateRecipients(Event $event): Collection
    {
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

        return $approvedChoices
            ->groupBy(function (ApplicationMataKuliah $choice) {
                return $choice->application->user_id . '-' . $choice->eventMataKuliah->mata_kuliah_id;
            })
            ->map(function (Collection $group) {
                /** @var ApplicationMataKuliah $choice */
                $choice = $group
                    ->sortBy(fn (ApplicationMataKuliah $item) => $item->eventMataKuliah->kelas?->nama ?? '')
                    ->first();

                $user = $choice->application->user;
                $profile = $user->profile;
                $mataKuliah = $choice->eventMataKuliah->mataKuliah;

                return [
                    'user_id' => $user->id,
                    'mata_kuliah_id' => $mataKuliah->id,
                    'nama' => trim($profile->nama_lengkap ?? $user->name ?? 'Asisten'),
                    'nim' => trim($user->nim ?? '-'),
                    'mata_kuliah' => trim($mataKuliah->nama ?? 'Mata Kuliah'),
                    'kelas' => $group
                        ->map(fn (ApplicationMataKuliah $item) => $item->eventMataKuliah->kelas?->nama)
                        ->filter()
                        ->unique()
                        ->sort()
                        ->values()
                        ->all(),
                ];
            })
            ->sort(function (array $left, array $right) {
                $mataKuliahCompare = strcasecmp($left['mata_kuliah'], $right['mata_kuliah']);
                if ($mataKuliahCompare !== 0) {
                    return $mataKuliahCompare;
                }

                $namaCompare = strcasecmp($left['nama'], $right['nama']);
                if ($namaCompare !== 0) {
                    return $namaCompare;
                }

                return strcasecmp($left['nim'], $right['nim']);
            })
            ->values();
    }

    private function formatCertificateNumber(int $nomorUrut, string $nomorAkhir): string
    {
        $nomorAkhir = trim($nomorAkhir, " \t\n\r\0\x0B/");

        if ($nomorAkhir === '') {
            return (string) $nomorUrut;
        }

        return $nomorUrut . '/' . $nomorAkhir;
    }

    private function renderCertificateText(
        \setasign\Fpdi\Fpdi $pdf,
        array $size,
        array $config,
        string $nama,
        string $nomorSertifikat,
        string $mataKuliah,
        string $custom
    ): void {
        $namaX = ($config['nama']['x'] / 100) * $size['width'];
        $namaY = ($config['nama']['y'] / 100) * $size['height'];
        $this->drawText($pdf, $config['nama'], $namaX, $namaY, $nama, 'center');

        $nomorX = ($config['nomor']['x'] / 100) * $size['width'];
        $nomorY = ($config['nomor']['y'] / 100) * $size['height'];
        $this->drawText($pdf, $config['nomor'], $nomorX, $nomorY, $nomorSertifikat, 'left');

        $mataKuliahX = ($config['mata_kuliah']['x'] / 100) * $size['width'];
        $mataKuliahY = ($config['mata_kuliah']['y'] / 100) * $size['height'];
        $this->drawText($pdf, $config['mata_kuliah'], $mataKuliahX, $mataKuliahY, $mataKuliah, 'center');

        $customX = ($config['custom']['x'] / 100) * $size['width'];
        $customY = ($config['custom']['y'] / 100) * $size['height'];
        $this->drawText($pdf, $config['custom'], $customX, $customY, $custom, 'left');
    }

    private function drawText(
        \setasign\Fpdi\Fpdi $pdf,
        array $layerConfig,
        float $x,
        float $y,
        string $text,
        string $align = 'left'
    ): void
    {
        $fontSize = (float) $layerConfig['font_size'];
        $this->applyLayerFont($pdf, $layerConfig);
        $baselineOffset = ($fontSize / 72) * 25.4 * 0.8;
        $drawX = $x;

        if ($align === 'center') {
            $drawX -= $pdf->GetStringWidth($text) / 2;
        }

        $pdf->Text($drawX, $y + $baselineOffset, $text);
    }

    private function applyLayerFont(\setasign\Fpdi\Fpdi $pdf, array $layerConfig): void
    {
        $family = strtolower((string) ($layerConfig['font_family'] ?? 'helvetica'));
        $isBold = (bool) ($layerConfig['is_bold'] ?? false);
        $isItalic = (bool) ($layerConfig['is_italic'] ?? false);
        $isUnderline = (bool) ($layerConfig['is_underline'] ?? false);
        $fontSize = (float) ($layerConfig['font_size'] ?? 12);

        $style = '';
        if ($isBold) {
            $style .= 'B';
        }
        if ($isItalic) {
            $style .= 'I';
        }
        if ($isUnderline) {
            $style .= 'U';
        }

        if ($family === 'helvetica') {
            $pdf->SetFont('Helvetica', $style, $fontSize);

            return;
        }

        $this->ensureCustomFontRegistered($pdf, $family, $isBold, $isItalic);
        $pdf->SetFont($this->fontFamilyAlias($family), $style, $fontSize);
    }

    private function ensureCustomFontRegistered(\setasign\Fpdi\Fpdi $pdf, string $family, bool $isBold, bool $isItalic): void
    {
        $styleKey = ($isBold ? 'B' : '') . ($isItalic ? 'I' : '');
        $fileName = match ($family) {
            'roboto' => match ($styleKey) {
                'B' => 'Roboto-Bold.php',
                'I' => 'Roboto-Italic.php',
                'BI' => 'Roboto-BoldItalic.php',
                default => 'Roboto-Regular.php',
            },
            'opensans' => match ($styleKey) {
                'B' => 'OpenSans-Bold.php',
                'I' => 'OpenSans-Italic.php',
                'BI' => 'OpenSans-BoldItalic.php',
                default => 'OpenSans-Regular.php',
            },
            'montserrat' => match ($styleKey) {
                'B' => 'Montserrat-Bold.php',
                'I' => 'Montserrat-Italic.php',
                'BI' => 'Montserrat-BoldItalic.php',
                default => 'Montserrat-Regular.php',
            },
            default => null,
        };

        if (!$fileName) {
            return;
        }

        $dir = base_path(self::FONT_DEFINITIONS_DIR);
        $pdf->AddFont($this->fontFamilyAlias($family), $styleKey, $fileName, $dir);
    }

    private function fontFamilyAlias(string $family): string
    {
        return match ($family) {
            'roboto' => 'Roboto',
            'opensans' => 'OpenSans',
            'montserrat' => 'Montserrat',
            default => 'Helvetica',
        };
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

    public function mySertifikat(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        
        $sertifikats = SertifikatPenerbitan::with(['event.semester', 'mataKuliah'])
            ->where('user_id', $request->user()->id)
            ->latest('generated_at')
            ->paginate($perPage);

        return response()->json($sertifikats);
    }

    public function allSertifikat(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $eventId = $request->input('event_id');

        $query = SertifikatPenerbitan::with(['user.profile', 'event.semester', 'mataKuliah'])
            ->latest('generated_at');

        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        return response()->json($query->paginate($perPage));
    }

    public function viewSertifikat($id, Request $request)
    {
        $query = SertifikatPenerbitan::where('id', $id);

        if (!in_array($request->user()->role, ['admin', 'dosen'])) {
            $query->where('user_id', $request->user()->id);
        }

        $sertifikat = $query->firstOrFail();

        if (!$sertifikat->google_drive_file_id) {
            abort(404, 'Sertifikat tidak ditemukan');
        }

        return redirect()->away('https://drive.google.com/file/d/' . $sertifikat->google_drive_file_id . '/preview');
    }
}
