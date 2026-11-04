<?php

namespace App\Support;

use App\Models\Person;

/**
 * Mandatory-field completeness for a rider profile. completion rate on the dashboard counts
 * riders whose percent is 100.
 */
class Completeness
{
    public const FIELDS = [
        'legalName', 'phoneNumber', 'dateOfBirth', 'gender', 'identityReference',
        'organisationMembership', 'groupMembership', 'parkingPoint', 'vehicle', 'registrationConsent',
    ];

    /** @return array{percent:int, missing:string[]} */
    public static function evaluate(Person $p): array
    {
        $gm = $p->activeGroupMemberships()->get();
        $present = [
            'legalName' => filled($p->legal_name),
            'phoneNumber' => filled($p->phone_e164),
            'dateOfBirth' => filled($p->date_of_birth),
            'gender' => filled($p->gender),
            'identityReference' => filled($p->identity_reference_hash),
            'organisationMembership' => $p->activeOrganisationMemberships()->exists(),
            'groupMembership' => $gm->isNotEmpty(),
            'parkingPoint' => $gm->whereNotNull('parking_point_id')->isNotEmpty(),
            'vehicle' => $p->vehicleRelationships()->whereNull('end_at')->exists(),
            'registrationConsent' => $p->consents()->where('purpose', 'registration')->where('granted', true)->whereNull('withdrawn_at')->exists(),
        ];
        $missing = array_keys(array_filter($present, fn ($v) => ! $v));

        return [
            'percent' => (int) round(100 * (count(self::FIELDS) - count($missing)) / count(self::FIELDS)),
            'missing' => array_values($missing),
        ];
    }

    public static function refresh(Person $p): array
    {
        $r = self::evaluate($p);
        if ($p->completeness_percent !== $r['percent']) {
            $p->forceFill(['completeness_percent' => $r['percent']])->saveQuietly();
        }

        return $r;
    }
}
