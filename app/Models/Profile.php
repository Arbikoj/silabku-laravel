<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $fillable = [
        'user_id',
        'nama_lengkap',
        'no_wa',
        'norek',
        'nama_rek',
        'bank',
        'foto',
        'transkrip_gd_id',
        'ktm_gd_id',
        'cv_gd_id',
        'nilai_ipk',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
