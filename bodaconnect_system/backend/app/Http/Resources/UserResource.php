<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'phoneE164' => $this->phone_e164,
            'displayName' => $this->name(),
            'status' => $this->status,
            'personId' => $this->person_id,
            'roles' => RoleAssignmentResource::collection($this->activeRoles)->resolve($request),
            'lastLoginAt' => $this->last_login_at?->toIso8601ZuluString(),
            'disabledAt' => $this->disabled_at?->toIso8601ZuluString(),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
