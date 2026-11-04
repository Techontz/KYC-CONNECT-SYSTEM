<?php

namespace App\Http\Resources;

use App\Models\RoleAssignment;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin RoleAssignment */
class RoleAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'roleLabel' => Permissions::ROLE_LABELS[$this->role] ?? $this->role,
            'organisationId' => $this->organisation_id,
            'organisationName' => $this->organisation?->name,
            'groupId' => $this->group_id,
            'groupName' => $this->group?->name,
            'grantedAt' => $this->granted_at?->toIso8601ZuluString(),
            'revokedAt' => $this->revoked_at?->toIso8601ZuluString(),
        ];
    }
}
