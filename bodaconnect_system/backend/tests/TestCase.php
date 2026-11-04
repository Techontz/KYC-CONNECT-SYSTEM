<?php

namespace Tests;

use App\Models\ConsentRecord;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\Organisation;
use App\Models\OrganisationMembership;
use App\Models\Person;
use App\Models\PrivacyNotice;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    private static int $phoneSeq = 0;

    protected function makeOrg(string $code, string $type = 'association'): Organisation
    {
        return Organisation::create(['name' => "Org {$code}", 'code' => $code, 'type' => $type]);
    }

    protected function makeGroup(Organisation $org, string $code): Group
    {
        return Group::create(['organisation_id' => $org->id, 'name' => "Group {$code}", 'code' => $code]);
    }

    protected function nextPhone(): string
    {
        return sprintf('+2557190%05d', ++self::$phoneSeq);
    }

    protected function makeUser(array $roles, ?string $personId = null, ?string $phone = null): User
    {
        $user = User::create(['phone_e164' => $phone ?? $this->nextPhone(), 'display_name' => 'Test User', 'person_id' => $personId, 'status' => 'active']);
        foreach ($roles as $r) {
            [$role, $org, $group] = array_pad((array) $r, 3, null);
            RoleAssignment::create([
                'user_id' => $user->id, 'role' => $role, 'granted_at' => now(),
                'organisation_id' => $org instanceof Organisation ? $org->id : $org,
                'group_id' => $group instanceof Group ? $group->id : $group,
            ]);
        }

        return $user;
    }

    protected function makePerson(Organisation $org, ?Group $group = null, array $attrs = []): Person
    {
        $p = Person::create(array_merge([
            'legal_name' => 'Rider '.uniqid(),
            'phone_e164' => $this->nextPhone(),
            'profile_status' => 'draft',
            'privacy_notice_version' => '2026-01',
        ], $attrs));
        OrganisationMembership::create(['person_id' => $p->id, 'organisation_id' => $org->id, 'status' => 'active', 'start_at' => now()]);
        if ($group) {
            GroupMembership::create(['person_id' => $p->id, 'group_id' => $group->id, 'status' => 'active', 'start_at' => now()]);
        }
        ConsentRecord::create(['person_id' => $p->id, 'notice_version' => '2026-01', 'purpose' => 'registration', 'granted' => true, 'granted_at' => now()]);

        return $p;
    }

    protected function makeNotice(): PrivacyNotice
    {
        return PrivacyNotice::create(['version' => '2026-01', 'language' => 'en', 'title' => 'Notice', 'content' => 'Text', 'is_active' => true, 'published_at' => now()]);
    }

    /** Authenticated JSON client for a user via a real Sanctum token. */
    protected function as(User $user): static
    {
        $token = $user->createToken('standard', ['*'], now()->addHours(12))->plainTextToken;
        $this->app['auth']->forgetGuards();

        return $this->withHeaders(['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json']);
    }
}
