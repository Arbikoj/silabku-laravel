<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbsensiAsistenPertemuan extends Model
{
    protected $fillable = [
        'application_mata_kuliah_id',
        'pertemuan_ke',
    ];

    public function applicationMataKuliah()
    {
        return $this->belongsTo(ApplicationMataKuliah::class);
    }
}

