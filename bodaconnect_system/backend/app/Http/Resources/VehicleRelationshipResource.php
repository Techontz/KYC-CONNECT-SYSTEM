<?php

namespace App\Http\Resources;

use App\Models\VehicleRelationship;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VehicleRelationship */
class VehicleRelationshipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicleId' => $this->vehicle_id,
            'personId' => $this->person_id,
            'personName' => $this->person?->legal_name,
            'personSystemId' => $this->person?->system_id,
            'relationshipType' => $this->relationship_type,
            'startAt' => $this->start_at?->toIso8601ZuluString(),
            'endAt' => $this->end_at?->toIso8601ZuluString(),
            'active' => $this->end_at === null,
            'verificationStatus' => $this->verification_status,
        ];
    }
}
