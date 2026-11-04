<?php

namespace App\Http\Resources;

use App\Models\Person;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Person */
class RiderListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'systemId' => $this->system_id,
            'legalName' => $this->legal_name,
            'preferredName' => $this->preferred_name,
            'phoneMasked' => $this->phoneMasked(),
            'profileStatus' => $this->profile_status,
            'completeness' => $this->completeness_percent,
            'organisationName' => $this->activeOrganisationMemberships->first()?->organisation?->name,
            'groupName' => $this->activeGroupMemberships->first()?->group?->name,
            'parkingPointName' => $this->activeGroupMemberships->first()?->parkingPoint?->name,
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
            'duplicateFlag' => (bool) ($this->open_duplicate_flags_count ?? 0),
        ];
    }
}
