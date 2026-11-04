<?php

namespace Tests\Feature;

use Tests\TestCase;

class VerificationTest extends TestCase
{
    /** AC-07: the submitter cannot decide their own submission (separation of duties). */
    public function test_self_approval_is_blocked(): void
    {
        $org = $this->makeOrg('UMP');
        $person = $this->makePerson($org);
        $dual = $this->makeUser([['field_agent', $org], ['verifier']]);
        $otherVerifier = $this->makeUser([['verifier']]);

        $this->as($dual)->postJson("/api/v1/riders/{$person->id}/submit")->assertOk()->assertJsonPath('data.profileStatus', 'submitted');
        $cases = $person->verificationCases()->get();
        $this->assertCount(3, $cases);

        $decision = ['outcome' => 'verified', 'method' => 'document_review', 'reasonCode' => 'documents_match', 'notes' => 'ok'];
        $this->as($dual)->postJson("/api/v1/verification-cases/{$cases[0]->id}/decision", $decision)
            ->assertStatus(422)->assertJsonPath('error.code', 'BUSINESS_RULE');
        $this->assertSame('submitted', $cases[0]->fresh()->status);

        // reason is required
        $this->as($otherVerifier)->postJson("/api/v1/verification-cases/{$cases[0]->id}/decision", ['outcome' => 'verified', 'method' => 'in_person'])
            ->assertStatus(422)->assertJsonPath('error.fieldErrors.reasonCode', fn ($m) => is_string($m));

        foreach ($cases as $i => $case) {
            $this->as($otherVerifier)->postJson("/api/v1/verification-cases/{$case->id}/decision", $decision)->assertOk();
            $expected = $i < 2 ? 'under_review' : 'verified';
            $this->assertSame($expected, $person->fresh()->profile_status);
        }
        $this->as($otherVerifier)->getJson("/api/v1/verification-cases/{$cases[0]->id}")
            ->assertOk()->assertJsonCount(1, 'data.history');
    }

    public function test_field_agent_cannot_decide(): void
    {
        $org = $this->makeOrg('UMP');
        $person = $this->makePerson($org);
        $agent = $this->makeUser([['field_agent', $org]]);
        $this->as($agent)->postJson("/api/v1/riders/{$person->id}/submit")->assertOk();
        $case = $person->verificationCases()->first();
        $this->as($agent)->postJson("/api/v1/verification-cases/{$case->id}/decision", [
            'outcome' => 'verified', 'method' => 'in_person', 'reasonCode' => 'confirmed_in_person',
        ])->assertStatus(403)->assertJsonPath('error.code', 'FORBIDDEN');
    }
}
