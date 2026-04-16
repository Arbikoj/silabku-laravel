<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BapPertemuan extends Model
{
    protected $fillable = [
        'jadwal_praktikum_id',
        'user_id',
        'pertemuan_ke',
        'tanggal',
        'topik',
        'foto_google_drive_ids',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'foto_google_drive_ids' => 'array',
    ];

    public function jadwalPraktikum(): BelongsTo
    {
        return $this->belongsTo(JadwalPraktikum::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
