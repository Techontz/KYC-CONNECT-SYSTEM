<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey as Key;
use App\Support\ApiException;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Idempotency-Key support for POST creates: same key + same user within 24h returns the original
 * response. Reusing a key with a different payload is a 409.
 */
class IdempotencyKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->headers->get('Idempotency-Key');
        $user = $request->user();
        if (! $key || ! $user || $request->method() !== 'POST') {
            return $next($request);
        }
        if (strlen($key) > 100) {
            throw ApiException::validation(['idempotencyKey' => 'Idempotency-Key is too long.']);
        }

        $hash = hash('sha256', $request->method().'|'.$request->path().'|'.json_encode($request->except(['file'])));
        $existing = Key::where('user_id', $user->id)->where('key', $key)->where('expires_at', '>', now())->first();
        if ($existing) {
            if ($existing->request_hash !== $hash) {
                throw ApiException::conflict('This Idempotency-Key was already used for a different request.');
            }

            return response($existing->response_body, $existing->response_status, [
                'Content-Type' => 'application/json',
                'Idempotent-Replayed' => 'true',
            ]);
        }

        $response = $next($request);

        if ($response->getStatusCode() < 500) {
            Key::where('user_id', $user->id)->where('key', $key)->where('expires_at', '<=', now())->delete();
            try {
                Key::create([
                    'user_id' => $user->id,
                    'key' => $key,
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'request_hash' => $hash,
                    'response_status' => $response->getStatusCode(),
                    'response_body' => (string) $response->getContent(),
                    'expires_at' => now()->addDay(),
                ]);
            } catch (QueryException) {
                // concurrent duplicate: the first writer wins
            }
        }

        return $response;
    }
}
