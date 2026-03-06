<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'nama',
        'tipe',
        'semester_id',
        'is_open',
        'tanggal_buka',
        'tanggal_tutup',
        'deskripsi',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'tanggal_buka' => 'datetime',
        'tanggal_tutup' => 'datetime',
    ];

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function eventMataKuliah()
    {
        return $this->hasMany(EventMataKuliah::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    // Applicants yang sudah di-approve
    public function approvedApplications()
    {
        return $this->hasMany(Application::class)->where('status', 'approved');
    }
}
