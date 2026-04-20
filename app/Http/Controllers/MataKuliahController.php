<?php

namespace App\Http\Controllers;

use App\Models\MataKuliah;
use Illuminate\Http\Request;

class MataKuliahController extends Controller
{
    public function index(Request $request)
    {
        $query = MataKuliah::with('kelas');

        if ($request->search) {
            $query->where('nama', 'like', '%' . $request->search . '%')
                ->orWhere('kode', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->per_page ?? 10;
        $data = $query->orderBy('kode')->paginate($perPage);

        return response()->json([
            'data' => $data->items(),
            'meta' => ['total' => $data->total(), 'current_page' => $data->currentPage(), 'last_page' => $data->lastPage()],
        ]);
    }

    public function all()
    {
        return response()->json(MataKuliah::with('kelas')->orderBy('kode')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode' => 'required|string|max:20|unique:mata_kuliah,kode',
            'nama' => 'required|string|max:255',
            'sks' => 'required|integer|min:1|max:6',
            'pertemuan_praktikum' => 'required|integer|min:1|max:30',
            'nilai_minimum' => 'nullable|string|in:A,AB,B,BC,C,D,E',
            'color' => 'nullable|string|max:7',
        ]);

        $mk = MataKuliah::create($request->only(['kode', 'nama', 'sks', 'pertemuan_praktikum', 'nilai_minimum', 'color']));

        return response()->json(['message' => 'Mata kuliah berhasil ditambahkan', 'data' => $mk->load('kelas')], 201);
    }

    public function update(Request $request, MataKuliah $mataKuliah)
    {
        $request->validate([
            'kode' => 'required|string|max:20|unique:mata_kuliah,kode,' . $mataKuliah->id,
            'nama' => 'required|string|max:255',
            'sks' => 'required|integer|min:1|max:6',
            'pertemuan_praktikum' => 'required|integer|min:1|max:30',
            'nilai_minimum' => 'nullable|string|in:A,AB,B,BC,C,D,E',
            'color' => 'nullable|string|max:7',
        ]);

        $mataKuliah->update($request->only(['kode', 'nama', 'sks', 'pertemuan_praktikum', 'nilai_minimum', 'color']));

        return response()->json(['message' => 'Mata kuliah berhasil diperbarui', 'data' => $mataKuliah->load('kelas')]);
    }

    public function destroy(MataKuliah $mataKuliah)
    {
        $mataKuliah->delete();
        return response()->json(['message' => 'Mata kuliah berhasil dihapus']);
    }
}
