<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\JadwalPraktikum;
use Illuminate\Http\Request;

class KegiatanController extends Controller
{
    private $daysMap = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
    ];

    public function index(Request $request)
    {
        $query = Kegiatan::with('laboratorium');

        if ($request->has('laboratorium_id') && $request->laboratorium_id) {
            $query->where('laboratorium_id', $request->laboratorium_id);
        }

        if ($request->has('month') && $request->has('year')) {
            $query->whereMonth('tanggal', $request->month)
                  ->whereYear('tanggal', $request->year);
        }

        $kegiatans = $query->orderBy('tanggal')->orderBy('jam_mulai')->get();
        return response()->json($kegiatans);
    }

    public function publicIndex(Request $request)
    {
        return $this->index($request);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kegiatan' => 'required|string|max:255',
            'tanggal' => 'required|date_format:Y-m-d',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'laboratorium_id' => 'nullable|exists:laboratoriums,id',
            'keterangan' => 'nullable|string',
        ]);

        $englishDay = date('l', strtotime($request->tanggal));
        $indonesianDay = $this->daysMap[$englishDay] ?? $englishDay;

        if ($request->filled('laboratorium_id')) {
            // 1. Cek bentrok dengan jadwal praktikum rutin
            $conflictSchedule = JadwalPraktikum::with(['kelas.mataKuliah', 'mataKuliah'])
                ->where('laboratorium_id', $request->laboratorium_id)
                ->where('hari', $indonesianDay)
                ->where(function ($query) use ($request) {
                    $query->where('jam_mulai', '<', $request->jam_selesai)
                          ->where('jam_selesai', '>', $request->jam_mulai);
                })
                ->first();

            if ($conflictSchedule) {
                $courseName = $conflictSchedule->mataKuliah->nama ?? ($conflictSchedule->kelas->mataKuliah->nama ?? 'Praktikum');
                return response()->json([
                    'message' => "Waktu bentrok dengan praktikum rutin: {$courseName} ({$conflictSchedule->jam_mulai} - {$conflictSchedule->jam_selesai}) di laboratorium ini.",
                    'errors' => ['jam_mulai' => ['Waktu ini bentrok dengan praktikum rutin.']]
                ], 422);
            }

            // 2. Cek bentrok dengan kegiatan insidental lain
            $conflictKegiatan = Kegiatan::where('laboratorium_id', $request->laboratorium_id)
                ->where('tanggal', $request->tanggal)
                ->where(function ($query) use ($request) {
                    $query->where('jam_mulai', '<', $request->jam_selesai)
                          ->where('jam_selesai', '>', $request->jam_mulai);
                })
                ->first();

            if ($conflictKegiatan) {
                return response()->json([
                    'message' => "Waktu bentrok dengan kegiatan lain: {$conflictKegiatan->nama_kegiatan} ({$conflictKegiatan->jam_mulai} - {$conflictKegiatan->jam_selesai}) di laboratorium ini.",
                    'errors' => ['jam_mulai' => ['Waktu ini bentrok dengan kegiatan lain.']]
                ], 422);
            }
        }

        $data = $request->all();
        $data['hari'] = $indonesianDay;

        $kegiatan = Kegiatan::create($data);

        return response()->json([
            'message' => 'Kegiatan berhasil ditambahkan',
            'data' => $kegiatan->load('laboratorium')
        ], 201);
    }

    public function update(Request $request, Kegiatan $kegiatan)
    {
        $request->validate([
            'nama_kegiatan' => 'required|string|max:255',
            'tanggal' => 'required|date_format:Y-m-d',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'laboratorium_id' => 'nullable|exists:laboratoriums,id',
            'keterangan' => 'nullable|string',
        ]);

        $englishDay = date('l', strtotime($request->tanggal));
        $indonesianDay = $this->daysMap[$englishDay] ?? $englishDay;

        if ($request->filled('laboratorium_id')) {
            // 1. Cek bentrok dengan jadwal praktikum rutin
            $conflictSchedule = JadwalPraktikum::with(['kelas.mataKuliah', 'mataKuliah'])
                ->where('laboratorium_id', $request->laboratorium_id)
                ->where('hari', $indonesianDay)
                ->where(function ($query) use ($request) {
                    $query->where('jam_mulai', '<', $request->jam_selesai)
                          ->where('jam_selesai', '>', $request->jam_mulai);
                })
                ->first();

            if ($conflictSchedule) {
                $courseName = $conflictSchedule->mataKuliah->nama ?? ($conflictSchedule->kelas->mataKuliah->nama ?? 'Praktikum');
                return response()->json([
                    'message' => "Waktu bentrok dengan praktikum rutin: {$courseName} ({$conflictSchedule->jam_mulai} - {$conflictSchedule->jam_selesai}) di laboratorium ini.",
                    'errors' => ['jam_mulai' => ['Waktu ini bentrok dengan praktikum rutin.']]
                ], 422);
            }

            // 2. Cek bentrok dengan kegiatan insidental lain
            $conflictKegiatan = Kegiatan::where('laboratorium_id', $request->laboratorium_id)
                ->where('tanggal', $request->tanggal)
                ->where('id', '!=', $kegiatan->id)
                ->where(function ($query) use ($request) {
                    $query->where('jam_mulai', '<', $request->jam_selesai)
                          ->where('jam_selesai', '>', $request->jam_mulai);
                })
                ->first();

            if ($conflictKegiatan) {
                return response()->json([
                    'message' => "Waktu bentrok dengan kegiatan lain: {$conflictKegiatan->nama_kegiatan} ({$conflictKegiatan->jam_mulai} - {$conflictKegiatan->jam_selesai}) di laboratorium ini.",
                    'errors' => ['jam_mulai' => ['Waktu ini bentrok dengan kegiatan lain.']]
                ], 422);
            }
        }

        $data = $request->all();
        $data['hari'] = $indonesianDay;

        $kegiatan->update($data);

        return response()->json([
            'message' => 'Kegiatan berhasil diperbarui',
            'data' => $kegiatan->load('laboratorium')
        ]);
    }

    public function destroy(Kegiatan $kegiatan)
    {
        $kegiatan->delete();
        return response()->json([
            'message' => 'Kegiatan berhasil dihapus'
        ]);
    }
}
