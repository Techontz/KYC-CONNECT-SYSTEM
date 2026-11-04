<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base form request. Authorisation (role + scope) is enforced in controllers via App\Support\Scope
 * so that out-of-scope ids return 404 consistently; validation errors render as fieldErrors.
 */
abstract class ApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
