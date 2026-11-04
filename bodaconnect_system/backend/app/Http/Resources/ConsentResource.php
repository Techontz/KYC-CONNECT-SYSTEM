<?php

namespace App\Http\Resources;

use App\Models\ConsentRecord;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ConsentRecord */
class ConsentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purpose' => $this->purpose,
            'granted' => $this->granted && ! $this->withdrawn_at,
            'noticeVersion' => $this->notice_version,
            'captureMethod' => $this->capture_method,
            'grantedAt' => $this->granted_at?->toIso8601ZuluString(),
            'withdrawnAt' => $this->withdrawn_at?->toIso8601ZuluString(),
        ];
    }
}
