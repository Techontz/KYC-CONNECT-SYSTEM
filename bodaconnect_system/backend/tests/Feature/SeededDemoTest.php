<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class SeededDemoTest extends TestCase
{
    public function test_demo_users_and_dashboard(): void
    {
        $this->seed();
        $roles = [
            '+255700000001' => 'platform_admin', '+255700000002' => 'verifier', '+255700000003' => 'field_agent',
            '+255700000004' => 'association_admin', '+255700000005' => 'group_leader', '+255700000006' => 'rider',
        ];
        foreach ($roles as $phone => $role) {
            $this->assertTrue(User::where('phone_e164', $phone)->firstOrFail()->activeRoles()->where('role', $role)->exists(), $phone);
        }
        $admin = User::where('phone_e164', '+255700000001')->first();
        $res = $this->as($admin)->getJson('/api/v1/dashboard/summary')->assertOk();
        $this->assertGreaterThanOrEqual(110, $res->json('data.totals.riders'));
        $this->assertSame(8, $res->json('data.groupCoverage.total'));
        $this->assertCount(30, $res->json('data.registrationsByDay'));
        $this->assertNotNull($res->json('data.medianTurnaroundHours'));

        $leader = User::where('phone_e164', '+255700000005')->first();
        $total = $this->as($leader)->getJson('/api/v1/riders')->assertOk()->json('meta.total');
        $this->assertLessThan(30, $total);
        $this->assertGreaterThan(0, $total);

        $rider = User::where('phone_e164', '+255700000006')->first();
        $this->as($rider)->getJson('/api/v1/riders')->assertJsonPath('meta.total', 1);
        $this->as($rider)->getJson('/api/v1/dashboard/summary')->assertStatus(403);
    }
}
