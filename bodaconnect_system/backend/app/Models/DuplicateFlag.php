<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DuplicateFlag extends Model
{
    use HasUuids;

    protected $table = 'duplicate_flags';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['resolved_at' => 'datetime'];
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function matchedPerson(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'matched_person_id');
    }

    public function matchedVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'matched_vehicle_id');
    }
}
