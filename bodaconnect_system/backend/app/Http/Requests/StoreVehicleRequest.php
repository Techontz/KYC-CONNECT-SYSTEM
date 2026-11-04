<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreVehicleRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'vehicleType' => ['required', Rule::in(['motorcycle', 'bajaji'])],
            'registrationNumber' => ['required', 'string', 'min:4', 'max:20'],
            'make' => ['nullable', 'string', 'max:60'],
            'model' => ['nullable', 'string', 'max:60'],
            'colour' => ['nullable', 'string', 'max:40'],
            'organisationId' => ['nullable', 'uuid'],
        ];
    }
}
