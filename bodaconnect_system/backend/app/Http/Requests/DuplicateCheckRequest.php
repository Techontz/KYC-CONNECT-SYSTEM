<?php

namespace App\Http\Requests;

use App\Rules\TanzanianPhone;

class DuplicateCheckRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'phoneNumber' => ['nullable', 'string', 'max:20', new TanzanianPhone],
            'identityReference' => ['nullable', 'string', 'max:40'],
            'legalName' => ['nullable', 'string', 'max:150'],
            'registrationNumber' => ['nullable', 'string', 'max:20'],
        ];
    }
}
