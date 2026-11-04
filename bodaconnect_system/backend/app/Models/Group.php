<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    use HasUuids;

    protected $table = 'groups';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [];
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'leader_person_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class);
    }

    public function activeMemberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class)->where('status', 'active');
    }

    public function parkingPoints(): HasMany
    {
        return $this->hasMany(ParkingPoint::class);
    }
}
