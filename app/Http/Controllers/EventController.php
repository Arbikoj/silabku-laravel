<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventMataKuliah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['semester', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas']);

        if ($request->search) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }
        if ($request->tipe) {
            $query->where('tipe', $request->tipe);
        }
        if ($request->semester_id) {
            $query->where('semester_id', $request->semester_id);
        }

        $perPage = $request->per_page ?? 10;
        $data = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'data' => $data->items(),
            'meta' => ['total' => $data->total()],
        ]);
    }

    public function show(Event $event)
    {
        $event->load([
            'semester',
            'eventMataKuliah' => fn($query) => $query
                ->with(['mataKuliah', 'kelas'])
                ->withCount([
                    'applicationMataKuliah as approved_assistant_count' => fn($q) => $q->where('status', 'approved'),
                ]),
        ]);

        $event->eventMataKuliah->each(function ($item) {
            $quota = (int) ceil(((int) $item->kelas?->jumlah_mhs) / 8);
            $item->setAttribute('kuota_asisten', $quota);
            $item->setAttribute('remaining_quota', max($quota - (int) $item->approved_assistant_count, 0));
            $item->setAttribute('is_quota_full', (int) $item->approved_assistant_count >= $quota);
        });

        // Ambil list asisten yang sudah disetujui untuk event ini
        $approvedAssistants = \App\Models\ApplicationMataKuliah::whereHas('application', function($q) use ($event) {
                $q->where('event_id', $event->id);
            })
            ->where('status', 'approved')
            ->with(['application.user.profile', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas'])
            ->get()
            ->map(function($amk) {
                return [
                    'id' => $amk->id,
                    'application_id' => $amk->application_id,
                    'event_mata_kuliah_id' => $amk->event_mata_kuliah_id,
                    'mata_kuliah' => $amk->eventMataKuliah?->mataKuliah?->nama ?? 'N/A',
                    'kelas' => $amk->eventMataKuliah?->kelas?->nama ?? 'N/A',
                    'nama_asisten' => $amk->application?->user?->profile?->nama_lengkap ?? $amk->application?->user?->name ?? 'Unknown',
                    'nim' => $amk->application?->user?->nim,
                    'ipk' => $amk->application?->user?->profile?->nilai_ipk,
                    'nilai_mata_kuliah' => $amk->nilai_mata_kuliah,
                    'sptjm_gd_id' => $amk->sptjm_gd_id,
                ];
            });

        // Ambil aplikasi user saat ini jika sudah mendaftar
        $userApplication = null;
        if (Auth::guard('sanctum')->check()) {
            $userApplication = \App\Models\Application::with('applicationMataKuliah')
                ->where('user_id', Auth::guard('sanctum')->id())
                ->where('event_id', $event->id)
                ->first();
        }

        return response()->json([
            'event' => $event,
            'approved_assistants' => $approvedAssistants,
            'user_application' => $userApplication
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'tipe' => 'required|in:praktikum,tutorial',
            'semester_id' => 'required|exists:semesters,id',
            'is_open' => 'boolean',
            'tanggal_buka' => 'nullable|date',
            'tanggal_tutup' => 'nullable|date|after_or_equal:tanggal_buka',
            'deskripsi' => 'nullable|string',
            'mata_kuliah' => 'nullable|array',
            'mata_kuliah.*.mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'mata_kuliah.*.kelas_id' => 'required|exists:kelas,id',
        ]);

        $event = Event::create($request->only(['nama', 'tipe', 'semester_id', 'is_open', 'tanggal_buka', 'tanggal_tutup', 'deskripsi']));

        if ($request->mata_kuliah) {
            foreach ($request->mata_kuliah as $mk) {
                EventMataKuliah::create([
                    'event_id' => $event->id,
                    'mata_kuliah_id' => $mk['mata_kuliah_id'],
                    'kelas_id' => $mk['kelas_id'],
                ]);
            }
        }

        return response()->json(['message' => 'Event berhasil dibuat', 'data' => $event->load(['semester', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas'])], 201);
    }

    public function update(Request $request, Event $event)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'tipe' => 'required|in:praktikum,tutorial',
            'semester_id' => 'required|exists:semesters,id',
            'is_open' => 'boolean',
            'tanggal_buka' => 'nullable|date',
            'tanggal_tutup' => 'nullable|date|after_or_equal:tanggal_buka',
            'deskripsi' => 'nullable|string',
            'mata_kuliah' => 'nullable|array',
            'mata_kuliah.*.mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'mata_kuliah.*.kelas_id' => 'required|exists:kelas,id',
        ]);

        $event->update($request->only(['nama', 'tipe', 'semester_id', 'is_open', 'tanggal_buka', 'tanggal_tutup', 'deskripsi']));

        if ($request->has('mata_kuliah')) {
            $newMK = $request->mata_kuliah;
            $currentMK = $event->eventMataKuliah;

            // Hapus yang tidak ada di request baru
            foreach ($currentMK as $existing) {
                $stillExists = collect($newMK)->contains(function($item) use ($existing) {
                    return $item['mata_kuliah_id'] == $existing->mata_kuliah_id && $item['kelas_id'] == $existing->kelas_id;
                });
                if (!$stillExists) {
                    $approvedCount = $existing->applicationMataKuliah()->where('status', 'approved')->count();
                    if ($approvedCount > 0) {
                        return response()->json([
                            'message' => "Mata kuliah {$existing->mataKuliah?->nama} kelas {$existing->kelas?->nama} tidak bisa dihapus karena masih memiliki asisten terpilih.",
                        ], 422);
                    }

                    $existing->delete();
                }
            }

            // Tambahkan yang belum ada
            foreach ($newMK as $item) {
                $alreadyExists = $currentMK->contains(function($existing) use ($item) {
                    return $item['mata_kuliah_id'] == $existing->mata_kuliah_id && $item['kelas_id'] == $existing->kelas_id;
                });
                if (!$alreadyExists) {
                    EventMataKuliah::create([
                        'event_id' => $event->id,
                        'mata_kuliah_id' => $item['mata_kuliah_id'],
                        'kelas_id' => $item['kelas_id'],
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Event berhasil diperbarui', 'data' => $event->load(['semester', 'eventMataKuliah.mataKuliah', 'eventMataKuliah.kelas'])]);
    }

    public function toggleOpen(Event $event)
    {
        $event->update(['is_open' => !$event->is_open]);
        $status = $event->is_open ? 'dibuka' : 'ditutup';
        return response()->json(['message' => "Pendaftaran event berhasil {$status}", 'data' => $event]);
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return response()->json(['message' => 'Event berhasil dihapus']);
    }
}
