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
        $user = Auth::user();
        $profile = $user->profile;

        $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'no_wa' => 'required|string|max:20',
            'norek' => 'required|string|max:50',
            'nama_rek' => 'required|string|max:255',
            'bank' => 'required|string|max:50',
            'nilai_ipk' => 'required|numeric|min:0|max:4',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'transkrip' => ($profile && $profile->transkrip_gd_id) ? 'nullable|file|mimes:pdf|max:5120' : 'required|file|mimes:pdf|max:5120',
            'ktm' => ($profile && $profile->ktm_gd_id) ? 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120' : 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $profile = $profile ?? Profile::create(['user_id' => $user->id]);

        $data = $request->only(['nama_lengkap', 'no_wa', 'norek', 'nama_rek', 'bank', 'nilai_ipk']);

        if ($request->hasFile('foto')) {
            if ($profile->foto) {
                Storage::delete($profile->foto);
            }
            $data['foto'] = $request->file('foto')->store('photos', 'public');
        }

        if ($request->hasFile('transkrip')) {
            try {
                if ($profile->transkrip_gd_id && Storage::disk('google')->exists($profile->transkrip_gd_id)) {
                    Storage::disk('google')->delete($profile->transkrip_gd_id);
                }
                $filename = $user->nim . '-' . \Illuminate\Support\Str::slug($user->name) . '.pdf';
                $path = $request->file('transkrip')->storeAs('transkrip', $filename, 'google');
                $data['transkrip_gd_id'] = $path;
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Gagal mengunggah ke Google Drive: Cek konfigurasi Service Account JSON / Folder ID.'
                ], 500);
            }
        }

        if ($request->hasFile('ktm')) {
            try {
                if ($profile->ktm_gd_id && Storage::disk('google')->exists($profile->ktm_gd_id)) {
                    Storage::disk('google')->delete($profile->ktm_gd_id);
                }
                $extension = $request->file('ktm')->getClientOriginalExtension();
                $filename = $user->nim . '-' . \Illuminate\Support\Str::slug($user->name) . '-ktm.' . $extension;
                $path = $request->file('ktm')->storeAs('ktm', $filename, 'google');
                $data['ktm_gd_id'] = $path;
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Gagal mengunggah KTM ke Google Drive: Cek konfigurasi Service Account JSON / Folder ID.'
                ], 500);
            }
        }

        $profile->update($data);

        return response()->json(['message' => 'Profil berhasil diperbarui', 'profile' => $profile]);
    }

    public function transkrip()
    {
        $profile = Auth::user()->profile;
        if (!$profile || !$profile->transkrip_gd_id) {
            abort(404, 'Transkrip tidak ditemukan');
        }

        return Storage::disk('google')->response($profile->transkrip_gd_id);
    }

    public function ktm()
    {
        $profile = Auth::user()->profile;
        if (!$profile || !$profile->ktm_gd_id) {
            abort(404, 'KTM tidak ditemukan');
        }

        return Storage::disk('google')->response($profile->ktm_gd_id);
    }
}
