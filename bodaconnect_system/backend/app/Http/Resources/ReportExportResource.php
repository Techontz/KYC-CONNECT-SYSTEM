<?php

namespace App\Http\Resources;

use App\Models\ReportExport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReportExport */
class ReportExportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reportType' => $this->report_type,
            'purpose' => $this->purpose,
            'filters' => (object) ($this->filters ?? []),
            'status' => $this->status,
            'rowCount' => $this->row_count,
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
            'expiresAt' => $this->expires_at?->toIso8601ZuluString(),
            'downloadAvailable' => $this->expires_at?->isFuture() ?? false,
            'downloadPath' => '/api/v1/reports/exports/'.$this->id.'/download',
            'downloadedAt' => $this->downloaded_at?->toIso8601ZuluString(),
            'downloadCount' => $this->download_count,
        ];
    }
}
