<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventMataKuliah extends Model
{
    protected $table = 'event_mata_kuliah';

    protected $fillable = ['event_id', 'mata_kuliah_id', 'kelas_id'];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    public function applicationMataKuliah()
    {
        return $this->hasMany(ApplicationMataKuliah::class);
    }
}
