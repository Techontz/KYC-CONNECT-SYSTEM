<?php

namespace App\Providers;

use App\Models\User;
use App\Support\ApiException;
use App\Support\Phone;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public const PRIVILEGED_IDLE_MINUTES = 30;

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
        JsonResource::withoutWrapping();

        // Token validity: user must be active; privileged tokens expire after 30 min idle.
        Sanctum::authenticateAccessTokensUsing(function (PersonalAccessToken $token, bool $isValid) {
            if (! $isValid) {
                return false;
            }
            $user = $token->tokenable;
            if (! $user instanceof User || ! $user->isActive()) {
                return false;
            }
            if ($token->name === 'privileged') {
                $last = $token->last_used_at ?? $token->created_at;
                if ($last && $last->lt(now()->subMinutes(self::PRIVILEGED_IDLE_MINUTES))) {
                    return false;
                }
            }

            return true;
        });

        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(240)->by($r->user()?->id ?: $r->ip()));

        $tooMany = fn () => throw new ApiException('RATE_LIMITED', 'Too many requests. Please wait a minute and try again.', 429);
        RateLimiter::for('otp-request', fn (Request $r) => [
            Limit::perMinute(3)->by('otp-phone:'.Phone::normalise((string) $r->input('phoneNumber')))->response($tooMany),
            Limit::perMinute(10)->by('otp-ip:'.$r->ip())->response($tooMany),
        ]);
        RateLimiter::for('otp-verify', fn (Request $r) => [
            Limit::perMinute(10)->by('otp-verify-phone:'.Phone::normalise((string) $r->input('phoneNumber')))->response($tooMany),
            Limit::perMinute(30)->by('otp-verify-ip:'.$r->ip())->response($tooMany),
        ]);
    }
}
