<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreRelationshipRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'personId' => ['required', 'uuid'],
            'relationshipType' => ['required', Rule::in(['owner', 'operator', 'keeper'])],
            'startAt' => ['nullable', 'date'],
        ];
    }
}
