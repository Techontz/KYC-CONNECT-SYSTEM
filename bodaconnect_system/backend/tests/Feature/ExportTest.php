<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use Tests\TestCase;

class ExportTest extends TestCase
{
    /** AC-10: exports require permission, a purpose, and are audited. */
    public function test_export_requires_permission_and_is_audited(): void
    {
        $org = $this->makeOrg('UMP');
        $this->makePerson($org, null, ['legal_name' => 'Amina Said Mollel', 'identity_reference' => 'SECRET-ID-998877']);
        $agent = $this->makeUser([['field_agent', $org]]);
        $admin = $this->makeUser([['association_admin', $org]]);
        $body = ['reportType' => 'rider_roster', 'purpose' => 'Monthly association roster review', 'filters' => ['organisationId' => $org->id]];

        $this->as($agent)->postJson('/api/v1/reports/exports', $body)->assertStatus(403)->assertJsonPath('error.code', 'FORBIDDEN');
        $this->assertSame(0, AuditEvent::where('action', 'export.created')->count());

        $this->as($admin)->postJson('/api/v1/reports/exports', ['reportType' => 'rider_roster', 'purpose' => 'short'])
            ->assertStatus(422)->assertJsonStructure(['error' => ['fieldErrors' => ['purpose']]]);

        $res = $this->as($admin)->postJson('/api/v1/reports/exports', $body)->assertCreated()->assertJsonPath('data.rowCount', 1);
        $event = AuditEvent::where('action', 'export.created')->first();
        $this->assertNotNull($event);
        $this->assertSame($admin->id, $event->actor_user_id);
        $this->assertSame('Monthly association roster review', $event->metadata['purpose']);

        $dl = $this->as($admin)->get("/api/v1/reports/exports/{$res->json('data.id')}/download")->assertOk();
        $csv = $dl->streamedContent();
        $this->assertStringContainsString('Amina Said Mollel', $csv);
        $this->assertStringNotContainsString('SECRET-ID-998877', $csv, 'exports must not include identity numbers');
        $this->assertTrue(AuditEvent::where('action', 'export.downloaded')->exists());

        // another user cannot download it; it expires after 15 minutes
        $other = $this->makeUser([['association_admin', $org]]);
        $this->as($other)->getJson("/api/v1/reports/exports/{$res->json('data.id')}/download")->assertStatus(404);
        $this->travel(16)->minutes();
        $this->as($admin)->getJson("/api/v1/reports/exports/{$res->json('data.id')}/download")->assertStatus(422)->assertJsonPath('error.code', 'BUSINESS_RULE');
    }
}
