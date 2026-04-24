<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Application;
use App\Models\SertifikatPenerbitan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role; // 'admin', 'dosen', 'user'

        $stats = [];

        if ($role === 'admin' || $role === 'dosen') {
            $stats['active_events'] = Event::where('is_open', true)->count();
            $stats['total_applicants'] = Application::whereIn('status', ['pending', 'approved', 'rejected'])->count();
            $stats['pending_selections'] = Application::where('status', 'pending')->count();
            $stats['issued_certificates'] = SertifikatPenerbitan::count();
            
            // Recent events
            $stats['recent_events'] = Event::orderBy('created_at', 'desc')->take(5)->get();
            // Recent applications
            $stats['recent_applications'] = Application::with(['user', 'event'])->orderBy('created_at', 'desc')->take(5)->get();
            
        } else {
            // Mahasiswa (user)
            $stats['my_applications_count'] = Application::where('user_id', $user->id)->count();
            $stats['active_events_count'] = Event::where('is_open', true)->count();
            
            $stats['my_recent_applications'] = Application::with('event')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->take(3)
                ->get();
        }

        return Inertia::render('dashboard', [
            'stats' => $stats
        ]);
    }
}
