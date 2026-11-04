<?php

namespace App\Http\Resources;

use App\Models\DuplicateFlag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DuplicateFlag */
class DuplicateFlagResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reason' => $this->reason,
            'status' => $this->status,
            'person' => $this->person ? ['id' => $this->person->id, 'systemId' => $this->person->system_id, 'legalName' => $this->person->legal_name, 'profileStatus' => $this->person->profile_status] : null,
            'matchedPerson' => $this->matchedPerson ? ['id' => $this->matchedPerson->id, 'systemId' => $this->matchedPerson->system_id, 'legalName' => $this->matchedPerson->legal_name, 'profileStatus' => $this->matchedPerson->profile_status] : null,
            'matchedVehicle' => $this->matchedVehicle ? ['id' => $this->matchedVehicle->id, 'registrationNumber' => $this->matchedVehicle->registration_number] : null,
            'notes' => $this->notes,
            'resolvedAt' => $this->resolved_at?->toIso8601ZuluString(),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
