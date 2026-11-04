<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class ResolveDuplicateRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'resolution' => ['required', Rule::in(['confirmed_duplicate', 'not_duplicate'])],
            'notes' => ['required', 'string', 'min:3', 'max:2000'],
        ];
    }
}
