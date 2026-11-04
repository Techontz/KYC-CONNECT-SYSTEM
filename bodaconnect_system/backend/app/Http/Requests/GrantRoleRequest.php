<?php

namespace App\Http\Requests;

use App\Support\Permissions;
use Illuminate\Validation\Rule;

class GrantRoleRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(Permissions::ROLES)],
            'organisationId' => ['nullable', 'uuid'],
            'groupId' => ['nullable', 'uuid'],
        ];
    }
}
