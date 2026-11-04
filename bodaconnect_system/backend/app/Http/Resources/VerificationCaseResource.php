<?php

namespace App\Http\Resources;

use App\Models\VerificationCase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VerificationCase */
class VerificationCaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'verificationType' => $this->verification_type,
            'status' => $this->status,
            'subject' => $this->person ? [
                'id' => $this->person->id,
                'systemId' => $this->person->system_id,
                'legalName' => $this->person->legal_name,
                'preferredName' => $this->person->preferred_name,
                'phoneMasked' => $this->person->phoneMasked(),
                'profileStatus' => $this->person->profile_status,
            ] : null,
            'vehicleId' => $this->vehicle_id,
            'submittedBy' => $this->submittedBy ? ['id' => $this->submittedBy->id, 'name' => $this->submittedBy->name()] : null,
            'assignedTo' => $this->assignedTo ? ['id' => $this->assignedTo->id, 'name' => $this->assignedTo->name()] : null,
            'decidedBy' => $this->decidedBy ? ['id' => $this->decidedBy->id, 'name' => $this->decidedBy->name()] : null,
            'method' => $this->method,
            'reasonCode' => $this->reason_code,
            'notes' => $this->notes,
            'submittedAt' => $this->submitted_at?->toIso8601ZuluString(),
            'decidedAt' => $this->decided_at?->toIso8601ZuluString(),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
            'evidence' => $this->whenLoaded('evidence', fn () => DocumentResource::collection($this->getRelation('evidence'))->resolve($request)),
            'history' => $this->whenLoaded('decisions', fn () => VerificationDecisionResource::collection($this->decisions)->resolve($request)),
        ];
    }
}
