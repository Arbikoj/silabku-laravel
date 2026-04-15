<?php

namespace App\Http\Controllers;

use App\Models\Laboratorium;
use Illuminate\Http\Request;

class LaboratoriumController extends Controller
{
    public function index(Request $request)
    {
        $query = Laboratorium::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->per_page ?? 10;
        $data = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'data' => $data->items(),
            'meta' => [
                'total' => $data->total(),
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
            ],
        ]);
    }

    public function all()
    {
        return response()->json(Laboratorium::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string',
        ]);

        $lab = Laboratorium::create($request->only(['name', 'bio']));

        return response()->json(['message' => 'Laboratorium berhasil ditambahkan', 'data' => $lab], 201);
    }

    public function update(Request $request, Laboratorium $laboratorium)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string',
        ]);

        $laboratorium->update($request->only(['name', 'bio']));

        return response()->json(['message' => 'Laboratorium berhasil diperbarui', 'data' => $laboratorium]);
    }

    public function destroy(Laboratorium $laboratorium)
    {
        $laboratorium->delete();
        return response()->json(['message' => 'Laboratorium berhasil dihapus']);
    }
}
