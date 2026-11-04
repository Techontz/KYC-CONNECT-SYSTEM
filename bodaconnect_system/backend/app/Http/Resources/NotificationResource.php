<?php

namespace App\Http\Resources;

use App\Models\InAppNotification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InAppNotification */
class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'data' => (object) ($this->data ?? []),
            'readAt' => $this->read_at?->toIso8601ZuluString(),
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
