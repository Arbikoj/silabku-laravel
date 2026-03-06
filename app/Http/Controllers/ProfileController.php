<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user()->load('profile');
        return response()->json([
            'user' => $user,
            'profile' => $user->profile,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'nullable|string|max:255',
            'no_wa' => 'nullable|string|max:20',
            'norek' => 'nullable|string|max:50',
            'nama_rek' => 'nullable|string|max:255',
            'bank' => 'nullable|string|max:50',
            'nilai_ipk' => 'nullable|numeric|min:0|max:4',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user = Auth::user();
        $profile = $user->profile ?? Profile::create(['user_id' => $user->id]);

        $data = $request->only(['nama_lengkap', 'no_wa', 'norek', 'nama_rek', 'bank', 'nilai_ipk']);

        if ($request->hasFile('foto')) {
            if ($profile->foto) {
                Storage::delete($profile->foto);
            }
            $data['foto'] = $request->file('foto')->store('photos', 'public');
        }

        $profile->update($data);

        return response()->json(['message' => 'Profil berhasil diperbarui', 'profile' => $profile]);
    }
}
