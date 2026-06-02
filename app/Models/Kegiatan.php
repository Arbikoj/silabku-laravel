<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kegiatan extends Model
{
    protected $table = 'kegiatans';

    protected $fillable = [
        'nama_kegiatan',
        'tanggal',
        'hari',
        'jam_mulai',
        'jam_selesai',
        'laboratorium_id',
        'keterangan',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
    ];

    public function laboratorium(): BelongsTo
    {
        return $this->belongsTo(Laboratorium::class);
    }
}
