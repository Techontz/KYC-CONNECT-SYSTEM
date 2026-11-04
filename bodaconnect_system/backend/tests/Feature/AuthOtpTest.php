<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Models\OtpCode;
use Tests\TestCase;

class AuthOtpTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->app['env'] = 'local'; // devCode is only exposed in local
    }

    public function test_otp_login_flow_returns_token_and_me(): void
    {
        $org = $this->makeOrg('UMP');
        $this->makeUser([['field_agent', $org]], null, '+255700000003');

        $res = $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => '0700000003']);
        $res->assertOk()->assertJsonPath('data.sent', true)->assertJsonPath('data.expiresInSeconds', 300);
        $this->assertNotEmpty($res->headers->get('X-Request-Id'));
        $code = $res->json('data.devCode');
        $this->assertMatchesRegularExpression('/^\d{6}$/', $code);

        $otp = OtpCode::first();
        $this->assertNotSame($code, $otp->code_hash, 'OTP must be stored hashed');
        $this->assertSame('+255700000003', $otp->phone_e164);

        $verify = $this->postJson('/api/v1/auth/otp/verify', ['phoneNumber' => '+255700000003', 'code' => $code]);
        $verify->assertOk()->assertJsonPath('data.user.phoneE164', '+255700000003')
            ->assertJsonPath('data.user.roles.0.role', 'field_agent');
        $token = $verify->json('data.token');

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/me')->assertOk()
            ->assertJsonPath('data.roles.0.organisationName', 'Org UMP')
            ->assertJsonStructure(['data' => ['id', 'phoneE164', 'status', 'person', 'roles', 'permissions']]);

        $this->assertTrue(AuditEvent::where('action', 'auth.login')->exists());
        $meta = json_encode(AuditEvent::pluck('metadata'));
        $this->assertStringNotContainsString($code, $meta, 'OTP must never be written to audit metadata');

        // single use
        $this->postJson('/api/v1/auth/otp/verify', ['phoneNumber' => '+255700000003', 'code' => $code])
            ->assertStatus(422)->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_unknown_number_gets_identical_response_without_code(): void
    {
        $res = $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => '+255799999999']);
        $res->assertOk()->assertExactJson(['data' => ['sent' => true, 'expiresInSeconds' => 300]]);
        $this->assertSame(0, OtpCode::count());
    }

    public function test_wrong_code_is_limited_to_five_attempts(): void
    {
        $this->makeUser([['rider']], null, '+255711000001');
        $code = $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => '+255711000001'])->json('data.devCode');
        $wrong = $code === '000000' ? '111111' : '000000';
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/otp/verify', ['phoneNumber' => '+255711000001', 'code' => $wrong])
                ->assertStatus(422)->assertJsonStructure(['error' => ['code', 'message', 'fieldErrors' => ['code'], 'requestId']]);
        }
        // even the right code no longer works after 5 failures
        $this->postJson('/api/v1/auth/otp/verify', ['phoneNumber' => '+255711000001', 'code' => $code])->assertStatus(422);
    }

    public function test_otp_request_is_rate_limited_per_phone(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => '+255722000001'])->assertOk();
        }
        $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => '+255722000001'])
            ->assertStatus(429)->assertJsonPath('error.code', 'RATE_LIMITED');
    }

    public function test_invalid_phone_maps_to_camel_case_field_errors(): void
    {
        $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => '12'], ['X-Request-Id' => 'test-request-123'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.fieldErrors.phoneNumber', 'Enter a valid phone number.')
            ->assertJsonPath('error.requestId', 'test-request-123')
            ->assertHeader('X-Request-Id', 'test-request-123');
    }

    public function test_dev_code_hidden_outside_local(): void
    {
        $this->app['env'] = 'production';
        $this->makeUser([['rider']], null, '+255733000001');
        $res = $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => '+255733000001'])->assertOk();
        $this->assertArrayNotHasKey('devCode', $res->json('data'));
    }

    public function test_unauthenticated_envelope(): void
    {
        $this->getJson('/api/v1/me')->assertStatus(401)->assertJsonPath('error.code', 'UNAUTHENTICATED');
    }
}
