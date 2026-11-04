<?php

namespace App\Http\Resources;

use App\Models\ParkingPoint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ParkingPoint */
class ParkingPointResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organisationId' => $this->organisation_id,
            'groupId' => $this->group_id,
            'groupName' => $this->group?->name,
            'name' => $this->name,
            'ward' => $this->ward,
            'area' => $this->area,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'status' => $this->status,
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
