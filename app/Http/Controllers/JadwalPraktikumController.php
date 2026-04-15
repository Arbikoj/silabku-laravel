<?php

namespace App\Http\Controllers;

use App\Models\JadwalPraktikum;
use Illuminate\Http\Request;

class JadwalPraktikumController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'laboratorium_id' => 'required|exists:laboratoriums,id',
            'semester_id' => 'required|exists:semesters,id',
        ]);

        $schedules = JadwalPraktikum::with(['kelas.mataKuliah', 'mataKuliah'])
            ->where('laboratorium_id', $request->laboratorium_id)
            ->where('semester_id', $request->semester_id)
            ->get();

        return response()->json($schedules);
    }

    public function store(Request $request)
    {
        $request->validate([
            'laboratorium_id' => 'required|exists:laboratoriums,id',
            'semester_id' => 'required|exists:semesters,id',
            'kelas_id' => 'required|exists:kelas,id',
            'hari' => 'required|string',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'keterangan' => 'nullable|string',
        ]);

        $kelas = \App\Models\Kelas::findOrFail($request->kelas_id);
        
        // Cek bentrok
        $conflict = JadwalPraktikum::where('laboratorium_id', $request->laboratorium_id)
            ->where('semester_id', $request->semester_id)
            ->where('hari', $request->hari)
            ->where(function ($query) use ($request) {
                $query->where('jam_mulai', '<', $request->jam_selesai)
                      ->where('jam_selesai', '>', $request->jam_mulai);
            })->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Jadwal bentrok dengan mata kuliah lain di laboratorium ini.',
                'errors' => ['jam_mulai' => ['Waktu ini sudah ditempati kelas lain.']]
            ], 422);
        }

        $data = $request->all();
        $data['mata_kuliah_id'] = $kelas->mata_kuliah_id;

        $schedule = JadwalPraktikum::create($data);

        return response()->json([
            'message' => 'Jadwal berhasil ditambahkan',
            'data' => $schedule->load(['kelas.mataKuliah', 'mataKuliah'])
        ], 201);
    }

    public function update(Request $request, JadwalPraktikum $jadwalPraktikum)
    {
        $request->validate([
            'kelas_id' => 'required|exists:kelas,id',
            'hari' => 'required|string',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'keterangan' => 'nullable|string',
        ]);

        $kelas = \App\Models\Kelas::findOrFail($request->kelas_id);
        
        // Cek bentrok
        $conflict = JadwalPraktikum::where('laboratorium_id', $jadwalPraktikum->laboratorium_id)
            ->where('semester_id', $jadwalPraktikum->semester_id)
            ->where('hari', $request->hari)
            ->where('id', '!=', $jadwalPraktikum->id)
            ->where(function ($query) use ($request) {
                $query->where('jam_mulai', '<', $request->jam_selesai)
                      ->where('jam_selesai', '>', $request->jam_mulai);
            })->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Jadwal bentrok dengan mata kuliah lain di laboratorium ini.',
                'errors' => ['jam_mulai' => ['Waktu ini sudah ditempati kelas lain.']]
            ], 422);
        }

        $data = $request->all();
        $data['mata_kuliah_id'] = $kelas->mata_kuliah_id;

        $jadwalPraktikum->update($data);

        return response()->json([
            'message' => 'Jadwal berhasil diperbarui',
            'data' => $jadwalPraktikum->load(['kelas.mataKuliah', 'mataKuliah'])
        ]);
    }

    public function destroy(JadwalPraktikum $jadwalPraktikum)
    {
        $jadwalPraktikum->delete();
        return response()->json(['message' => 'Jadwal berhasil dihapus']);
    }
}
