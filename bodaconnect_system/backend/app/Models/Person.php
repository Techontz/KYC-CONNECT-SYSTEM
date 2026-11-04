<?php

namespace App\Models;

use App\Support\Phone;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

/**
 * A registered rider / owner. identity_reference is encrypted at rest; identity_reference_hash
 * (SHA-256 of the normalised value) is used for duplicate matching without decrypting.
 */
class Person extends Model
{
    use HasUuids;

    protected $table = 'people';

    protected $guarded = ['id'];

    protected $hidden = ['identity_reference', 'identity_reference_hash'];

    protected function casts(): array
    {
        return [
            'identity_reference' => 'encrypted',
            'date_of_birth' => 'date',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
            'completeness_percent' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Person $p) {
            if (! $p->system_id) {
                $p->system_id = self::nextSystemId();
            }
        });
        static::saving(function (Person $p) {
            $p->legal_name_normalised = self::normaliseName((string) $p->legal_name);
            if ($p->isDirty('identity_reference')) {
                $p->identity_reference_hash = self::hashIdentity($p->identity_reference);
            }
        });
    }

    public static function normaliseName(string $name): string
    {
        return trim(preg_replace('/\s+/', ' ', mb_strtolower($name)));
    }

    public static function hashIdentity(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return hash('sha256', strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $value)));
    }

    /** Human-friendly id BC-DOD-000123 from a locked counter row. */
    public static function nextSystemId(): string
    {
        $n = DB::transaction(function () {
            $row = DB::table('counters')->where('key', 'person_system_id')->lockForUpdate()->first();
            if (! $row) {
                DB::table('counters')->insert(['key' => 'person_system_id', 'value' => 1, 'created_at' => now(), 'updated_at' => now()]);

                return 1;
            }
            DB::table('counters')->where('key', 'person_system_id')->update(['value' => $row->value + 1, 'updated_at' => now()]);

            return $row->value + 1;
        });

        return sprintf('BC-DOD-%06d', $n);
    }

    public function maskedIdentity(): ?string
    {
        $v = $this->identity_reference;
        if (! $v) {
            return null;
        }

        return str_repeat('*', max(0, strlen($v) - 4)).substr($v, -4);
    }

    public function phoneMasked(): ?string
    {
        return Phone::mask($this->phone_e164);
    }

    public function organisationMemberships(): HasMany
    {
        return $this->hasMany(OrganisationMembership::class);
    }

    public function activeOrganisationMemberships(): HasMany
    {
        return $this->hasMany(OrganisationMembership::class)->where('status', 'active');
    }

    public function groupMemberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class);
    }

    public function activeGroupMemberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class)->where('status', 'active');
    }

    public function vehicleRelationships(): HasMany
    {
        return $this->hasMany(VehicleRelationship::class);
    }

    public function verificationCases(): HasMany
    {
        return $this->hasMany(VerificationCase::class);
    }

    public function consents(): HasMany
    {
        return $this->hasMany(ConsentRecord::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function duplicateFlags(): HasMany
    {
        return $this->hasMany(DuplicateFlag::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
