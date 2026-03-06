<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationMataKuliah;
use App\Models\Event;
use App\Models\EventMataKuliah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApplicationController extends Controller
{
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
                $emk->kuota_asisten = (int) ceil($emk->kelas->jumlah_mhs / 8);
                $emk->approved_count = ApplicationMataKuliah::where('event_mata_kuliah_id', $emk->id)
                    ->whereHas('application', fn($q) => $q->where('status', 'approved'))
                    ->count();
            });
        });

        return response()->json($events);
    }

    // ─── Mahasiswa: daftar ke event ───────────────────────
    public function apply(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'event_mata_kuliah_ids' => 'required|array|min:1',
            'event_mata_kuliah_ids.*' => 'exists:event_mata_kuliah,id',
        ]);

        $user = Auth::user();
        $event = Event::findOrFail($request->event_id);

        if (!$event->is_open) {
            return response()->json(['message' => 'Pendaftaran event sudah ditutup.'], 422);
        }

        $existingApplication = Application::where('user_id', $user->id)->where('event_id', $event->id)->first();

        // Validasi syarat nilai minimum
        $profile = $user->profile;
        $ipk = $profile ? (float) $profile->nilai_ipk : 0;
        $emkIds = $request->event_mata_kuliah_ids;
        $emks = EventMataKuliah::with('mataKuliah')->whereIn('id', $emkIds)->get();

        foreach ($emks as $emk) {
            $minNilai = (float) $emk->mataKuliah->nilai_minimum;
            if ($minNilai > 0 && $ipk < $minNilai) {
                return response()->json([
                    'message' => "IPK Anda tidak memenuhi syarat minimum {$minNilai} untuk mata kuliah {$emk->mataKuliah->nama}.",
                ], 422);
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
            foreach ($emkIds as $emkId) {
                if (!in_array($emkId, $existingEmkIds)) {
                    ApplicationMataKuliah::create([
                        'application_id' => $application->id,
                        'event_mata_kuliah_id' => $emkId,
                    ]);
                    $added = true;
                }
            }

            if (!$added && $existingApplication) {
                 return response()->json(['message' => 'Anda sudah mendaftar untuk mata kuliah yang dipilih.'], 422);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
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

        return response()->json([
            'data' => $data->items(),
            'meta' => ['total' => $data->total()],
        ]);
    }

    // ─── Admin/Dosen: approve spesifik matkul di aplikasi ───
    public function approveChoice(Request $request, ApplicationMataKuliah $choice)
    {
        $request->validate(['catatan' => 'nullable|string']);

        $choice->update([
            'status' => 'approved',
            'catatan' => $request->catatan,
        ]);

        // Opsional: Update status aplikasi utama jadi 'processed' jika sudah ada keputusan
        $choice->application->update([
            'status' => 'approved', // minimal satu approved, aplikasi dianggap approved? 
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Pilihan mata kuliah disetujui.', 'data' => $choice->load('eventMataKuliah.mataKuliah')]);
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
        $choice->application->update([
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Pilihan mata kuliah ditolak.', 'data' => $choice->load('eventMataKuliah.mataKuliah')]);
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
