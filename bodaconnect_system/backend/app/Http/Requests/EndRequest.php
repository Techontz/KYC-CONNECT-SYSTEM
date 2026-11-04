<?php

namespace App\Http\Requests;

class EndRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'endAt' => ['nullable', 'date'],
        ];
    }
}
