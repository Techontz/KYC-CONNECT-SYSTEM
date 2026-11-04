<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class DecisionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'outcome' => ['required', Rule::in(['verified', 'correction_required', 'rejected'])],
            'method' => ['required', Rule::in(['document_review', 'in_person', 'association_confirmation', 'phone_otp'])],
            'reasonCode' => ['required', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
