<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'status',
        'catatan',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function applicationMataKuliah()
    {
        return $this->hasMany(ApplicationMataKuliah::class);
    }

    public function mataKuliahPilihan()
    {
        return $this->hasManyThrough(
            EventMataKuliah::class,
            ApplicationMataKuliah::class,
            'application_id',
            'id',
            'id',
            'event_mata_kuliah_id'
        );
    }
}
