<?php

namespace Tests\Feature;

use App\Models\DuplicateFlag;
use App\Models\Person;
use Tests\TestCase;

class RiderRegistrationTest extends TestCase
{
    private function payload(string $orgId, array $over = []): array
    {
        return array_merge([
            'legalName' => 'Juma Hamisi Mwakyusa',
            'phoneNumber' => '0712345678',
            'dateOfBirth' => '1990-05-01',
            'gender' => 'male',
            'identityReference' => '19900501-12345-00001-25',
            'organisationId' => $orgId,
            'privacyNoticeVersion' => '2026-01',
            'captureMethod' => 'assisted_registration',
            'consents' => [['purpose' => 'registration', 'granted' => true]],
            'vehicle' => ['vehicleType' => 'motorcycle', 'registrationNumber' => 'MC 123 ABC', 'relationshipType' => 'owner'],
        ], $over);
    }

    /** AC-02: an exact phone match is a 409 and nothing is merged or created. */
    public function test_duplicate_phone_returns_409_without_merge(): void
    {
        $this->makeNotice();
        $org = $this->makeOrg('UMP');
        $existing = $this->makePerson($org, null, ['phone_e164' => '+255712345678']);
        $agent = $this->makeUser([['field_agent', $org]]);
        $before = Person::count();

        $res = $this->as($agent)->postJson('/api/v1/riders', $this->payload($org->id))
            ->assertStatus(409)->assertJsonPath('error.code', 'CONFLICT')
            ->assertJsonPath('error.details.matches.0.id', $existing->id)
            ->assertJsonPath('error.details.matches.0.reason', 'phone');
        $this->assertSame($before, Person::count());
        $this->assertSame($existing->legal_name, $existing->fresh()->legal_name);
    }

    public function test_create_rider_normalises_and_flags_identity_match(): void
    {
        $this->makeNotice();
        $org = $this->makeOrg('UMP');
        $agent = $this->makeUser([['field_agent', $org]]);
        $first = $this->as($agent)->postJson('/api/v1/riders', $this->payload($org->id))->assertCreated();
        $first->assertJsonPath('data.phoneE164', '+255712345678')
            ->assertJsonPath('data.profileStatus', 'draft')
            ->assertJsonPath('data.vehicles.0.registrationNumberNormalised', 'MC123ABC');
        $this->assertMatchesRegularExpression('/^BC-DOD-\d{6}$/', $first->json('data.systemId'));
        $this->assertStringStartsWith('*', $first->json('data.identityReference'));

        $p = Person::find($first->json('data.id'));
        $this->assertNotSame('19900501-12345-00001-25', $p->getRawOriginal('identity_reference'), 'identity must be encrypted at rest');
        $this->assertSame(hash('sha256', '199005011234500001'.'25'), $p->identity_reference_hash);

        // same ID, new phone -> created and flagged, never merged
        $second = $this->as($agent)->postJson('/api/v1/riders', $this->payload($org->id, [
            'phoneNumber' => '+255765000111', 'legalName' => 'Juma H. Mwakyusa', 'vehicle' => null,
        ]))->assertCreated();
        $this->assertSame('identity', $second->json('duplicates.0.reason'));
        $this->assertTrue($second->json('data.duplicateFlag'));
        $this->assertSame(1, DuplicateFlag::where('reason', 'identity')->count());
        $this->assertSame(2, Person::count());
    }

    public function test_validation_errors_use_camel_case_keys(): void
    {
        $org = $this->makeOrg('UMP');
        $agent = $this->makeUser([['field_agent', $org]]);
        $res = $this->as($agent)->postJson('/api/v1/riders', ['organisationId' => $org->id, 'vehicle' => ['vehicleType' => 'car']])
            ->assertStatus(422)->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $fe = $res->json('error.fieldErrors');
        $this->assertArrayHasKey('legalName', $fe);
        $this->assertArrayHasKey('phoneNumber', $fe);
        $this->assertArrayHasKey('vehicle.vehicleType', $fe);
    }

    public function test_idempotency_key_replays_original_response(): void
    {
        $this->makeNotice();
        $org = $this->makeOrg('UMP');
        $agent = $this->makeUser([['field_agent', $org]]);
        $client = $this->as($agent)->withHeaders(['Idempotency-Key' => '6f1c1f8e-2a8b-4a59-9d0e-111111111111']);
        $a = $client->postJson('/api/v1/riders', $this->payload($org->id))->assertCreated();
        $b = $client->postJson('/api/v1/riders', $this->payload($org->id))->assertCreated();
        $this->assertSame($a->json('data.id'), $b->json('data.id'));
        $this->assertSame(1, Person::count());
    }
}
