<?php

namespace App\Http\Requests;

use App\Rules\TanzanianPhone;

class RequestOtpRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'phoneNumber' => ['required', 'string', 'max:20', new TanzanianPhone],
        ];
    }
}
