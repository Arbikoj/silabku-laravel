<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationMataKuliah;
use App\Models\Event;
use App\Models\EventMataKuliah;
use App\Services\GoogleDocsService;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ApplicationController extends Controller
{
    private function ensureReviewerDocumentAccess(): void
    {
        $user = Auth::user();

        abort_unless($user && in_array($user->role, ['admin', 'dosen'], true), 403);
    }

    private function calculateAssistantQuota(?int $studentCount): int
    {
        return (int) ceil(((int) $studentCount) / 8);
    }

    private function getApprovedChoiceCount(int $eventMataKuliahId, ?int $exceptChoiceId = null): int
    {
        return ApplicationMataKuliah::where('event_mata_kuliah_id', $eventMataKuliahId)
            ->where('status', 'approved')
            ->when($exceptChoiceId, fn($query) => $query->where('id', '!=', $exceptChoiceId))
            ->count();
    }

    private function buildChoiceQuotaData(ApplicationMataKuliah $choice, ?int $exceptChoiceId = null): array
    {
        $choice->loadMissing('eventMataKuliah.kelas');

        $quota = $this->calculateAssistantQuota($choice->eventMataKuliah?->kelas?->jumlah_mhs);
        $approvedCount = $this->getApprovedChoiceCount($choice->event_mata_kuliah_id, $exceptChoiceId);

        return [
            'kuota_asisten' => $quota,
            'approved_count' => $approvedCount,
            'remaining_slots' => max($quota - $approvedCount, 0),
            'is_quota_full' => $approvedCount >= $quota,
        ];
    }

    private function syncApplicationStatus(Application $application): void
    {
        $statuses = $application->applicationMataKuliah()->pluck('status');

        if ($statuses->contains('approved')) {
            $status = 'approved';
        } elseif ($statuses->isNotEmpty() && $statuses->every(fn($item) => $item === 'rejected')) {
            $status = 'rejected';
        } else {
            $status = 'pending';
        }

        $application->update([
            'status' => $status,
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);
    }

    private function moveApprovedAssignmentForSwitch(
        ApplicationMataKuliah $currentChoice,
        int $destinationEventMataKuliahId,
        string $note
    ): void {
        $existingDestinationChoice = ApplicationMataKuliah::where('application_id', $currentChoice->application_id)
            ->where('event_mata_kuliah_id', $destinationEventMataKuliahId)
            ->where('id', '!=', $currentChoice->id)
            ->first();

        if ($existingDestinationChoice) {
            $existingDestinationChoice->update([
                'status' => 'approved',
                'catatan' => $note,
            ]);

            $currentChoice->update([
                'status' => 'pending',
                'catatan' => $note,
            ]);

            return;
        }

        $currentChoice->update([
            'event_mata_kuliah_id' => $destinationEventMataKuliahId,
            'status' => 'approved',
            'catatan' => $note,
        ]);
    }

    // ─── Mahasiswa: lihat semua event terbuka ─────────────
    public function openEvents()
    {
        $events = Event::with(['semester', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas'])
            ->where('is_open', true)
            ->orderByDesc('created_at')
            ->get();

        // Kuota info dan jumlah approved per event_mata_kuliah
        $events->each(function ($event) {
            $event->eventMataKuliah->each(function ($emk) {
                $emk->kuota_asisten = $this->calculateAssistantQuota($emk->kelas->jumlah_mhs);
                $emk->approved_count = $this->getApprovedChoiceCount($emk->id);
                $emk->remaining_slots = max($emk->kuota_asisten - $emk->approved_count, 0);
                $emk->is_quota_full = $emk->approved_count >= $emk->kuota_asisten;
            });
        });

        return response()->json($events);
    }

    // ─── Mahasiswa: daftar ke event ───────────────────────
    public function apply(Request $request, GoogleDocsService $docsService)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'applications' => 'required|array|min:1',
            'applications.*.event_mata_kuliah_id' => 'required|exists:event_mata_kuliah,id',
            'applications.*.nilai_mata_kuliah' => 'required|string|in:A,AB,B,BC,C,D,E',
            'applications.*.sptjm_file' => 'required|file|mimes:pdf|max:5120',
        ]);

        $user = Auth::user();
        $event = Event::with('semester')->findOrFail($request->event_id);

        if (!$event->is_open) {
            return response()->json(['message' => 'Pendaftaran event sudah ditutup.'], 422);
        }

        $existingApplication = Application::where('user_id', $user->id)->where('event_id', $event->id)->first();

        $profile = $user->profile;

        if (!$profile || !$profile->transkrip_gd_id || !$profile->ktm_gd_id || !$profile->norek || !$profile->nama_rek || !$profile->bank || !$profile->no_wa || !$profile->nilai_ipk) {
            return response()->json(['message' => 'Harap lengkapi Profil Anda (KTM, Transkrip, Info Pembayaran, Nomor WhatsApp, dan IPK) terlebih dahulu sebelum mendaftar event.'], 422);
        }

        $applicationsData = $request->applications;
        $emkIds = collect($applicationsData)->pluck('event_mata_kuliah_id')->toArray();
        $emks = EventMataKuliah::with(['mataKuliah', 'kelas'])->whereIn('id', $emkIds)->get()->keyBy('id');

        $gradeValues = ['A' => 4, 'AB' => 3.5, 'B' => 3, 'BC' => 2.5, 'C' => 2, 'D' => 1, 'E' => 0];

        foreach ($applicationsData as $appData) {
            $emk = $emks[$appData['event_mata_kuliah_id']];
            $minNilai = $emk->mataKuliah->nilai_minimum;

            if ($minNilai && isset($gradeValues[$minNilai])) {
                $userGradeValue = $gradeValues[$appData['nilai_mata_kuliah']] ?? -1;
                $requiredGradeValue = $gradeValues[$minNilai];

                if ($userGradeValue < $requiredGradeValue) {
                    return response()->json([
                        'message' => "Nilai Anda ({$appData['nilai_mata_kuliah']}) tidak memenuhi syarat minimum ({$minNilai}) untuk mata kuliah {$emk->mataKuliah->nama}.",
                    ], 422);
                }
            }
        }

        DB::beginTransaction();
        try {
            if ($existingApplication) {
                $application = $existingApplication;
            } else {
                $application = Application::create([
                    'user_id' => $user->id,
                    'event_id' => $event->id,
                    'status' => 'pending',
                ]);
            }

            $existingEmkIds = ApplicationMataKuliah::where('application_id', $application->id)
                ->pluck('event_mata_kuliah_id')
                ->toArray();

            $added = false;
            foreach ($applicationsData as $index => $appData) {
                $emkId = $appData['event_mata_kuliah_id'];
                if (!in_array($emkId, $existingEmkIds)) {
                    $emk = $emks[$emkId];
                    // Upload SPTJM file
                    $file = $request->file("applications.{$index}.sptjm_file");
                    
                    $semesterName = $event->semester ? $event->semester->nama : 'Semester';
                    $eventName = $event->nama;
                    $mkNameForFolder = preg_replace('/[^A-Za-z0-9\- \_]/', '', $emk->mataKuliah->nama);
                    
                    $folderHierarchy = ['Asisten', $semesterName, $eventName, 'SPTJM', $mkNameForFolder];
                    
                    $rootFolderCfg = config('filesystems.disks.google.folderId', env('GOOGLE_DRIVE_FOLDER', 'root'));
                    if ($rootFolderCfg && $rootFolderCfg !== 'root') {
                        if (strlen($rootFolderCfg) < 20) {
                            array_unshift($folderHierarchy, $rootFolderCfg);
                            $rootFolderId = 'root';
                        } else {
                            $rootFolderId = $rootFolderCfg;
                        }
                    } else {
                        $rootFolderId = 'root';
                    }

                    $targetFolderId = $docsService->ensureFolderHierarchyAndGetId($folderHierarchy, $rootFolderId);
                    $filename = "{$emk->kelas->nama}-{$user->nim}-{$user->name}.{$file->extension()}";
                    
                    // Upload menggunakan Service agar hirarki terjaga (terutama jika ada slash di nama folder)
                    $path = $docsService->uploadFileToFolder($file->getRealPath(), $filename, $file->getMimeType(), $targetFolderId);

                    // Set agar file beralamat public (read-only) agar bisa dipreview reviewer
                    try {
                        $permission = new \Google\Service\Drive\Permission([
                            'type' => 'anyone',
                            'role' => 'reader',
                        ]);
                        $docsService->getDriveService()->permissions->create($path, $permission);
                    } catch (\Exception $pe) {
                        \Illuminate\Support\Facades\Log::warning("Gagal set public SPTJM: " . $path);
                    }

                    ApplicationMataKuliah::create([
                        'application_id' => $application->id,
                        'event_mata_kuliah_id' => $emkId,
                        'nilai_mata_kuliah' => $appData['nilai_mata_kuliah'],
                        'sptjm_gd_id' => $path,
                    ]);
                    $added = true;
                }
            }

            if (!$added && $existingApplication) {
                 DB::rollBack();
                 return response()->json(['message' => 'Anda sudah mendaftar untuk mata kuliah yang dipilih.'], 422);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Apply error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal mendaftar, coba lagi.'], 500);
        }

        return response()->json(['message' => 'Berhasil mendaftar!', 'data' => $application->load('applicationMataKuliah.eventMataKuliah.mataKuliah')], 201);
    }

    // ─── Mahasiswa: lihat status pendaftaran saya ────────
    public function myApplications()
    {
        $apps = Application::with([
            'event.semester',
            'applicationMataKuliah.eventMataKuliah.mataKuliah',
            'applicationMataKuliah.eventMataKuliah.kelas',
            'reviewer',
        ])->where('user_id', Auth::id())->orderByDesc('created_at')->get();

        return response()->json($apps);
    }

    public function selectionBoard(Request $request)
    {
        $query = ApplicationMataKuliah::with([
            'application.user.profile',
            'application.event.semester',
            'application.applicationMataKuliah.eventMataKuliah.mataKuliah',
            'application.applicationMataKuliah.eventMataKuliah.kelas',
            'eventMataKuliah.mataKuliah',
            'eventMataKuliah.kelas',
        ]);

        if ($request->event_id) {
            $query->whereHas('application', fn($q) => $q->where('event_id', $request->event_id));
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $search = $request->search;
            $query->whereHas('application.user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('nim', 'like', '%' . $search . '%')
                    ->orWhereHas('profile', fn($profile) => $profile->where('nama_lengkap', 'like', '%' . $search . '%'));
            });
        }

        $choices = $query->get();

        $groups = $choices
            ->groupBy('event_mata_kuliah_id')
            ->map(function ($items) {
                $firstChoice = $items->first();
                $quotaData = $this->buildChoiceQuotaData($firstChoice);
                $event = $firstChoice->application?->event;
                $eventMataKuliah = $firstChoice->eventMataKuliah;

                $candidates = $items
                    ->map(function (ApplicationMataKuliah $choice) use ($quotaData) {
                        $allChoices = $choice->application?->applicationMataKuliah ?? collect();

                        $otherChoices = $allChoices
                            ->where('id', '!=', $choice->id)
                            ->map(function (ApplicationMataKuliah $item) {
                                return [
                                    'id' => $item->id,
                                    'status' => $item->status,
                                    'mata_kuliah' => $item->eventMataKuliah?->mataKuliah?->nama ?? 'N/A',
                                    'kelas' => $item->eventMataKuliah?->kelas?->nama ?? 'N/A',
                                ];
                            })
                            ->values();

                        return [
                            'choice_id' => $choice->id,
                            'application_id' => $choice->application_id,
                            'status' => $choice->status,
                            'catatan' => $choice->catatan,
                            'is_quota_full' => $quotaData['is_quota_full'],
                            'nama_asisten' => $choice->application?->user?->profile?->nama_lengkap ?? $choice->application?->user?->name ?? 'Unknown',
                            'nim' => $choice->application?->user?->nim,
                            'ipk' => $choice->application?->user?->profile?->nilai_ipk,
                            'nilai_mata_kuliah' => $choice->nilai_mata_kuliah,
                            'has_sptjm' => filled($choice->sptjm_gd_id),
                            'has_transkrip' => filled($choice->application?->user?->profile?->transkrip_gd_id),
                            'has_cv' => filled($choice->application?->user?->profile?->cv_gd_id),
                            'no_wa' => $choice->application?->user?->profile?->no_wa,
                            'other_choices' => $otherChoices,
                        ];
                    })
                    ->sortBy([
                        fn(array $item) => match ($item['status']) {
                            'approved' => 0,
                            'pending' => 1,
                            'rejected' => 2,
                            default => 3,
                        },
                        ['nama_asisten', 'asc'],
                    ])
                    ->values();

                return [
                    'event_mata_kuliah_id' => $firstChoice->event_mata_kuliah_id,
                    'event' => [
                        'id' => $event?->id,
                        'nama' => $event?->nama,
                        'semester' => $event?->semester?->nama,
                    ],
                    'mata_kuliah' => $eventMataKuliah?->mataKuliah?->nama ?? 'N/A',
                    'kelas' => $eventMataKuliah?->kelas?->nama ?? 'N/A',
                    'kuota_asisten' => $quotaData['kuota_asisten'],
                    'approved_count' => $quotaData['approved_count'],
                    'remaining_slots' => $quotaData['remaining_slots'],
                    'is_quota_full' => $quotaData['is_quota_full'],
                    'candidates' => $candidates,
                ];
            })
            ->sortBy([
                fn(array $item) => strtolower($item['event']['nama'] ?? ''),
                fn(array $item) => strtolower($item['mata_kuliah']),
                fn(array $item) => strtolower($item['kelas']),
            ])
            ->values();

        return response()->json([
            'data' => $groups,
            'meta' => [
                'total_groups' => $groups->count(),
                'total_choices' => $choices->count(),
            ],
        ]);
    }

    public function reviewerChoiceSptjm(ApplicationMataKuliah $choice)
    {
        $this->ensureReviewerDocumentAccess();

        if (!$choice->sptjm_gd_id) {
            abort(404, 'SPTJM tidak ditemukan');
        }

        return Storage::disk('google')->response($choice->sptjm_gd_id);
    }

    public function reviewerChoiceTranscript(ApplicationMataKuliah $choice)
    {
        $this->ensureReviewerDocumentAccess();

        $choice->loadMissing('application.user.profile');
        $transkripPath = $choice->application?->user?->profile?->transkrip_gd_id;

        if (!$transkripPath) {
            abort(404, 'Transkrip tidak ditemukan');
        }

        return Storage::disk('google')->response($transkripPath);
    }

    public function reviewerChoiceCv(ApplicationMataKuliah $choice)
    {
        $this->ensureReviewerDocumentAccess();

        $choice->loadMissing('application.user.profile');
        $cvPath = $choice->application?->user?->profile?->cv_gd_id;

        if (!$cvPath) {
            abort(404, 'CV tidak ditemukan');
        }

        return Storage::disk('google')->response($cvPath);
    }

    // ─── Admin/Dosen: list semua aplikasi ────────────────
    public function index(Request $request)
    {
        $query = Application::with([
            'user.profile',
            'event.semester',
            'applicationMataKuliah.eventMataKuliah.mataKuliah',
            'applicationMataKuliah.eventMataKuliah.kelas',
            'reviewer',
        ]);

        if ($request->event_id) {
            $query->where('event_id', $request->event_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $query->whereHas('user', fn($q) => $q->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('nim', 'like', '%' . $request->search . '%'));
        }

        $perPage = $request->per_page ?? 20;
        $data = $query->orderByDesc('created_at')->paginate($perPage);

        $items = collect($data->items())->map(function (Application $application) {
            $application->applicationMataKuliah->each(function (ApplicationMataKuliah $choice) {
                $quotaData = $this->buildChoiceQuotaData(
                    $choice,
                    $choice->status === 'approved' ? $choice->id : null
                );

                $choice->setAttribute('kuota_asisten', $quotaData['kuota_asisten']);
                $choice->setAttribute('approved_count', $quotaData['approved_count']);
                $choice->setAttribute('remaining_slots', $quotaData['remaining_slots']);
                $choice->setAttribute('is_quota_full', $quotaData['is_quota_full']);
            });

            return $application;
        });

        return response()->json([
            'data' => $items,
            'meta' => ['total' => $data->total()],
        ]);
    }

    // ─── Admin/Dosen: approve spesifik matkul di aplikasi ───
    public function approveChoice(Request $request, ApplicationMataKuliah $choice)
    {
        $request->validate(['catatan' => 'nullable|string']);

        try {
            DB::transaction(function () use ($choice, $request) {
                $choice->load('application', 'eventMataKuliah.kelas', 'eventMataKuliah.mataKuliah');

                if ($choice->status !== 'approved') {
                    $quotaData = $this->buildChoiceQuotaData($choice);

                    if ($quotaData['is_quota_full']) {
                        $mataKuliah = $choice->eventMataKuliah?->mataKuliah?->nama ?? 'mata kuliah ini';
                        $kelas = $choice->eventMataKuliah?->kelas?->nama ?? '-';

                        throw new HttpResponseException(response()->json([
                            'message' => "Kuota asisten untuk {$mataKuliah} kelas {$kelas} sudah penuh ({$quotaData['approved_count']}/{$quotaData['kuota_asisten']}).",
                            'quota' => $quotaData,
                        ], 422));
                    }
                }

                $choice->update([
                    'status' => 'approved',
                    'catatan' => $request->catatan,
                ]);

                $this->syncApplicationStatus($choice->application);
            });
        } catch (HttpResponseException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Gagal menyetujui pilihan mata kuliah.'], 500);
        }

        $choice->refresh()->load('eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas');
        $quotaData = $this->buildChoiceQuotaData($choice, $choice->id);

        return response()->json([
            'message' => 'Pilihan mata kuliah disetujui.',
            'data' => array_merge($choice->toArray(), $quotaData),
        ]);
    }

    // ─── Admin/Dosen: reject spesifik matkul di aplikasi ────
    public function rejectChoice(Request $request, ApplicationMataKuliah $choice)
    {
        $request->validate(['catatan' => 'nullable|string']);

        $choice->update([
            'status' => 'rejected',
            'catatan' => $request->catatan,
        ]);

        // Jika semua choice rejected, baru aplikasi utama rejected?
        // Untuk simpelnya, kita tetap update reviewed_by di aplikasi utama
        $this->syncApplicationStatus($choice->application);

        return response()->json(['message' => 'Pilihan mata kuliah ditolak.', 'data' => $choice->load('eventMataKuliah.mataKuliah')]);
    }

    public function switchOptions(ApplicationMataKuliah $choice)
    {
        $choice->load([
            'application.event',
            'eventMataKuliah.mataKuliah',
            'eventMataKuliah.kelas',
        ]);

        $options = ApplicationMataKuliah::with([
            'application.user.profile',
            'eventMataKuliah.mataKuliah',
            'eventMataKuliah.kelas',
        ])
            ->where('id', '!=', $choice->id)
            ->where('status', 'approved')
            ->whereHas('application', fn($q) => $q->where('event_id', $choice->application->event_id))
            ->orderByDesc('updated_at')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'event_mata_kuliah_id' => $item->event_mata_kuliah_id,
                    'mata_kuliah' => $item->eventMataKuliah?->mataKuliah?->nama ?? 'N/A',
                    'kelas' => $item->eventMataKuliah?->kelas?->nama ?? 'N/A',
                    'nama_asisten' => $item->application?->user?->profile?->nama_lengkap ?? $item->application?->user?->name ?? 'Unknown',
                    'nim' => $item->application?->user?->nim,
                ];
            });

        return response()->json(['data' => $options]);
    }

    public function replacementCandidates(Request $request, ApplicationMataKuliah $choice)
    {
        $choice->load([
            'application.event',
            'eventMataKuliah.mataKuliah',
            'eventMataKuliah.kelas',
        ]);

        $query = ApplicationMataKuliah::with([
            'application.user.profile',
            'eventMataKuliah.mataKuliah',
            'eventMataKuliah.kelas',
        ])
            ->where('id', '!=', $choice->id)
            ->where('event_mata_kuliah_id', $choice->event_mata_kuliah_id)
            ->whereIn('status', ['pending', 'rejected'])
            ->whereHas('application', fn($q) => $q->where('event_id', $choice->application->event_id));

        if ($request->search) {
            $search = $request->search;
            $query->whereHas('application.user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('nim', 'like', '%' . $search . '%')
                    ->orWhereHas('profile', fn($profile) => $profile->where('nama_lengkap', 'like', '%' . $search . '%'));
            });
        }

        $candidates = $query->orderByDesc('updated_at')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'application_id' => $item->application_id,
                'status' => $item->status,
                'nama_asisten' => $item->application?->user?->profile?->nama_lengkap ?? $item->application?->user?->name ?? 'Unknown',
                'nim' => $item->application?->user?->nim,
                'ipk' => $item->application?->user?->profile?->nilai_ipk,
                'nilai_mata_kuliah' => $item->nilai_mata_kuliah,
                'sptjm_gd_id' => $item->sptjm_gd_id,
                'mata_kuliah' => $item->eventMataKuliah?->mataKuliah?->nama ?? 'N/A',
                'kelas' => $item->eventMataKuliah?->kelas?->nama ?? 'N/A',
            ];
        });

        return response()->json(['data' => $candidates]);
    }

    public function switchChoice(Request $request, ApplicationMataKuliah $choice)
    {
        $request->validate([
            'target_choice_id' => 'required|exists:application_mata_kuliah,id',
        ]);

        $choice->load('application.event', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas');
        $target = ApplicationMataKuliah::with('application.event', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas')
            ->findOrFail($request->target_choice_id);

        if ($choice->status !== 'approved' || $target->status !== 'approved') {
            return response()->json(['message' => 'Hanya penugasan approved yang dapat ditukar.'], 422);
        }

        if ($choice->application->event_id !== $target->application->event_id) {
            return response()->json(['message' => 'Switch hanya bisa dilakukan dalam event yang sama.'], 422);
        }

        if ($choice->application_id === $target->application_id) {
            return response()->json([
                'message' => 'Switch tidak dapat dilakukan pada pilihan milik aplikasi yang sama.',
            ], 422);
        }

        try {
            DB::transaction(function () use ($choice, $target) {
                $currentEventMataKuliahId = $choice->event_mata_kuliah_id;
                $targetEventMataKuliahId = $target->event_mata_kuliah_id;
                $timestamp = now()->format('Y-m-d H:i:s');

                $choiceNote = 'Dipindahkan melalui switch admin pada ' . $timestamp;
                $targetNote = 'Dipindahkan melalui switch admin pada ' . $timestamp;

                $this->moveApprovedAssignmentForSwitch($choice, $targetEventMataKuliahId, $choiceNote);
                $this->moveApprovedAssignmentForSwitch($target, $currentEventMataKuliahId, $targetNote);
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Switch gagal diproses. Silakan coba lagi atau cek apakah data pilihan asisten bentrok.',
            ], 422);
        }

        return response()->json(['message' => 'Penugasan asisten berhasil ditukar.']);
    }

    public function replaceApprovedChoice(Request $request, ApplicationMataKuliah $choice)
    {
        $request->validate([
            'replacement_choice_id' => 'required|exists:application_mata_kuliah,id',
            'catatan' => 'nullable|string',
        ]);

        $choice->load('application.event', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas');
        $replacement = ApplicationMataKuliah::with('application.event', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas')
            ->findOrFail($request->replacement_choice_id);

        if ($choice->status !== 'approved') {
            return response()->json(['message' => 'Hanya penugasan approved yang dapat diganti.'], 422);
        }

        if ($choice->application->event_id !== $replacement->application->event_id) {
            return response()->json(['message' => 'Pengganti harus berasal dari event yang sama.'], 422);
        }

        if ($choice->event_mata_kuliah_id !== $replacement->event_mata_kuliah_id) {
            return response()->json(['message' => 'Pengganti harus berasal dari mata kuliah dan kelas yang sama.'], 422);
        }

        if ($replacement->status === 'approved') {
            return response()->json(['message' => 'Kandidat pengganti tersebut sudah approved.'], 422);
        }

        DB::transaction(function () use ($choice, $replacement, $request) {
            $note = $request->catatan ?: 'Pergantian asisten oleh admin pada ' . now()->format('Y-m-d H:i:s');

            $choice->update([
                'status' => 'rejected',
                'catatan' => $note,
            ]);

            $replacement->update([
                'status' => 'approved',
                'catatan' => $note,
            ]);

            $this->syncApplicationStatus($choice->application);
            $this->syncApplicationStatus($replacement->application);
        });

        return response()->json(['message' => 'Asisten berhasil diganti.']);
    }

    // ─── Admin: ganti asisten (update user_id di application) ─
    public function replaceApplicant(Request $request, Application $application)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        if ($application->status !== 'approved') {
            return response()->json(['message' => 'Hanya aplikasi yang sudah disetujui yang bisa diganti.'], 422);
        }

        // Pastikan user baru belum mendaftar event yang sama
        $exists = Application::where('user_id', $request->user_id)
            ->where('event_id', $application->event_id)
            ->where('id', '!=', $application->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Mahasiswa tersebut sudah terdaftar di event ini.'], 422);
        }

        $application->update(['user_id' => $request->user_id]);

        return response()->json(['message' => 'Asisten berhasil diganti.', 'data' => $application->load('user.profile')]);
    }

    // ─── Database asisten unik (grouped by user) ──────────
    public function databaseUnique(Request $request)
    {
        // Query user_id unik yang pernah approved
        $query = \App\Models\User::whereHas('applications.applicationMataKuliah', fn($q) => $q->where('status', 'approved'))
            ->with(['profile']);

        if ($request->search) {
            $search = $request->search;
            $query->where(fn($q) => $q
                ->where('name', 'like', '%' . $search . '%')
                ->orWhere('nim', 'like', '%' . $search . '%')
                ->orWhereHas('profile', fn($p) => $p->where('nama_lengkap', 'like', '%' . $search . '%'))
            );
        }

        $perPage = $request->per_page ?? 20;
        $paginated = $query->orderBy('name')->paginate($perPage);

        // Untuk setiap user, ambil semua approved assignment-nya
        $items = collect($paginated->items())->map(function ($user) {
            $approvedChoices = \App\Models\ApplicationMataKuliah::with([
                    'application.event.semester',
                    'eventMataKuliah.mataKuliah',
                    'eventMataKuliah.kelas',
                ])
                ->where('status', 'approved')
                ->whereHas('application', fn($q) => $q->where('user_id', $user->id))
                ->get()
                ->map(fn($amk) => [
                    'choice_id'   => $amk->id,
                    'event_id'    => $amk->application?->event?->id,
                    'event_nama'  => $amk->application?->event?->nama ?? 'N/A',
                    'event_tipe'  => $amk->application?->event?->tipe ?? '-',
                    'semester'    => $amk->application?->event?->semester?->nama ?? '-',
                    'mata_kuliah' => $amk->eventMataKuliah?->mataKuliah?->nama ?? 'N/A',
                    'kelas'       => $amk->eventMataKuliah?->kelas?->nama ?? 'N/A',
                ]);

            return [
                'user_id'      => $user->id,
                'nim'          => $user->nim,
                'nama'         => $user->profile?->nama_lengkap ?? $user->name,
                'nilai_ipk'    => $user->profile?->nilai_ipk,
                'foto'         => $user->profile?->foto,
                'total_event'  => $approvedChoices->pluck('event_id')->unique()->count(),
                'assignments'  => $approvedChoices->values(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'total'        => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
        ]);
    }

    // ─── Database semua asisten approved ─────────────────
    public function database(Request $request)
    {
        // Database asisten ditarik dari pivot table yang statusnya approved
        $query = ApplicationMataKuliah::with([
            'application.user.profile',
            'application.event.semester',
            'eventMataKuliah.mataKuliah',
            'eventMataKuliah.kelas',
        ])->where('status', 'approved');

        if ($request->event_id) {
            $query->whereHas('application', fn($q) => $q->where('event_id', $request->event_id));
        }
        if ($request->semester_id) {
            $query->whereHas('application.event', fn($q) => $q->where('semester_id', $request->semester_id));
        }
        if ($request->tipe) {
            $query->whereHas('application.event', fn($q) => $q->where('tipe', $request->tipe));
        }
        if ($request->search) {
            $query->whereHas('application.user', fn($q) => $q->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('nim', 'like', '%' . $request->search . '%')
                ->orWhereHas('profile', fn($p) => $p->where('nama_lengkap', 'like', '%' . $request->search . '%')));
        }

        $perPage = $request->per_page ?? 20;
        $data = $query->orderByDesc('updated_at')->paginate($perPage);

        return response()->json([
            'data' => $data->items(),
            'meta' => [
                'total' => $data->total(),
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem()
            ],
        ]);
    }
}
