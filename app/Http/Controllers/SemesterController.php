<?php

namespace App\Http\Controllers;

use App\Models\Semester;
use Illuminate\Http\Request;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        $query = Semester::query();

        if ($request->search) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->per_page ?? 10;
        $data = $query->orderByDesc('tahun')->orderByDesc('tipe')->paginate($perPage);

        return response()->json([
            'data' => $data->items(),
            'meta' => ['total' => $data->total(), 'current_page' => $data->currentPage(), 'last_page' => $data->lastPage()],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
            'tipe' => 'required|in:gasal,genap',
            'tahun' => 'required|integer|min:2000|max:2100',
            'is_active' => 'boolean',
        ]);

        $semester = Semester::create($request->only(['nama', 'tipe', 'tahun', 'is_active']));

        return response()->json(['message' => 'Semester berhasil ditambahkan', 'data' => $semester], 201);
    }

    public function update(Request $request, Semester $semester)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
            'tipe' => 'required|in:gasal,genap',
            'tahun' => 'required|integer|min:2000|max:2100',
            'is_active' => 'boolean',
        ]);

        $semester->update($request->only(['nama', 'tipe', 'tahun', 'is_active']));

        return response()->json(['message' => 'Semester berhasil diperbarui', 'data' => $semester]);
    }

    public function destroy(Semester $semester)
    {
        $semester->delete();
        return response()->json(['message' => 'Semester berhasil dihapus']);
    }
}
