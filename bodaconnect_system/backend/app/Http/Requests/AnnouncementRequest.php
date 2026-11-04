<?php

namespace App\Http\Requests;

class AnnouncementRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:3', 'max:150'],
            'body' => ['required', 'string', 'min:3', 'max:2000'],
            'organisationId' => ['nullable', 'uuid'],
        ];
    }
}
