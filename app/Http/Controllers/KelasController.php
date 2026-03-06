<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\MataKuliah;
use Illuminate\Http\Request;

class KelasController extends Controller
{
    public function index(Request $request)
    {
        $query = Kelas::with('mataKuliah');

        if ($request->mata_kuliah_id) {
            $query->where('mata_kuliah_id', $request->mata_kuliah_id);
        }
        if ($request->search) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->per_page ?? 10;
        $data = $query->orderBy('mata_kuliah_id')->orderBy('nama')->paginate($perPage);

        $items = $data->items();
        // Tambahkan kuota_asisten ke setiap item
        foreach ($items as $item) {
            $item->kuota_asisten = (int) ceil($item->jumlah_mhs / 8);
        }

        return response()->json([
            'data' => $items,
            'meta' => ['total' => $data->total(), 'current_page' => $data->currentPage(), 'last_page' => $data->lastPage()],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'nama' => 'required|string|max:10|unique:kelas,nama',
            'jumlah_mhs' => 'required|integer|min:0',
        ]);

        $kelas = Kelas::create($request->only(['mata_kuliah_id', 'nama', 'jumlah_mhs']));
        $kelas->kuota_asisten = (int) ceil($kelas->jumlah_mhs / 8);

        return response()->json(['message' => 'Kelas berhasil ditambahkan', 'data' => $kelas->load('mataKuliah')], 201);
    }

    public function update(Request $request, Kelas $kelas)
    {
        $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'nama' => [
                'required',
                'string',
                'max:10',
                \Illuminate\Validation\Rule::unique('kelas')->ignore($kelas->id)
            ],
            'jumlah_mhs' => 'required|integer|min:0',
        ]);

        $kelas->update($request->only(['mata_kuliah_id', 'nama', 'jumlah_mhs']));
        $kelas->kuota_asisten = (int) ceil($kelas->jumlah_mhs / 8);

        return response()->json(['message' => 'Kelas berhasil diperbarui', 'data' => $kelas->load('mataKuliah')]);
    }

    public function destroy(Kelas $kelas)
    {
        $kelas->delete();
        return response()->json(['message' => 'Kelas berhasil dihapus']);
    }
}
