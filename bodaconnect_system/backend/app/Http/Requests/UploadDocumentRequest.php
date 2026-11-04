<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UploadDocumentRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:5120'],
            'documentType' => ['required', Rule::in(['national_id', 'driving_licence', 'vehicle_registration', 'membership_letter', 'other'])],
            'verificationCaseId' => ['nullable', 'uuid'],
        ];
    }
}
