<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    protected $fillable = ['nama', 'tipe', 'tahun', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function events()
    {
        return $this->hasMany(Event::class);
    }
}
