<?php

namespace App\Http\Requests;

use App\Rules\TanzanianPhone;
use App\Support\Permissions;
use Illuminate\Validation\Rule;

class StoreUserRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'phoneNumber' => ['required', 'string', 'max:20', new TanzanianPhone],
            'legalName' => ['required', 'string', 'min:3', 'max:150'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*.role' => ['required', Rule::in(Permissions::ROLES)],
            'roles.*.organisationId' => ['nullable', 'uuid'],
            'roles.*.groupId' => ['nullable', 'uuid'],
        ];
    }
}
