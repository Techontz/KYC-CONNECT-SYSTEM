<?php

namespace App\Http\Resources;

use App\Models\GroupMembership;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GroupMembership */
class GroupMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'membershipId' => $this->id,
            'personId' => $this->person_id,
            'systemId' => $this->person?->system_id,
            'legalName' => $this->person?->legal_name,
            'preferredName' => $this->person?->preferred_name,
            'phoneMasked' => $this->person?->phoneMasked(),
            'profileStatus' => $this->person?->profile_status,
            'role' => $this->role,
            'parkingPointId' => $this->parking_point_id,
            'parkingPointName' => $this->parkingPoint?->name,
            'status' => $this->status,
            'startAt' => $this->start_at?->toIso8601ZuluString(),
            'endAt' => $this->end_at?->toIso8601ZuluString(),
        ];
    }
}
