<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    protected $fillable = ['mata_kuliah_id', 'nama', 'jumlah_mhs'];

    // Accessor: kuota asisten = ceil(jumlah_mhs / 8)
    public function getKuotaAsisteenAttribute(): int
    {
        return (int) ceil($this->jumlah_mhs / 8);
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function eventMataKuliah()
    {
        return $this->hasMany(EventMataKuliah::class);
    }
}
