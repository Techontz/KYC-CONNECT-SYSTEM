<?php

namespace App\Http\Requests;

use App\Rules\TanzanianPhone;
use Illuminate\Validation\Rule;

class UpdateRiderRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'legalName' => ['sometimes', 'string', 'min:3', 'max:150'],
            'preferredName' => ['sometimes', 'nullable', 'string', 'max:80'],
            'phoneNumber' => ['sometimes', 'string', 'max:20', new TanzanianPhone],
            'dateOfBirth' => ['sometimes', 'nullable', 'date', 'before:-16 years'],
            'gender' => ['sometimes', 'nullable', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'identityReference' => ['sometimes', 'nullable', 'string', 'min:6', 'max:40'],
        ];
    }
}
