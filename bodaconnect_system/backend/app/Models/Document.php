<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasUuids;

    protected $table = 'documents';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['size_bytes' => 'integer'];
    }

    protected $hidden = ['path', 'disk'];

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
