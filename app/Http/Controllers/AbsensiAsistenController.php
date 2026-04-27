<?php

namespace App\Http\Controllers;

use App\Models\AbsensiAsistenPertemuan;
use App\Models\ApplicationMataKuliah;
use App\Models\MataKuliah;
use Illuminate\Http\Request;

class AbsensiAsistenController extends Controller
{
    /**
     * List attendance grid for approved assistants in an Event + Mata Kuliah.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'nullable|exists:events,id',
            'mata_kuliah_id' => 'nullable|exists:mata_kuliah,id',
            'search' => 'nullable|string',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:200',
        ]);

        if (empty($validated['event_id']) || empty($validated['mata_kuliah_id'])) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => null,
                    'to' => null,
                ],
                'pertemuan_max' => 0,
            ]);
        }

        $mataKuliah = MataKuliah::findOrFail($validated['mata_kuliah_id']);
        $pertemuanMax = (int) ($mataKuliah->pertemuan_praktikum ?? 10);

        $query = ApplicationMataKuliah::query()
            ->select('application_mata_kuliah.*')
            ->join('applications', 'applications.id', '=', 'application_mata_kuliah.application_id')
            ->join('users', 'users.id', '=', 'applications.user_id')
            ->leftJoin('profiles', 'profiles.user_id', '=', 'users.id')
            ->join('event_mata_kuliah', 'event_mata_kuliah.id', '=', 'application_mata_kuliah.event_mata_kuliah_id')
            ->join('kelas', 'kelas.id', '=', 'event_mata_kuliah.kelas_id')
            ->where('application_mata_kuliah.status', 'approved')
            ->where('applications.event_id', $validated['event_id'])
            ->where('event_mata_kuliah.mata_kuliah_id', $validated['mata_kuliah_id'])
            ->with([
                'application.user.profile',
                'application.event.semester',
                'eventMataKuliah.mataKuliah',
                'eventMataKuliah.kelas',
            ]);

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', '%' . $search . '%')
                    ->orWhere('users.nim', 'like', '%' . $search . '%')
                    ->orWhere('profiles.nama_lengkap', 'like', '%' . $search . '%');
            });
        }

        $perPage = $validated['per_page'] ?? 20;
        $paginated = $query
            ->orderByRaw("COALESCE(profiles.nama_lengkap, users.name) ASC")
            ->orderBy('kelas.nama', 'ASC')
            ->orderBy('users.nim', 'ASC')
            ->paginate($perPage);

        $amkIds = collect($paginated->items())->pluck('id')->filter()->values();
        $attendanceByAmkId = AbsensiAsistenPertemuan::whereIn('application_mata_kuliah_id', $amkIds)
            ->get()
            ->groupBy('application_mata_kuliah_id');

        $items = collect($paginated->items())->map(function ($amk) use ($attendanceByAmkId) {
            $attendance = [];
            foreach (($attendanceByAmkId[$amk->id] ?? collect()) as $row) {
                $attendance[(int) $row->pertemuan_ke] = true;
            }

            $amkArray = $amk->toArray();
            $amkArray['attendance'] = $attendance;
            return $amkArray;
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'total' => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ],
            'pertemuan_max' => $pertemuanMax,
        ]);
    }

    /**
     * Toggle a single attendance cell.
     */
    public function setAttendance(Request $request)
    {
        $validated = $request->validate([
            'application_mata_kuliah_id' => 'required|exists:application_mata_kuliah,id',
            'pertemuan_ke' => 'required|integer|min:1',
            'hadir' => 'required|boolean',
        ]);

        $amk = ApplicationMataKuliah::with('eventMataKuliah.mataKuliah')->findOrFail($validated['application_mata_kuliah_id']);
        if ($amk->status !== 'approved') {
            return response()->json(['message' => 'Absensi hanya dapat diisi untuk asisten yang approved.'], 422);
        }

        $maxPertemuan = (int) ($amk->eventMataKuliah?->mataKuliah?->pertemuan_praktikum ?? 10);
        if ((int) $validated['pertemuan_ke'] > $maxPertemuan) {
            return response()->json(['message' => "Pertemuan tidak boleh lebih dari {$maxPertemuan}."], 422);
        }

        if ($validated['hadir']) {
            AbsensiAsistenPertemuan::updateOrCreate(
                [
                    'application_mata_kuliah_id' => $amk->id,
                    'pertemuan_ke' => (int) $validated['pertemuan_ke'],
                ],
                []
            );
        } else {
            AbsensiAsistenPertemuan::where('application_mata_kuliah_id', $amk->id)
                ->where('pertemuan_ke', (int) $validated['pertemuan_ke'])
                ->delete();
        }

        return response()->json(['message' => 'Absensi tersimpan.']);
    }
}
