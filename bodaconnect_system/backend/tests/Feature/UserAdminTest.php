<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Support\Audit;
use Tests\TestCase;

class UserAdminTest extends TestCase
{
    /** US-06: disabling a user revokes all their tokens immediately. */
    public function test_disabling_user_revokes_tokens(): void
    {
        $org = $this->makeOrg('UMP');
        $admin = $this->makeUser([['platform_admin']]);
        $agent = $this->makeUser([['field_agent', $org]]);
        $token = $agent->createToken('standard', ['*'], now()->addHours(12))->plainTextToken;
        $agent->createToken('standard');

        $this->withToken($token)->getJson('/api/v1/me')->assertOk();

        $this->as($admin)->postJson("/api/v1/users/{$agent->id}/disable")->assertOk()->assertJsonPath('data.status', 'disabled');
        $this->assertSame(0, $agent->tokens()->count());
        $this->assertTrue(AuditEvent::where('action', 'user.disabled')->where('entity_id', $agent->id)->exists());

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/me')->assertStatus(401)->assertJsonPath('error.code', 'UNAUTHENTICATED');

        // disabled users cannot obtain an OTP either
        $this->app['env'] = 'local';
        $res = $this->postJson('/api/v1/auth/otp/request', ['phoneNumber' => $agent->phone_e164])->assertOk();
        $this->assertArrayNotHasKey('devCode', $res->json('data'));
    }

    public function test_role_grant_and_revoke_are_audited_and_scoped(): void
    {
        $org = $this->makeOrg('UMP');
        $other = $this->makeOrg('OTH');
        $assoc = $this->makeUser([['association_admin', $org]]);
        $created = $this->as($assoc)->postJson('/api/v1/users', [
            'phoneNumber' => '0744000111', 'legalName' => 'Pendo Lyimo', 'roles' => [['role' => 'field_agent', 'organisationId' => $org->id]],
        ])->assertCreated()->assertJsonPath('data.roles.0.role', 'field_agent');

        $this->as($assoc)->postJson("/api/v1/users/{$created->json('data.id')}/roles", ['role' => 'platform_admin'])->assertStatus(403);
        $this->as($assoc)->postJson("/api/v1/users/{$created->json('data.id')}/roles", ['role' => 'field_agent', 'organisationId' => $other->id])->assertStatus(403);

        $raId = $created->json('data.roles.0.id');
        $this->as($assoc)->deleteJson("/api/v1/role-assignments/{$raId}")->assertOk()->assertJsonPath('data.revokedAt', fn ($v) => $v !== null);
        $this->assertTrue(AuditEvent::where('action', 'role.granted')->exists());
        $this->assertTrue(AuditEvent::where('action', 'role.revoked')->exists());
    }

    public function test_audit_events_are_append_only(): void
    {
        $admin = $this->makeUser([['platform_admin']]);
        $this->as($admin)->getJson('/api/v1/audit-events')->assertOk();
        $e = Audit::record('test.event', null, ['otpCode' => '123456', 'identityReference' => 'X1', 'reasonCode' => 'ok'], $admin);
        $this->assertSame('[REDACTED]', $e->metadata['otpCode']);
        $this->assertSame('[REDACTED]', $e->metadata['identityReference']);
        $this->assertSame('ok', $e->metadata['reasonCode']);
        $this->expectException(\LogicException::class);
        $e->update(['action' => 'changed']);
    }
}
