<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateGroupRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'code' => ['sometimes', 'string', 'max:20', 'alpha_dash'],
            'leaderPersonId' => ['sometimes', 'nullable', 'uuid'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ];
    }
}
