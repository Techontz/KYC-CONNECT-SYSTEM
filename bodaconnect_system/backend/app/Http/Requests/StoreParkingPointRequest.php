<?php

namespace App\Http\Requests;

class StoreParkingPointRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'ward' => ['required', 'string', 'max:80'],
            'area' => ['nullable', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'groupId' => ['nullable', 'uuid'],
        ];
    }
}
