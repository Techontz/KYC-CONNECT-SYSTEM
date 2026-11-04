<?php

namespace App\Http\Requests;

use App\Http\Controllers\LookupController;
use App\Rules\TanzanianPhone;
use Illuminate\Validation\Rule;

class StoreRiderRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'legalName' => ['required', 'string', 'min:3', 'max:150'],
            'preferredName' => ['nullable', 'string', 'max:80'],
            'phoneNumber' => ['required', 'string', 'max:20', new TanzanianPhone],
            'dateOfBirth' => ['nullable', 'date', 'before:-16 years', 'after:1930-01-01'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'identityReference' => ['nullable', 'string', 'min:6', 'max:40'],
            'organisationId' => ['required', 'uuid'],
            'groupId' => ['nullable', 'uuid'],
            'parkingPointId' => ['nullable', 'uuid'],
            'privacyNoticeVersion' => ['required', 'string', 'max:20'],
            'captureMethod' => ['required', Rule::in(['assisted_registration', 'self_registration'])],
            'consents' => ['required', 'array', 'min:1'],
            'consents.*.purpose' => ['required', 'string', Rule::in(LookupController::CONSENT_PURPOSES)],
            'consents.*.granted' => ['required', 'boolean'],
            'vehicle' => ['nullable', 'array'],
            'vehicle.vehicleType' => ['required_with:vehicle', Rule::in(['motorcycle', 'bajaji'])],
            'vehicle.registrationNumber' => ['required_with:vehicle', 'string', 'min:4', 'max:20'],
            'vehicle.make' => ['nullable', 'string', 'max:60'],
            'vehicle.model' => ['nullable', 'string', 'max:60'],
            'vehicle.colour' => ['nullable', 'string', 'max:40'],
            'vehicle.relationshipType' => ['required_with:vehicle', Rule::in(['owner', 'operator', 'keeper'])],
        ];
    }
}
