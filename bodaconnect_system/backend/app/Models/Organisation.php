<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organisation extends Model
{
    use HasUuids;

    protected $table = 'organisations';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [];
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }

    public function parkingPoints(): HasMany
    {
        return $this->hasMany(ParkingPoint::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(OrganisationMembership::class);
    }
}
