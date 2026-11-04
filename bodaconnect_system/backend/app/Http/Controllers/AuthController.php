<?php

namespace App\Http\Controllers;

use App\Http\Requests\RequestOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Resources\MeResource;
use App\Models\OtpCode;
use App\Models\User;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Permissions;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public const OTP_TTL_SECONDS = 300;

    public const OTP_MAX_ATTEMPTS = 5;

    public const TOKEN_TTL_HOURS = 12;

    public static function hashCode(string $code): string
    {
        return hash_hmac('sha256', $code, (string) config('app.key'));
    }

    /** Always 200 with the same body whether or not the number is registered (no enumeration). */
    public function requestOtp(RequestOtpRequest $request): JsonResponse
    {
        $phone = Phone::normalise($request->string('phoneNumber'));
        $data = ['sent' => true, 'expiresInSeconds' => self::OTP_TTL_SECONDS];

        $user = User::where('phone_e164', $phone)->first();
        if ($user && $user->isActive()) {
            OtpCode::where('phone_e164', $phone)->whereNull('consumed_at')->update(['consumed_at' => now()]);
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            OtpCode::create([
                'phone_e164' => $phone,
                'code_hash' => self::hashCode($code),
                'expires_at' => now()->addSeconds(self::OTP_TTL_SECONDS),
                'ip_address' => $request->ip(),
            ]);
            // SMS gateway integration goes here. In local dev only, expose the code.
            if (app()->environment('local')) {
                Log::info("[DEV ONLY] BodaConnect OTP for {$phone}: {$code}");
                $data['devCode'] = $code;
            }
        }

        return response()->json(['data' => $data]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $phone = Phone::normalise($request->string('phoneNumber'));
        $invalid = fn () => ApiException::validation(['code' => 'The code is incorrect or has expired. Request a new code.'], 'The code is incorrect or has expired.');

        $otp = OtpCode::where('phone_e164', $phone)->whereNull('consumed_at')->where('expires_at', '>', now())->latest()->first();
        if (! $otp) {
            throw $invalid();
        }
        if ($otp->attempts >= self::OTP_MAX_ATTEMPTS) {
            $otp->update(['consumed_at' => now()]);
            throw $invalid();
        }
        if (! hash_equals($otp->code_hash, self::hashCode((string) $request->input('code')))) {
            $otp->increment('attempts');
            if ($otp->attempts >= self::OTP_MAX_ATTEMPTS) {
                $otp->update(['consumed_at' => now()]);
            }
            throw $invalid();
        }
        $otp->update(['consumed_at' => now()]);

        $user = User::where('phone_e164', $phone)->first();
        if (! $user || ! $user->isActive()) {
            throw $invalid();
        }

        $privileged = $user->activeRoles()->whereIn('role', Permissions::PRIVILEGED_ROLES)->exists();
        $token = $user->createToken($privileged ? 'privileged' : 'standard', ['*'], now()->addHours(self::TOKEN_TTL_HOURS));
        $user->forceFill(['last_login_at' => now()])->save();
        Audit::record('auth.login', $user, ['privileged' => $privileged], $user);

        return response()->json(['data' => [
            'token' => $token->plainTextToken,
            'expiresAt' => now()->addHours(self::TOKEN_TTL_HOURS)->toIso8601ZuluString(),
            'user' => (new MeResource($user->load('person')))->resolve($request),
        ]]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();
        Audit::record('auth.logout', $request->user());

        return response()->json(['data' => ['loggedOut' => true]]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => (new MeResource($request->user()->load('person')))->resolve($request)]);
    }
}
