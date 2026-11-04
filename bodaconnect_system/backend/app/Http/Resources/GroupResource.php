<?php

namespace App\Http\Resources;

use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Group */
class GroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organisationId' => $this->organisation_id,
            'name' => $this->name,
            'code' => $this->code,
            'leaderPersonId' => $this->leader_person_id,
            'leaderName' => $this->leader?->legal_name,
            'status' => $this->status,
            'memberCount' => (int) ($this->active_memberships_count ?? 0),
            'parkingPointCount' => (int) ($this->parking_points_count ?? 0),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
