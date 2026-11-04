<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreOrganisationRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:150'],
            'code' => ['required', 'string', 'max:20', 'alpha_dash', 'unique:organisations,code'],
            'type' => ['required', Rule::in(['platform', 'association', 'partner'])],
            'region' => ['nullable', 'string', 'max:80'],
        ];
    }
}
