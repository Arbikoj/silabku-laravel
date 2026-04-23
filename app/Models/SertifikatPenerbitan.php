<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SertifikatPenerbitan extends Model
{
    protected $table = 'sertifikat_penerbitan';

    protected $fillable = [
        'event_id',
        'user_id',
        'mata_kuliah_id',
        'nomor_urut',
        'nomor_sertifikat',
        'google_drive_file_id',
        'google_drive_file_name',
        'generated_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }
}
