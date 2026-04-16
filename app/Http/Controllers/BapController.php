<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\BapPertemuan;
use App\Models\Application;
use App\Models\jadwalPraktikum;
use App\Services\GoogleDocsService;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BapController extends Controller
{
    /**
     * Show the BAP page listing the assistant's classes
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Cari aplikasi asisten yang Lulus
        $applications = Application::with([
            'event',
            'applicationMataKuliah.eventMataKuliah.mataKuliah',
            'applicationMataKuliah.eventMataKuliah.kelas'
        ])
        ->where('user_id', $user->id)
        ->where('status', 'approved')
        ->get();

        $jadwalPraktikums = collect();

        foreach ($applications as $app) {
            foreach ($app->applicationMataKuliah as $appMk) {
                // Pastikan status mata kuliah juga approved
                if ($appMk->status !== 'approved') {
                    continue;
                }

                $eventMk = $appMk->eventMataKuliah;
                if ($eventMk) {
                    $semesterId = $app->event->semester_id ?? null;
                    
                    // Find actual Jadwal Praktikum
                    $query = JadwalPraktikum::with(['mataKuliah', 'kelas', 'laboratorium'])
                        ->where('mata_kuliah_id', $eventMk->mata_kuliah_id)
                        ->where('kelas_id', $eventMk->kelas_id);
                        
                    if ($semesterId) {
                        $query->where('semester_id', $semesterId);
                    }
                    
                    $jadwals = $query->get();
                    
                    foreach ($jadwals as $j) {
                        $jadwalPraktikums->push($j);
                    }
                }
            }
        }

        // Unik jadwal berdasarkan kombinasi mata_kuliah_id dan kelas_id
        $jadwalPraktikums = $jadwalPraktikums->unique(function ($item) {
            return $item->mata_kuliah_id . '-' . $item->kelas_id;
        })->values();

        // Muat data progress BAP yang sudah ada dari ini user
        $jadwalIds = $jadwalPraktikums->pluck('id');
        $bapProgress = BapPertemuan::whereIn('jadwal_praktikum_id', $jadwalIds)
            ->where('user_id', $user->id)
            ->get()
            ->groupBy('jadwal_praktikum_id');

        return Inertia::render('Bap/Index', [
            'jadwalPraktikums' => $jadwalPraktikums,
            'bapProgress' => $bapProgress
        ]);
    }

    /**
     * Store data and upload files to Google Drive
     */
    public function store(Request $request)
    {
        $request->validate([
            'jadwal_praktikum_id' => 'required|exists:jadwal_praktikums,id',
            'pertemuan_ke' => 'required|integer|min:1|max:10',
            'tanggal' => 'required|date',
            'topik' => 'required|string',
            'status' => 'required|in:LURING,DARING',
            'jumlah_hadir' => 'required|integer|min:0',
            'jumlah_tidak_hadir' => 'required|integer|min:0',
            // Only allow JPEG, JPG, PNG. No WebP.
            'foto_1' => 'nullable|image|mimes:jpeg,jpg,png',
            'foto_2' => 'nullable|image|mimes:jpeg,jpg,png',
            'foto_3' => 'nullable|image|mimes:jpeg,jpg,png',
        ]);

        $user = $request->user();
        $jadwal = JadwalPraktikum::with(['mataKuliah', 'semester'])->findOrFail($request->jadwal_praktikum_id);

        $semesterName = $jadwal->semester ? $jadwal->semester->nama : 'Semester';
        $mkName = $jadwal->mataKuliah ? $jadwal->mataKuliah->nama : 'MK';
        
        $existingBap = BapPertemuan::where([
            'jadwal_praktikum_id' => $jadwal->id,
            'user_id' => $user->id,
            'pertemuan_ke' => $request->pertemuan_ke,
        ])->first();

        $fotoIds = [];
        if ($existingBap) {
            $fotoIds = is_array($existingBap->foto_google_drive_ids) ? $existingBap->foto_google_drive_ids : (json_decode($existingBap->foto_google_drive_ids, true) ?? []);
        }
        
        // Folder Structure: Asisten/{Semester}/BAP/{MataKuliah}/{NIM-Nama}
        // Pastikan konfigurasi driver `google` di filesystems.php siap
        $folderPath = "Asisten/{$semesterName}/BAP/{$mkName}/{$user->nim}-{$user->name}";
        
        // Simpan setiap foto yang diupload ke GDrive
        for ($i = 1; $i <= 3; $i++) {
            $key = "foto_$i";
            if ($request->hasFile($key)) {
                // Hapus foto lama di Google Drive jika ada sebelum ditimpa
                if (isset($fotoIds["foto_{$i}"])) {
                    $oldPath = $fotoIds["foto_{$i}"]['path'];
                    try {
                        Storage::disk('google')->delete($oldPath);
                    } catch (\Exception $e) {
                        Log::warning("Gagal hapus foto lama: " . $oldPath);
                    }
                }
                
                $file = $request->file($key);
                // Build filename per requirement: pertemuan-{pertemuan_ke}-foto{i}.ext
                $extension = $file->getClientOriginalExtension();
                $newFileName = "pertemuan-{$request->pertemuan_ke}-foto{$i}.{$extension}";
                $path = Storage::disk('google')->putFileAs($folderPath, $file, $newFileName);

                // Set public immediately after upload
                try {
                    Storage::disk('google')->setVisibility($path, 'public');
                } catch (\Exception $e) {
                    Log::warning("Gagal set public saat upload foto: " . $path);
                }

                $fotoIds["foto_{$i}"] = [
                    'path' => $path,
                    'id' => $path,
                ];
            }
        }

        // Simpan BapPertemuan (upsert)
        $bap = BapPertemuan::updateOrCreate(
            [
                'jadwal_praktikum_id' => $jadwal->id,
                'user_id' => $user->id,
                'pertemuan_ke' => $request->pertemuan_ke,
            ],
            [
                'tanggal' => Carbon::parse($request->tanggal),
                'topik' => $request->topik,
                'status' => $request->status,
                'jumlah_hadir' => $request->jumlah_hadir,
                'jumlah_tidak_hadir' => $request->jumlah_tidak_hadir,
                'foto_google_drive_ids' => json_encode($fotoIds),
            ]
        );

        return redirect()->back()->with('success', 'BAP Pertemuan ' . $request->pertemuan_ke . ' tersimpan.');
    }

    /**
     * Generate Google Docs BAP for 10 Pertemuan
     */
    public function generate(Request $request, GoogleDocsService $docsService)
    {
        set_time_limit(300); // 5 minutes timeout to prevent 'hanya loading saja'
        
        $request->validate([
            'jadwal_praktikum_id' => 'required|exists:jadwal_praktikums,id',
        ]);

        $user = $request->user();
        Log::info("Mulai generate BAP untuk asisten: {$user->name}, jadwal_id: {$request->jadwal_praktikum_id}");
        $jadwal = JadwalPraktikum::with(['mataKuliah', 'kelas', 'laboratorium'])->findOrFail($request->jadwal_praktikum_id);

        // Ambil data BAP dari pertemuan 1 sampai 10
        $pertemuans = BapPertemuan::where('jadwal_praktikum_id', $jadwal->id)
            ->where('user_id', $user->id)
            ->orderBy('pertemuan_ke', 'asc')
            ->get()
            ->keyBy('pertemuan_ke');

        $templateId = env('BAP_TEMPLATE_DOC_ID');
        if (!$templateId) {
            return redirect()->back()->with('error', 'Template BAP belum disetting (BAP_TEMPLATE_DOC_ID).');
        }

        $semesterName = $jadwal->semester ? $jadwal->semester->nama : 'Semester';
        $docTitle = "{$user->name}-{$user->nim}";
        
        try {
            // Hapus BAP lama dengan nama yang persis sama agar tidak dobel/menumpuk
            Log::info("Menghapus BAP lama jika ada: {$docTitle}");
            $docsService->deleteDocumentByName($docTitle);

            // 1. Copy Template
            $newDocumentId = $docsService->duplicateTemplate($templateId, $docTitle);
            Log::info("Template berhasil diduplikasi: {$newDocumentId}");

            // 1.5 Pindahkan dokumen ke folder secara hierarki
            $folderHierarchy = ['Asisten', $semesterName, 'BAP', $jadwal->mataKuliah->nama, "{$user->nim}-{$user->name}"];
            Log::info("Memindahkan file BAP ke direktori spesifik...");
            $docsService->moveToFolderHierarchy($newDocumentId, $folderHierarchy);

            // 2. Siapkan Replacements Text & Images
            $textReplacements = [
                '{{nama}}' => $user->name,
                '{{nim}}' => $user->nim ?? '-',
                '{{mata_kuliah}}' => $jadwal->mataKuliah->nama,
                '{{kelas}}' => $jadwal->kelas ? $jadwal->kelas->nama : '-',
                '{{waktu_praktikum}}' => ($jadwal->jam_mulai ? substr($jadwal->jam_mulai, 0, 5) : '') . ' - ' . ($jadwal->jam_selesai ? substr($jadwal->jam_selesai, 0, 5) : ''),
                '{{lab}}' => $jadwal->laboratorium ? $jadwal->laboratorium->nama : '-',
            ];
            
            $imageReplacements = [];
            Log::info("Memulai parsing logic image/text 10 pertemuan...");

            for ($i = 1; $i <= 10; $i++) {
                $p = $pertemuans->get($i);

                if ($p) {
                    $textReplacements["{{tanggal_{$i}}}"] = $p->tanggal->locale('id')->isoFormat('dddd, D MMMM YYYY');
                    $textReplacements["{{topik_{$i}}}"] = $p->topik;
                    $textReplacements["{{status_{$i}}}"] = $p->status ?? '-';
                    $textReplacements["{{hadir_{$i}}}"] = $p->jumlah_hadir ?? '-';
                    $textReplacements["{{tidak_hadir_{$i}}}"] = $p->jumlah_tidak_hadir ?? '-';

                    // Images logic.
                    // Kini kita manfaatkan fitur native publish dari flysystem google drive
                    // yang secara ajaib me-return public hotlink Google Drive. Sehingga BAP akan sukses tergenerate 
                    // dengan gambarnya baik di testing localhost maupun live public server.
                    $fotoData = is_string($p->foto_google_drive_ids) ? json_decode($p->foto_google_drive_ids, true) : $p->foto_google_drive_ids;
                    
                    for ($k = 1; $k <= 3; $k++) {
                        $fotoToken = "{{foto_{$i}_{$k}}}";
                        
                        if (is_array($fotoData) && isset($fotoData["foto_{$k}"])) {
                            $path = $fotoData["foto_{$k}"]['path'];
                            
                            // Kita dapatkan URL preview dari flysystem
                            $previewUrl = Storage::disk('google')->url($path);
                            
                            // Ekstrak ID Google Drive asli dari URL preview (karena path sekarang berisi ekstensi file hasil rename)
                            $fileId = '';
                            if (preg_match('/\/d\/([a-zA-Z0-9_-]+)/', $previewUrl, $matches)) {
                                $fileId = $matches[1];
                            } elseif (preg_match('/id=([a-zA-Z0-9_-]+)/', $previewUrl, $matches)) {
                                $fileId = $matches[1];
                            } else {
                                // Fallback jika regex gagal, tapi sangat jarang terjadi
                                $pathParts = explode('/', $path);
                                $fileId = end($pathParts);
                            }
                            
                            // Gunakan URL format Google Drive yang bisa langsung diakses secara binary oleh Docs API
                            $publicUrl = "https://drive.google.com/uc?export=download&id={$fileId}";
                            Log::info("Foto URL untuk Docs [{$i}][{$k}]: {$publicUrl}");
                            $imageReplacements[$fotoToken] = $publicUrl;
                        } else {
                            $imageReplacements[$fotoToken] = ""; // Hapus token jika kosong
                        }
                    }
                } else {
                    $textReplacements["{{tanggal_{$i}}}"] = '-';
                    $textReplacements["{{topik_{$i}}}"] = '-';
                    $textReplacements["{{status_{$i}}}"] = '-';
                    $textReplacements["{{hadir_{$i}}}"] = '-';
                    $textReplacements["{{tidak_hadir_{$i}}}"] = '-';
                    $imageReplacements["{{foto_{$i}_1}}"] = "";
                    $imageReplacements["{{foto_{$i}_2}}"] = "";
                    $imageReplacements["{{foto_{$i}_3}}"] = "";
                }
            }
            
            Log::info("Mengirim batch update ke Google Docs API...");

            // 3. Eksekusi batch update ke Google Docs
            $docsService->generateBapFromTemplate($newDocumentId, $textReplacements, $imageReplacements);
            Log::info("Batch update Google Docs sukses.");

            // 4. (Optional) Kembalikan file menjadi Private kembali setelah sukses di-inject ke Docs
            // Google Docs API menyimpan embed imagenya secara independen sehingga aman di-privat-kan lagi sesudahnya.
            Log::info("Menutup kembali akses privasi gambar di Google Drive...");
            foreach ($pertemuans as $p) {
                $fotoData = is_string($p->foto_google_drive_ids) ? json_decode($p->foto_google_drive_ids, true) : $p->foto_google_drive_ids;
                if (is_array($fotoData)) {
                    for ($k = 1; $k <= 3; $k++) {
                         if (isset($fotoData["foto_{$k}"])) {
                             Storage::disk('google')->setVisibility($fotoData["foto_{$k}"]['path'], 'private');
                         }
                    }
                }
            }

            return redirect()->back()->with('success', 'BAP berhasil digenerate! Link Docs sudah dibuat.')->with('doc_url', "https://docs.google.com/document/d/{$newDocumentId}/edit");

        } catch (\Exception $e) {
            Log::error('Gagal generate BAP: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal membuat dokumen BAP: ' . $e->getMessage());
        }
    }
}
