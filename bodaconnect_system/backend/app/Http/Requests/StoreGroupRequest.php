<?php

namespace App\Http\Requests;

class StoreGroupRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'code' => ['required', 'string', 'max:20', 'alpha_dash'],
            'leaderPersonId' => ['nullable', 'uuid'],
        ];
    }
}
