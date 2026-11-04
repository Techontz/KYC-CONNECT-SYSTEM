<?php

namespace App\Http\Requests;

class StoreDisclosureRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'subjectPersonId' => ['required', 'uuid'],
            'recipientOrgId' => ['required', 'uuid', 'exists:organisations,id'],
            'purpose' => ['required', 'string', 'min:10', 'max:1000'],
            'dataCategories' => ['required', 'array', 'min:1'],
            'dataCategories.*' => ['string', 'max:60'],
            'legalBasis' => ['required', 'string', 'max:200'],
            'expiryAt' => ['nullable', 'date', 'after:now'],
        ];
    }
}
