<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataDisclosure extends Model
{
    use HasUuids;

    protected $table = 'data_disclosures';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['data_categories' => 'array', 'expiry_at' => 'datetime'];
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'subject_person_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'recipient_organisation_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
