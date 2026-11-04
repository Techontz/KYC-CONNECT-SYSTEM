<?php

namespace App\Http\Requests;

class AssignCaseRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'userId' => ['nullable', 'uuid'],
        ];
    }
}
