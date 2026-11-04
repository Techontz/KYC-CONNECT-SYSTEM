<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationDecision extends Model
{
    use HasUuids;

    protected $table = 'verification_decisions';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [];
    }

    public function verificationCase(): BelongsTo
    {
        return $this->belongsTo(VerificationCase::class);
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by_user_id');
    }
}
