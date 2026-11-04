<?php

namespace App\Support;

use App\Models\Person;
use App\Models\Vehicle;

/**
 * Finds possible duplicates across the whole registry (not just the caller's scope), because a
 * rider may already be registered by another organisation. Records are never merged automatically.
 */
class DuplicateDetector
{
    /**
     * @return array<int, array{person: Person|null, vehicle: Vehicle|null, reason: string}>
     */
    public static function find(?string $phoneE164, ?string $identityReference, ?string $legalName, ?string $registrationNumber, ?string $excludePersonId = null): array
    {
        $matches = [];
        $seen = [];
        $add = function (?Person $p, string $reason, ?Vehicle $v = null) use (&$matches, &$seen) {
            $k = ($p?->id ?? 'v'.$v?->id).$reason;
            if (isset($seen[$k])) {
                return;
            }
            $seen[$k] = true;
            $matches[] = ['person' => $p, 'vehicle' => $v, 'reason' => $reason];
        };
        $base = fn () => Person::query()->when($excludePersonId, fn ($q) => $q->whereKeyNot($excludePersonId))->where('profile_status', '!=', 'archived');

        if ($phoneE164) {
            foreach ($base()->where('phone_e164', $phoneE164)->limit(10)->get() as $p) {
                $add($p, 'phone');
            }
        }
        if ($hash = Person::hashIdentity($identityReference)) {
            foreach ($base()->where('identity_reference_hash', $hash)->limit(10)->get() as $p) {
                $add($p, 'identity');
            }
        }
        if ($legalName && trim($legalName) !== '') {
            foreach ($base()->where('legal_name_normalised', Person::normaliseName($legalName))->limit(10)->get() as $p) {
                $add($p, 'name');
            }
        }
        if ($registrationNumber && ($v = Vehicle::where('registration_number_normalised', Vehicle::normalisePlate($registrationNumber))->first())) {
            $holders = $v->relationships()->whereNull('end_at')->with('person')->get();
            if ($holders->isEmpty()) {
                $add(null, 'plate', $v);
            }
            foreach ($holders as $r) {
                if ($r->person && $r->person->id !== $excludePersonId) {
                    $add($r->person, 'plate', $v);
                }
            }
        }

        return $matches;
    }

    /** Serialise a match; names of people outside the caller's scope are reduced to initials. */
    public static function present(array $m, Scope $scope): array
    {
        $p = $m['person'];
        $visible = $p && ($scope->global || $scope->people(Person::query())->whereKey($p->id)->exists());

        return [
            'id' => $p?->id,
            'systemId' => $p?->system_id,
            'legalName' => $p ? ($visible ? $p->legal_name : self::initials($p->legal_name)) : null,
            'reason' => $m['reason'],
            'inScope' => $visible,
            'vehicleId' => $m['vehicle']?->id,
            'registrationNumber' => $m['vehicle']?->registration_number,
        ];
    }

    public static function initials(string $name): string
    {
        return collect(preg_split('/\s+/', trim($name)))->map(fn ($w) => mb_substr($w, 0, 1).'***')->implode(' ');
    }
}
