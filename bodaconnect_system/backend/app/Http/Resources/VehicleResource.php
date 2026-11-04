<?php

namespace App\Http\Resources;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Vehicle */
class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicleType' => $this->vehicle_type,
            'registrationNumber' => $this->registration_number,
            'registrationNumberNormalised' => $this->registration_number_normalised,
            'make' => $this->make,
            'model' => $this->model,
            'colour' => $this->colour,
            'status' => $this->status,
            'organisationId' => $this->organisation_id,
            'relationships' => $this->whenLoaded('relationships', fn () => VehicleRelationshipResource::collection($this->relationships)->resolve($request)),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
