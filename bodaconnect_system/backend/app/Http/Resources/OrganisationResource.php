<?php

namespace App\Http\Resources;

use App\Models\Organisation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Organisation */
class OrganisationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'type' => $this->type,
            'region' => $this->region,
            'status' => $this->status,
            'counts' => $this->when(isset($this->counts), fn () => $this->counts),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
