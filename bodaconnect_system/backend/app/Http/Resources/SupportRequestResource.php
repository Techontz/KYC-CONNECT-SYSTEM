<?php

namespace App\Http\Resources;

use App\Models\SupportRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SupportRequest */
class SupportRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'status' => $this->status,
            'description' => $this->description,
            'subjectPersonId' => $this->subject_person_id,
            'subjectName' => $this->subject?->legal_name,
            'subjectSystemId' => $this->subject?->system_id,
            'requestedBy' => $this->requestedBy ? ['id' => $this->requestedBy->id, 'name' => $this->requestedBy->name()] : null,
            'field' => $this->field,
            'proposedValue' => $this->field === 'identityReference' && $this->proposed_value ? str_repeat('*', max(0, strlen($this->proposed_value) - 4)).substr($this->proposed_value, -4) : $this->proposed_value,
            'reason' => $this->reason,
            'resolutionSummary' => $this->resolution_summary,
            'resolvedBy' => $this->resolvedBy ? ['id' => $this->resolvedBy->id, 'name' => $this->resolvedBy->name()] : null,
            'resolvedAt' => $this->resolved_at?->toIso8601ZuluString(),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
