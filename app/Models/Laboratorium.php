<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laboratorium extends Model
{
    protected $table = 'laboratoriums';

    protected $fillable = ['name', 'bio'];

    public function jadwalPraktikums(): HasMany
    {
        return $this->hasMany(JadwalPraktikum::class);
    }
}
