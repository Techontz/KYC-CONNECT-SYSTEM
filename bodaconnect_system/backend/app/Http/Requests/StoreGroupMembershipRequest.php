<?php

namespace App\Http\Requests;

class StoreGroupMembershipRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'personId' => ['required', 'uuid'],
            'parkingPointId' => ['nullable', 'uuid'],
        ];
    }
}
