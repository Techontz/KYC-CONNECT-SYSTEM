<?php

namespace App\Support;

/** Tanzanian phone normalisation to E.164 (0712345678 -> +255712345678). */
class Phone
{
    public static function normalise(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }
        $d = preg_replace('/[^0-9+]/', '', $input);
        if (str_starts_with($d, '+')) {
            $d = substr($d, 1);
        } elseif (str_starts_with($d, '00')) {
            $d = substr($d, 2);
        } elseif (str_starts_with($d, '0') && strlen($d) === 10) {
            $d = '255'.substr($d, 1);
        } elseif (strlen($d) === 9 && in_array($d[0], ['6', '7'], true)) {
            $d = '255'.$d;
        }
        if (! preg_match('/^255[67]\d{8}$/', $d)) {
            return null;
        }

        return '+'.$d;
    }

    public static function mask(?string $e164): ?string
    {
        if (! $e164) {
            return null;
        }

        return substr($e164, 0, 5).str_repeat('*', max(0, strlen($e164) - 8)).substr($e164, -3);
    }
}
