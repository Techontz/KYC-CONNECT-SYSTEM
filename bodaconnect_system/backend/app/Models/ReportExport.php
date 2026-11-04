<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportExport extends Model
{
    use HasUuids;

    protected $table = 'report_exports';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['filters' => 'array', 'expires_at' => 'datetime', 'downloaded_at' => 'datetime'];
    }

    protected $hidden = ['path', 'disk'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
