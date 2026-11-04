<?php

namespace App\Http\Resources;

use App\Models\VerificationDecision;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VerificationDecision */
class VerificationDecisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'outcome' => $this->outcome,
            'method' => $this->method,
            'reasonCode' => $this->reason_code,
            'notes' => $this->notes,
            'decidedBy' => $this->decidedBy ? ['id' => $this->decidedBy->id, 'name' => $this->decidedBy->name()] : null,
            'decidedAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
