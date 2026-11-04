<?php

namespace App\Http\Requests;

use App\Rules\TanzanianPhone;

class VerifyOtpRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'phoneNumber' => ['required', 'string', 'max:20', new TanzanianPhone],
            'code' => ['required', 'string', 'regex:/^\d{6}$/'],
        ];
    }
}
