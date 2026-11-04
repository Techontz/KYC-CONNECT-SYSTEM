<?php

namespace App\Http\Resources;

use App\Models\DataDisclosure;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DataDisclosure */
class DisclosureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subjectPersonId' => $this->subject_person_id,
            'subjectName' => $this->subject?->legal_name,
            'recipientOrgId' => $this->recipient_organisation_id,
            'recipientOrgName' => $this->recipient?->name,
            'purpose' => $this->purpose,
            'dataCategories' => $this->data_categories ?? [],
            'legalBasis' => $this->legal_basis,
            'expiryAt' => $this->expiry_at?->toIso8601ZuluString(),
            'createdBy' => $this->createdBy ? ['id' => $this->createdBy->id, 'name' => $this->createdBy->name()] : null,
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
