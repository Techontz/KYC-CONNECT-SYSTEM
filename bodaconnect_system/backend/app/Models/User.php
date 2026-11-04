<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Login identity (phone + OTP). Authorisation comes from role_assignments, see App\Support\Scope.
 */
class User extends Authenticatable
{
    use HasApiTokens, HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'disabled_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function roleAssignments(): HasMany
    {
        return $this->hasMany(RoleAssignment::class);
    }

    public function activeRoles(): HasMany
    {
        return $this->hasMany(RoleAssignment::class)->whereNull('revoked_at');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function name(): string
    {
        return $this->display_name ?? $this->person?->legal_name ?? $this->phone_e164;
    }

    // Phone-OTP users have no password.
    public function getAuthPassword(): string
    {
        return '';
    }
}
