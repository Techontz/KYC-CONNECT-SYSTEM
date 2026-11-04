<?php

namespace Tests\Feature;

use Tests\TestCase;

class ScopeTest extends TestCase
{
    /** AC-05: a group leader sees only their group's members, with minimal fields. */
    public function test_group_leader_cannot_see_other_groups(): void
    {
        $org = $this->makeOrg('UMP');
        $jam = $this->makeGroup($org, 'JAM');
        $nye = $this->makeGroup($org, 'NYE');
        $mine = $this->makePerson($org, $jam, ['identity_reference' => 'NIDA-12345678']);
        $other = $this->makePerson($org, $nye);
        $leader = $this->makeUser([['group_leader', $org, $jam]]);

        $list = $this->as($leader)->getJson('/api/v1/riders')->assertOk();
        $ids = collect($list->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($mine->id));
        $this->assertFalse($ids->contains($other->id));
        $this->assertSame(1, $list->json('meta.total'));

        $this->as($leader)->getJson("/api/v1/riders/{$other->id}")->assertStatus(404)->assertJsonPath('error.code', 'NOT_FOUND');
        $this->as($leader)->getJson("/api/v1/groups/{$nye->id}/members")->assertStatus(404);
        $this->as($leader)->getJson("/api/v1/groups/{$jam->id}/members")->assertOk()->assertJsonPath('meta.total', 1);

        $show = $this->as($leader)->getJson("/api/v1/riders/{$mine->id}")->assertOk()->assertJsonPath('data.limitedView', true);
        $this->assertArrayNotHasKey('identityReference', $show->json('data'));
        $this->assertArrayNotHasKey('dateOfBirth', $show->json('data'));

        // no exports, no PATCH
        $this->as($leader)->postJson('/api/v1/reports/exports', ['reportType' => 'rider_roster', 'purpose' => 'Monthly roster check'])->assertStatus(403);
    }

    /** AC-06: cross-organisation id returns 404 (not 403). */
    public function test_cross_org_id_returns_404(): void
    {
        $a = $this->makeOrg('AAA');
        $b = $this->makeOrg('BBB');
        $riderB = $this->makePerson($b);
        $riderA = $this->makePerson($a);
        $agentA = $this->makeUser([['field_agent', $a]]);

        $this->as($agentA)->getJson("/api/v1/riders/{$riderB->id}")->assertStatus(404)->assertJsonPath('error.code', 'NOT_FOUND');
        $this->as($agentA)->patchJson("/api/v1/riders/{$riderB->id}", ['preferredName' => 'X'])->assertStatus(404);
        $this->as($agentA)->getJson("/api/v1/organisations/{$b->id}")->assertStatus(404);
        $this->as($agentA)->getJson("/api/v1/riders/{$riderA->id}")->assertOk()->assertJsonPath('data.limitedView', false);

        $ids = collect($this->as($agentA)->getJson('/api/v1/riders?perPage=100')->json('data'))->pluck('id');
        $this->assertEquals([$riderA->id], $ids->all());

        // identity is masked for field agents
        $riderA->update(['identity_reference' => 'ABCDEF123456']);
        $this->as($agentA)->getJson("/api/v1/riders/{$riderA->id}")->assertJsonPath('data.identityReference', '********3456');
    }

    public function test_rider_sees_only_self(): void
    {
        $org = $this->makeOrg('UMP');
        $me = $this->makePerson($org);
        $other = $this->makePerson($org);
        $user = $this->makeUser([['rider', $org]], $me->id);

        $this->as($user)->getJson('/api/v1/riders')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $me->id);
        $this->as($user)->getJson("/api/v1/riders/{$other->id}")->assertStatus(404);
        // protected field change is a business rule error for the rider
        $this->as($user)->patchJson("/api/v1/riders/{$me->id}", ['legalName' => 'New Name'])->assertStatus(422)->assertJsonPath('error.code', 'BUSINESS_RULE');
        $this->as($user)->patchJson("/api/v1/riders/{$me->id}", ['preferredName' => 'Boda'])->assertOk()->assertJsonPath('data.preferredName', 'Boda');
    }
}
