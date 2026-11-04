<?php

namespace App\Http\Resources;

use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AuditEvent */
class AuditEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'actorId' => $this->actor_user_id,
            'actorName' => $this->actor?->name(),
            'entityType' => $this->entity_type,
            'entityId' => $this->entity_id,
            'organisationId' => $this->organisation_id,
            'metadata' => (object) ($this->metadata ?? []),
            'requestId' => $this->request_id,
            'ipAddress' => $this->ip_address,
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
