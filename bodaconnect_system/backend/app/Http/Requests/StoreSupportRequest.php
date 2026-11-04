<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreSupportRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'category' => ['required', Rule::in(['correction', 'help', 'complaint'])],
            'description' => ['required', 'string', 'min:5', 'max:2000'],
            'subjectPersonId' => ['nullable', 'uuid'],
        ];
    }
}
