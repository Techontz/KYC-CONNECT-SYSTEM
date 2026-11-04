<?php

namespace App\Support;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/** Renders every API error into the contract envelope {error:{code,message,fieldErrors?,details?,requestId}}. */
class ErrorRenderer
{
    public static function render(Throwable $e, Request $request): ?JsonResponse
    {
        if ($e instanceof HttpResponseException) {
            return null;
        }
        $fieldErrors = [];
        $details = [];
        $headers = [];

        if ($e instanceof ApiException) {
            [$status, $code, $message] = [$e->status, $e->errorCode, $e->getMessage()];
            $details = $e->details;
            $fieldErrors = $e->fieldErrors;
        } elseif ($e instanceof ValidationException) {
            [$status, $code, $message] = [422, 'VALIDATION_ERROR', 'Please check the highlighted fields.'];
            foreach ($e->errors() as $key => $messages) {
                $fieldErrors[self::camelKey($key)] = $messages[0] ?? 'Invalid value.';
            }
        } elseif ($e instanceof AuthenticationException) {
            [$status, $code, $message] = [401, 'UNAUTHENTICATED', 'Please sign in to continue.'];
        } elseif ($e instanceof AuthorizationException) {
            [$status, $code, $message] = [403, 'FORBIDDEN', 'You do not have permission to do this.'];
        } elseif ($e instanceof ModelNotFoundException) {
            [$status, $code, $message] = [404, 'NOT_FOUND', 'Not found.'];
        } elseif ($e instanceof ThrottleRequestsException) {
            [$status, $code, $message] = [429, 'RATE_LIMITED', 'Too many requests. Please wait and try again.'];
            $headers = $e->getHeaders();
        } elseif ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            $headers = $e->getHeaders();
            [$code, $message] = match (true) {
                $status === 401 => ['UNAUTHENTICATED', 'Please sign in to continue.'],
                $status === 403 => ['FORBIDDEN', 'You do not have permission to do this.'],
                $status === 404, $status === 405 => ['NOT_FOUND', 'Not found.'],
                $status === 409 => ['CONFLICT', $e->getMessage() ?: 'Conflict.'],
                $status === 413 => ['VALIDATION_ERROR', 'The upload is too large.'],
                $status === 429 => ['RATE_LIMITED', 'Too many requests. Please wait and try again.'],
                $status >= 500 => ['SERVER_ERROR', 'Something went wrong. Please try again.'],
                default => ['VALIDATION_ERROR', $e->getMessage() ?: 'Bad request.'],
            };
        } else {
            [$status, $code, $message] = [500, 'SERVER_ERROR', 'Something went wrong. Please try again.'];
        }

        $error = ['code' => $code, 'message' => $message];
        if ($fieldErrors) {
            $error['fieldErrors'] = $fieldErrors;
        }
        if ($details) {
            $error['details'] = $details;
        }
        $error['requestId'] = $request->attributes->get('request_id');
        if ($status >= 500 && config('app.debug')) {
            // Local debugging aid only; never present when APP_DEBUG=false.
            $error['debug'] = ['exception' => get_class($e), 'message' => $e->getMessage()];
        }

        $response = new JsonResponse(['error' => $error], $status, $headers);
        if ($id = $request->attributes->get('request_id')) {
            $response->headers->set('X-Request-Id', $id);
        }

        return $response;
    }

    private static function camelKey(string $key): string
    {
        return collect(explode('.', $key))->map(fn ($s) => is_numeric($s) ? $s : Str::camel($s))->implode('.');
    }
}
