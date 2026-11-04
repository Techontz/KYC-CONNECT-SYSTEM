<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class CorrectionRequestRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'field' => ['required', Rule::in(['legalName', 'preferredName', 'dateOfBirth', 'gender', 'identityReference', 'phoneNumber'])],
            'proposedValue' => ['required', 'string', 'max:150'],
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ];
    }
}
