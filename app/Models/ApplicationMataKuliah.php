<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationMataKuliah extends Model
{
    protected $table = 'application_mata_kuliah';

    protected $fillable = ['application_id', 'event_mata_kuliah_id', 'status', 'catatan'];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function eventMataKuliah()
    {
        return $this->belongsTo(EventMataKuliah::class);
    }
}
