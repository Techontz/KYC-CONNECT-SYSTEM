<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class ResolveSupportRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['resolved', 'rejected'])],
            'resolutionSummary' => ['required', 'string', 'min:3', 'max:2000'],
        ];
    }
}
