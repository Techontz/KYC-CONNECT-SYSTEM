<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\Scope;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class MeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'phoneE164' => $this->phone_e164,
            'status' => $this->status,
            'displayName' => $this->name(),
            'person' => $this->person ? [
                'id' => $this->person->id,
                'legalName' => $this->person->legal_name,
                'preferredName' => $this->person->preferred_name,
            ] : null,
            'roles' => RoleAssignmentResource::collection($this->activeRoles()->with(['organisation', 'group'])->get())->resolve($request),
            'permissions' => Scope::for($this->resource)->permissions(),
        ];
    }
}
