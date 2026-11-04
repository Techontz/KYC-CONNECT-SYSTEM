<?php

namespace App\Http\Resources;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Document */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'personId' => $this->person_id,
            'documentType' => $this->document_type,
            'originalName' => $this->original_name,
            'mimeType' => $this->mime_type,
            'sizeBytes' => $this->size_bytes,
            'sha256' => $this->sha256,
            'uploadedAt' => $this->created_at?->toIso8601ZuluString(),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
