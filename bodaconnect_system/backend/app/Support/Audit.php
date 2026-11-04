<?php

namespace App\Support;

use App\Models\AuditEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Writes append-only audit events. Metadata is redacted: OTPs, tokens and identity numbers are
 * never stored.
 */
class Audit
{
    private const REDACT = ['otp', 'code', 'devcode', 'token', 'password', 'identity', 'identityreference', 'identity_reference', 'secret'];

    public static function record(
        string $action,
        ?Model $entity = null,
        array $metadata = [],
        ?User $actor = null,
        ?string $organisationId = null,
        ?string $subjectPersonId = null,
    ): AuditEvent {
        $request = app()->bound('request') ? request() : null;
        $actor ??= $request?->user();

        return AuditEvent::create([
            'actor_user_id' => $actor?->id,
            'action' => $action,
            'entity_type' => $entity ? self::entityType($entity) : null,
            'entity_id' => $entity?->getKey(),
            'organisation_id' => $organisationId,
            'subject_person_id' => $subjectPersonId,
            'request_id' => $request?->attributes->get('request_id'),
            'ip_address' => $request?->ip(),
            'user_agent' => $request ? substr((string) $request->userAgent(), 0, 250) : null,
            'metadata' => self::redact($metadata) ?: null,
            'created_at' => now(),
        ]);
    }

    public static function entityType(Model $m): string
    {
        return Str::snake(class_basename($m));
    }

    public static function redact(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) {
            $key = strtolower(str_replace(['-', ' '], '', (string) $k));
            $sensitive = false;
            foreach (self::REDACT as $r) {
                if ($key === $r || str_contains($key, $r) && $r !== 'code') {
                    $sensitive = true;
                    break;
                }
            }
            if ($sensitive) {
                $out[$k] = '[REDACTED]';
            } elseif (is_array($v)) {
                $out[$k] = self::redact($v);
            } else {
                $out[$k] = $v;
            }
        }

        return $out;
    }
}
