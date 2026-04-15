<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MataKuliah extends Model
{
    protected $table = 'mata_kuliah';

    protected $fillable = ['kode', 'nama', 'sks', 'nilai_minimum', 'color'];

    public function kelas()
    {
        return $this->hasMany(Kelas::class);
    }

    public function eventMataKuliah()
    {
        return $this->hasMany(EventMataKuliah::class);
    }

    public function jadwalPraktikums()
    {
        return $this->hasMany(JadwalPraktikum::class, 'mata_kuliah_id');
    }
}
