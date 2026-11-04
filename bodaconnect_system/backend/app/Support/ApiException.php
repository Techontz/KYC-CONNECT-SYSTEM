<?php

namespace App\Support;

use RuntimeException;

/** Domain error rendered into the contract error envelope. */
class ApiException extends RuntimeException
{
    public function __construct(
        public string $errorCode,
        string $message,
        public int $status,
        public array $details = [],
        public array $fieldErrors = [],
    ) {
        parent::__construct($message);
    }

    public static function businessRule(string $message, array $details = []): self
    {
        return new self('BUSINESS_RULE', $message, 422, $details);
    }

    public static function conflict(string $message, array $details = []): self
    {
        return new self('CONFLICT', $message, 409, $details);
    }

    public static function forbidden(string $message = 'You do not have permission to do this.'): self
    {
        return new self('FORBIDDEN', $message, 403);
    }

    public static function notFound(string $message = 'Not found.'): self
    {
        return new self('NOT_FOUND', $message, 404);
    }

    public static function validation(array $fieldErrors, string $message = 'Please check the highlighted fields.'): self
    {
        return new self('VALIDATION_ERROR', $message, 422, [], $fieldErrors);
    }
}
