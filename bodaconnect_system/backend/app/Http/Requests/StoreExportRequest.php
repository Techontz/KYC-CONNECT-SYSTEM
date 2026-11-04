<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreExportRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'reportType' => ['required', Rule::in(['rider_roster', 'verification_status', 'group_coverage'])],
            'purpose' => ['required', 'string', 'min:10', 'max:500'],
            'filters' => ['nullable', 'array'],
            'filters.organisationId' => ['nullable', 'uuid'],
            'filters.groupId' => ['nullable', 'uuid'],
            'filters.status' => ['nullable', 'string', 'max:30'],
        ];
    }
}
