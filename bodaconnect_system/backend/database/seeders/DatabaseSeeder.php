<?php

namespace Database\Seeders;

use App\Models\AuditEvent;
use App\Models\ConsentRecord;
use App\Models\DuplicateFlag;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\InAppNotification;
use App\Models\Organisation;
use App\Models\OrganisationMembership;
use App\Models\ParkingPoint;
use App\Models\Person;
use App\Models\PrivacyNotice;
use App\Models\RoleAssignment;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleRelationship;
use App\Models\VerificationCase;
use App\Models\VerificationDecision;
use App\Support\Audit;
use App\Support\Completeness;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Deterministic synthetic pilot data for the UMAPIDO Dodoma pilot. All names, phone numbers,
 * ID numbers and plates are fictitious. Uses mt_rand with a fixed seed (no Faker).
 */
class DatabaseSeeder extends Seeder
{
    private const MALE = ['Juma', 'Hamisi', 'Baraka', 'Saidi', 'Ally', 'Bakari', 'Rajabu', 'Omari', 'Musa', 'Yusufu', 'Daudi', 'Emmanuel',
        'Joseph', 'Elia', 'Shabani', 'Ramadhani', 'Athumani', 'Selemani', 'Abdallah', 'Frank', 'Godfrey', 'Idd', 'Japhet', 'Kassim',
        'Mohamedi', 'Nassoro', 'Petro', 'Salum', 'Tumaini', 'Zuberi', 'Amosi', 'Erasto', 'Festo', 'Issa', 'Mussa', 'Yohana'];

    private const FEMALE = ['Neema', 'Rehema', 'Amina', 'Zawadi', 'Mwanaidi', 'Halima', 'Upendo', 'Imani', 'Asha', 'Mariamu', 'Pendo', 'Furaha'];

    private const SURNAMES = ['Mwakyusa', 'Mrisho', 'Kombo', 'Mollel', 'Mushi', 'Said', 'Lyimo', 'Massawe', 'Mapunda', 'Nyirenda', 'Chande',
        'Kisanga', 'Mfinanga', 'Shayo', 'Swai', 'Temba', 'Urio', 'Makame', 'Mbwana', 'Njau', 'Kimaro', 'Magesa', 'Mtui', 'Ngowi',
        'Chilongani', 'Mazengo', 'Malecela', 'Chiwanga', 'Nyau', 'Mlowe', 'Chaula', 'Mhagama', 'Kibasa', 'Mkude', 'Mbilinyi', 'Sanga'];

    private const NICKNAMES = ['Bonge', 'Mzee', 'Dogo', 'Kaka', 'Chalii', 'Mwamba', 'Simba', 'Jembe', 'Fundi', 'Mshua', 'Babu', 'Kijana'];

    private const MAKES = [['Boxer', 'BM 150'], ['TVS', 'HLX 125'], ['Haojue', 'HJ150'], ['Kinglion', 'KL150'], ['Sanlg', 'SL150'], ['Honda', 'CG125']];

    private const COLOURS = ['Nyekundu', 'Nyeusi', 'Bluu', 'Nyeupe', 'Kijani', 'Fedha'];

    private int $seq = 0;

    private function pick(array $a)
    {
        return $a[mt_rand(0, count($a) - 1)];
    }

    public function run(): void
    {
        mt_srand(20260101);
        $now = Carbon::now()->startOfHour();

        // ------------------------------------------------------------------ organisations
        $platform = Organisation::create(['name' => 'BodaConnect (Wadonge Group Limited)', 'code' => 'BC', 'type' => 'platform', 'region' => 'Dodoma']);
        $umapido = Organisation::create(['name' => 'UMAPIDO Dodoma', 'code' => 'UMAPIDO', 'type' => 'association', 'region' => 'Dodoma']);

        // ------------------------------------------------------------------ privacy notice 2026-01
        $noticeSw = PrivacyNotice::create([
            'version' => '2026-01', 'language' => 'sw', 'is_active' => true, 'published_at' => $now->copy()->subDays(60),
            'title' => 'Taarifa ya Faragha ya BodaConnect',
            'content' => "BodaConnect (Wadonge Group Limited) inakusanya jina lako, namba ya simu, tarehe ya kuzaliwa, namba ya kitambulisho, taarifa za chombo chako na uanachama wako wa UMAPIDO ili kukusajili na kuthibitisha taarifa zako.\n\nTaarifa zako zinatumika kwa usajili, uthibitisho na huduma za chama tu. Hatutoi taarifa zako kwa mtu mwingine bila ridhaa yako au sababu ya kisheria.\n\nUna haki ya kuona, kurekebisha au kuondoa ridhaa yako wakati wowote kupitia afisa wa uga au kwa kutuma ombi la msaada.\n\nTaarifa zinahifadhiwa kwa usalama na zinapatikana kwa watumishi walioidhinishwa tu.",
        ]);
        PrivacyNotice::create([
            'version' => '2026-01', 'language' => 'en', 'is_active' => true, 'published_at' => $now->copy()->subDays(60),
            'title' => 'BodaConnect Privacy Notice',
            'content' => "BodaConnect (Wadonge Group Limited) collects your name, phone number, date of birth, ID number, vehicle details and UMAPIDO membership in order to register you and verify your details.\n\nYour data is used only for registration, verification and association services. We do not share your data with anyone else without your consent or a legal basis.\n\nYou can view or correct your data, or withdraw consent, at any time through a field agent or by sending a support request.\n\nData is stored securely and is only accessible to authorised staff.",
        ]);

        // ------------------------------------------------------------------ groups & parking points
        $groupDefs = [
            ['Kikundi cha Jamatini', 'JAM'], ['Nyerere Square', 'NYE'], ['Makole', 'MAK'], ['Area D', 'ARD'],
            ['Chamwino', 'CHA'], ['Kisasa', 'KIS'], ['Mnadani', 'MNA'], ['Ipagala', 'IPA'],
        ];
        $groups = [];
        foreach ($groupDefs as [$name, $code]) {
            $groups[$code] = Group::create(['organisation_id' => $umapido->id, 'name' => $name, 'code' => $code, 'created_at' => $now->copy()->subDays(58)]);
        }
        $ppDefs = [
            ['Jamatini Stendi', 'Majengo', 'JAM', -6.1722, 35.7460], ['Soko Kuu Majengo', 'Majengo', 'JAM', -6.1749, 35.7479],
            ['Nyerere Square', 'Uhuru', 'NYE', -6.1730, 35.7419], ['Mtaa wa Uhuru', 'Uhuru', 'NYE', -6.1765, 35.7401],
            ['Lango la Uwanja wa Ndege', 'Kiwanja cha Ndege', 'ARD', -6.1700, 35.7520], ['Barabara ya Viwandani', 'Viwandani', 'ARD', -6.1810, 35.7550],
            ['Makole Junction', 'Makole', 'MAK', -6.1650, 35.7590], ['Barabara ya Hospitali Kilimani', 'Kilimani', 'MAK', -6.1690, 35.7350],
            ['Soko la Chamwino', 'Chamwino', 'CHA', -6.1950, 35.7700], ['Lango la UDOM', 'Kikuyu Kusini', 'KIS', -6.2050, 35.7980],
            ['Mzunguko wa Nkuhungu', 'Nkuhungu', 'KIS', -6.1520, 35.7330], ['Soko la Mnadani', 'Mnadani', 'MNA', -6.1900, 35.7300],
            ['Tambukareli Stendi', 'Tambukareli', 'MNA', -6.1780, 35.7320], ['Ipagala Stendi', 'Ipagala', 'IPA', -6.2010, 35.7600],
        ];
        $pps = [];
        foreach ($ppDefs as [$name, $ward, $code, $lat, $lng]) {
            $pps[$code][] = ParkingPoint::create([
                'organisation_id' => $umapido->id, 'group_id' => $groups[$code]->id, 'name' => $name, 'ward' => $ward,
                'area' => 'Dodoma Mjini', 'latitude' => $lat, 'longitude' => $lng,
            ]);
        }

        // ------------------------------------------------------------------ demo staff users
        $mkUser = fn (string $phone, string $name, ?string $personId = null) => User::create([
            'phone_e164' => $phone, 'display_name' => $name, 'person_id' => $personId, 'status' => 'active',
        ]);
        $role = fn (User $u, string $r, ?string $org = null, ?string $group = null) => RoleAssignment::create([
            'user_id' => $u->id, 'role' => $r, 'organisation_id' => $org, 'group_id' => $group, 'granted_at' => $now->copy()->subDays(59),
        ]);
        $admin = $mkUser('+255700000001', 'Neema Mollel');
        $role($admin, 'platform_admin');
        $verifier = $mkUser('+255700000002', 'Baraka Mushi');
        $role($verifier, 'verifier');
        $agent = $mkUser('+255700000003', 'Rehema Said');
        $role($agent, 'field_agent', $umapido->id);
        $assocAdmin = $mkUser('+255700000004', 'Hamisi Kombo');
        $role($assocAdmin, 'association_admin', $umapido->id);

        // ------------------------------------------------------------------ riders
        // Status distribution across the funnel (120 riders).
        $statuses = array_merge(
            array_fill(0, 22, 'draft'), array_fill(0, 18, 'submitted'), array_fill(0, 14, 'under_review'),
            array_fill(0, 48, 'verified'), array_fill(0, 12, 'correction_required'), array_fill(0, 4, 'rejected'), array_fill(0, 2, 'archived'),
        );
        $groupCodes = array_keys($groups);
        $usedNames = [];
        $people = [];

        for ($i = 0; $i < 120; $i++) {
            $female = mt_rand(1, 100) <= 8;
            do {
                $name = $this->pick($female ? self::FEMALE : self::MALE).' '.$this->pick(self::MALE).' '.$this->pick(self::SURNAMES);
            } while (isset($usedNames[$name]));
            $usedNames[$name] = true;

            $status = $statuses[$i];
            if ($i === 0) { // demo group leader
                $name = 'Saidi Juma Mrisho';
                $status = 'verified';
            } elseif ($i === 1) { // demo rider
                $name = 'Juma Hamisi Mwakyusa';
                $status = 'verified';
            }
            $code = $i < 2 ? 'JAM' : $groupCodes[$i % count($groupCodes)];
            $createdAt = $i < 2 ? $now->copy()->subDays(50) : $now->copy()->subDays(mt_rand(0, 44))->subMinutes(mt_rand(0, 600));
            $isDraft = $status === 'draft';
            $dob = Carbon::create(mt_rand(1975, 2004), mt_rand(1, 12), mt_rand(1, 28));
            $hasId = ! $isDraft || mt_rand(1, 100) <= 50;

            $person = Person::create([
                'legal_name' => $name,
                'preferred_name' => mt_rand(1, 100) <= 35 ? $this->pick(self::NICKNAMES) : null,
                'phone_e164' => sprintf('+2557%d%07d', [1, 5, 6, 8][$i % 4], (1234567 + $i * 7919) % 10000000),
                'date_of_birth' => ($isDraft && mt_rand(1, 100) <= 30) ? null : $dob,
                'gender' => ($isDraft && mt_rand(1, 100) <= 20) ? null : ($female ? 'female' : 'male'),
                'identity_reference' => $hasId ? sprintf('%s-%05d-%05d-%02d', $dob->format('Ymd'), mt_rand(10000, 99999), 10000 + $i, mt_rand(10, 99)) : null,
                'profile_status' => $status,
                'capture_method' => mt_rand(1, 100) <= 85 ? 'assisted_registration' : 'self_registration',
                'privacy_notice_version' => '2026-01',
                'created_by_user_id' => $agent->id,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $people[] = $person;

            OrganisationMembership::create([
                'person_id' => $person->id, 'organisation_id' => $umapido->id, 'status' => $status === 'archived' ? 'ended' : 'active',
                'membership_number' => sprintf('UMP-%04d', 100 + $i), 'start_at' => $createdAt,
                'verification_status' => $status === 'verified' ? 'verified' : 'pending',
                'end_at' => $status === 'archived' ? $now->copy()->subDays(2) : null,
            ]);
            if (! ($isDraft && mt_rand(1, 100) <= 25)) {
                GroupMembership::create([
                    'person_id' => $person->id, 'group_id' => $groups[$code]->id,
                    'parking_point_id' => ($isDraft && mt_rand(1, 100) <= 30) ? null : $this->pick($pps[$code])->id,
                    'role' => 'member', 'status' => $status === 'archived' ? 'ended' : 'active', 'start_at' => $createdAt,
                ]);
            }
            ConsentRecord::create([
                'person_id' => $person->id, 'privacy_notice_id' => $noticeSw->id, 'notice_version' => '2026-01', 'purpose' => 'registration',
                'granted' => true, 'capture_method' => $person->capture_method, 'captured_by_user_id' => $agent->id, 'granted_at' => $createdAt,
            ]);
            foreach (['association_membership' => 90, 'sms_notifications' => 75, 'partner_services' => 40] as $purpose => $pct) {
                $g = mt_rand(1, 100) <= $pct;
                ConsentRecord::create([
                    'person_id' => $person->id, 'privacy_notice_id' => $noticeSw->id, 'notice_version' => '2026-01', 'purpose' => $purpose,
                    'granted' => $g, 'capture_method' => $person->capture_method, 'captured_by_user_id' => $agent->id, 'granted_at' => $g ? $createdAt : null,
                ]);
            }
            if (! ($isDraft && mt_rand(1, 100) <= 40)) {
                [$make, $model] = $this->pick(self::MAKES);
                $bajaji = mt_rand(1, 100) <= 10;
                $plate = sprintf('MC %03d %s', 100 + $i * 7 % 900, chr(65 + intdiv($i, 26) % 26).chr(65 + $i % 26).chr(65 + ($i * 3) % 26));
                $vehicle = Vehicle::create([
                    'vehicle_type' => $bajaji ? 'bajaji' : 'motorcycle', 'registration_number' => $plate,
                    'registration_number_normalised' => Vehicle::normalisePlate($plate),
                    'make' => $bajaji ? 'Bajaj' : $make, 'model' => $bajaji ? 'RE 205' : $model, 'colour' => $this->pick(self::COLOURS),
                    'organisation_id' => $umapido->id, 'created_by_user_id' => $agent->id, 'created_at' => $createdAt,
                ]);
                VehicleRelationship::create([
                    'vehicle_id' => $vehicle->id, 'person_id' => $person->id, 'relationship_type' => mt_rand(1, 100) <= 45 ? 'owner' : 'operator',
                    'verification_status' => $status === 'verified' ? 'verified' : 'pending', 'start_at' => $createdAt, 'created_by_user_id' => $agent->id,
                ]);
            }

            $this->seedVerification($person, $status, $createdAt, $agent, $verifier, $now);
            Completeness::refresh($person);

            $this->audit('rider.created', $agent, $person, $createdAt, $umapido->id, ['captureMethod' => $person->capture_method]);
            if (! $isDraft) {
                $this->audit('rider.submitted', $agent, $person, $person->submitted_at ?? $createdAt, $umapido->id);
            }
        }

        // ------------------------------------------------------------------ group leaders (6 of 8 groups covered)
        $leaderUser = $mkUser('+255700000005', 'Saidi Juma Mrisho', $people[0]->id);
        $role($leaderUser, 'group_leader', $umapido->id, $groups['JAM']->id);
        $groups['JAM']->update(['leader_person_id' => $people[0]->id]);
        GroupMembership::where('person_id', $people[0]->id)->update(['role' => 'leader']);
        foreach (['NYE', 'MAK', 'ARD', 'CHA', 'MNA'] as $code) {
            $m = GroupMembership::where('group_id', $groups[$code]->id)->where('status', 'active')
                ->whereHas('person', fn ($p) => $p->where('profile_status', 'verified'))->orderBy('start_at')->first();
            if ($m) {
                $groups[$code]->update(['leader_person_id' => $m->person_id]);
                $m->update(['role' => 'leader']);
            }
        }

        // ------------------------------------------------------------------ demo rider
        $riderUser = $mkUser('+255700000006', 'Juma Hamisi Mwakyusa', $people[1]->id);
        $role($riderUser, 'rider', $umapido->id);

        // ------------------------------------------------------------------ duplicate flags
        // 1. identity: a new draft re-uses rider #10's ID number
        $src = $people[10];
        $dupe = Person::create([
            'legal_name' => $src->legal_name, 'phone_e164' => '+255789000111', 'date_of_birth' => $src->date_of_birth, 'gender' => $src->gender,
            'identity_reference' => $src->identity_reference, 'profile_status' => 'draft', 'capture_method' => 'self_registration',
            'privacy_notice_version' => '2026-01', 'created_by_user_id' => $agent->id, 'created_at' => $now->copy()->subDays(3),
        ]);
        OrganisationMembership::create(['person_id' => $dupe->id, 'organisation_id' => $umapido->id, 'status' => 'active', 'start_at' => $now->copy()->subDays(3)]);
        ConsentRecord::create(['person_id' => $dupe->id, 'notice_version' => '2026-01', 'purpose' => 'registration', 'granted' => true, 'granted_at' => $now->copy()->subDays(3)]);
        Completeness::refresh($dupe);
        DuplicateFlag::create(['person_id' => $dupe->id, 'matched_person_id' => $src->id, 'reason' => 'identity', 'status' => 'open', 'raised_by_user_id' => $agent->id, 'created_at' => $now->copy()->subDays(3)]);
        DuplicateFlag::create(['person_id' => $dupe->id, 'matched_person_id' => $src->id, 'reason' => 'name', 'status' => 'open', 'raised_by_user_id' => $agent->id, 'created_at' => $now->copy()->subDays(3)]);
        $this->audit('rider.created', $agent, $dupe, $now->copy()->subDays(3), $umapido->id, ['duplicateMatches' => 2]);

        // 2. plate: rider #20 also registered against the first later rider's motorcycle
        $vehicleRel = VehicleRelationship::whereIn('person_id', collect($people)->slice(21)->pluck('id'))
            ->where('person_id', '!=', $people[20]->id)->orderBy('created_at')->orderBy('id')->first();
        if ($vehicleRel) {
            VehicleRelationship::create([
                'vehicle_id' => $vehicleRel->vehicle_id, 'person_id' => $people[20]->id,
                'relationship_type' => $vehicleRel->relationship_type === 'owner' ? 'operator' : 'keeper', 'start_at' => $now->copy()->subDays(5),
                'created_by_user_id' => $agent->id,
            ]);
            DuplicateFlag::create(['person_id' => $people[20]->id, 'matched_person_id' => $vehicleRel->person_id, 'matched_vehicle_id' => $vehicleRel->vehicle_id,
                'reason' => 'plate', 'status' => 'open', 'raised_by_user_id' => $agent->id, 'created_at' => $now->copy()->subDays(5)]);
        }
        // 3. a resolved historic flag
        DuplicateFlag::create(['person_id' => $people[30]->id, 'matched_person_id' => $people[31]->id, 'reason' => 'name', 'status' => 'not_duplicate',
            'notes' => 'Different people: confirmed in person at the parking point.', 'raised_by_user_id' => $agent->id,
            'resolved_by_user_id' => $verifier->id, 'resolved_at' => $now->copy()->subDays(9), 'created_at' => $now->copy()->subDays(12)]);

        // ------------------------------------------------------------------ support requests
        SupportRequest::create(['category' => 'correction', 'status' => 'open', 'description' => 'Correction requested for preferredName',
            'subject_person_id' => $people[1]->id, 'organisation_id' => $umapido->id, 'requested_by_user_id' => $riderUser->id,
            'field' => 'preferredName', 'proposed_value' => 'Juma Boda', 'reason' => 'Ninajulikana kwa jina hili kwenye kituo.', 'created_at' => $now->copy()->subDays(1)]);
        SupportRequest::create(['category' => 'help', 'status' => 'open', 'description' => 'Sijapokea ujumbe wa uthibitisho wa simu yangu.',
            'subject_person_id' => $people[5]->id, 'organisation_id' => $umapido->id, 'requested_by_user_id' => $agent->id, 'created_at' => $now->copy()->subDays(2)]);
        SupportRequest::create(['category' => 'complaint', 'status' => 'in_progress', 'description' => 'Rider reports being asked for payment to register at Makole Junction.',
            'subject_person_id' => $people[14]->id, 'organisation_id' => $umapido->id, 'requested_by_user_id' => $assocAdmin->id, 'created_at' => $now->copy()->subDays(4)]);
        SupportRequest::create(['category' => 'correction', 'status' => 'open', 'description' => 'Correction requested for legalName',
            'subject_person_id' => $people[40]->id, 'organisation_id' => $umapido->id, 'requested_by_user_id' => $agent->id,
            'field' => 'legalName', 'proposed_value' => $people[40]->legal_name.'i', 'reason' => 'Spelling on NIDA card differs from the record.', 'created_at' => $now->copy()->subDays(1)]);
        SupportRequest::create(['category' => 'help', 'status' => 'resolved', 'description' => 'How do I change my parking point?',
            'subject_person_id' => $people[7]->id, 'organisation_id' => $umapido->id, 'requested_by_user_id' => $agent->id,
            'resolution_summary' => 'Group membership moved by the association admin.', 'resolved_by_user_id' => $assocAdmin->id,
            'resolved_at' => $now->copy()->subDays(6), 'created_at' => $now->copy()->subDays(8)]);

        // ------------------------------------------------------------------ notifications
        foreach ([$admin, $verifier, $agent, $assocAdmin, $leaderUser, $riderUser] as $u) {
            InAppNotification::create(['user_id' => $u->id, 'type' => 'announcement', 'title' => 'Karibu BodaConnect OS',
                'body' => 'Welcome to the UMAPIDO Dodoma pilot. Usajili wa madereva unaendelea.', 'data' => ['organisationId' => $umapido->id],
                'created_at' => $now->copy()->subDays(10)]);
        }
        InAppNotification::create(['user_id' => $riderUser->id, 'type' => 'verification_decision', 'title' => 'Verification update',
            'body' => 'Your identity check has been verified.', 'data' => [], 'created_at' => $now->copy()->subDays(40)]);
        InAppNotification::create(['user_id' => $leaderUser->id, 'type' => 'announcement', 'title' => 'Mkutano wa viongozi',
            'body' => 'Group leaders meeting on Saturday at Nyerere Square, 10:00.', 'data' => [], 'created_at' => $now->copy()->subDays(2)]);
        InAppNotification::create(['user_id' => $verifier->id, 'type' => 'queue', 'title' => 'Verification queue',
            'body' => 'There are new rider submissions waiting for review.', 'data' => [], 'created_at' => $now->copy()->subHours(5)]);

        $this->audit('auth.login', $admin, $admin, $now->copy()->subHours(3));
    }

    private function seedVerification(Person $p, string $status, Carbon $createdAt, User $agent, User $verifier, Carbon $now): void
    {
        if (in_array($status, ['draft'], true)) {
            return;
        }
        $submittedAt = $createdAt->copy()->addHours(mt_rand(1, 20));
        if ($submittedAt->gt($now)) {
            $submittedAt = $now->copy()->subMinutes(30);
        }
        $p->forceFill(['submitted_at' => $submittedAt, 'submitted_by_user_id' => $agent->id])->saveQuietly();

        $types = ['identity', 'membership', 'phone'];
        $special = $types[mt_rand(0, 2)];
        foreach ($types as $type) {
            $caseStatus = match ($status) {
                'submitted' => 'submitted',
                'under_review' => 'under_review',
                'verified', 'archived' => 'verified',
                'correction_required' => $type === $special ? 'correction_required' : 'verified',
                'rejected' => $type === $special ? 'rejected' : 'verified',
            };
            $decidedAt = null;
            if (! in_array($caseStatus, ['submitted', 'under_review'], true)) {
                $decidedAt = $submittedAt->copy()->addMinutes(mt_rand(90, 72 * 60));
                if ($decidedAt->gt($now)) {
                    $decidedAt = $now->copy()->subMinutes(5);
                }
            }
            [$method, $reason] = match ($caseStatus) {
                'verified' => match ($type) {
                    'identity' => ['document_review', 'documents_match'],
                    'membership' => ['association_confirmation', 'association_confirmed'],
                    default => ['phone_otp', 'phone_confirmed'],
                },
                'correction_required' => ['document_review', $this->pick(['name_mismatch', 'document_unreadable', 'missing_document'])],
                'rejected' => ['in_person', $this->pick(['not_a_member', 'suspected_fraud'])],
                default => [null, null],
            };
            $case = VerificationCase::create([
                'person_id' => $p->id, 'verification_type' => $type, 'status' => $caseStatus,
                'submitted_by_user_id' => $agent->id,
                'assigned_to_user_id' => $caseStatus === 'submitted' ? null : $verifier->id,
                'decided_by_user_id' => $decidedAt ? $verifier->id : null,
                'method' => $method, 'reason_code' => $reason, 'submitted_at' => $submittedAt, 'decided_at' => $decidedAt,
                'created_at' => $submittedAt,
            ]);
            if ($decidedAt) {
                VerificationDecision::create([
                    'verification_case_id' => $case->id, 'decided_by_user_id' => $verifier->id, 'outcome' => $caseStatus,
                    'method' => $method, 'reason_code' => $reason, 'notes' => null, 'created_at' => $decidedAt,
                ]);
                $this->audit('verification.decided', $verifier, $case, $decidedAt, null, ['outcome' => $caseStatus, 'verificationType' => $type], $p->id);
            }
        }
        if ($status === 'verified') {
            $p->forceFill(['verified_at' => $p->verificationCases()->max('decided_at')])->saveQuietly();
        }
    }

    private function audit(string $action, User $actor, $entity, Carbon $at, ?string $orgId = null, array $meta = [], ?string $subjectId = null): void
    {
        AuditEvent::create([
            'actor_user_id' => $actor->id, 'action' => $action, 'entity_type' => Audit::entityType($entity),
            'entity_id' => $entity->getKey(), 'organisation_id' => $orgId,
            'subject_person_id' => $subjectId ?? ($entity instanceof Person ? $entity->id : null),
            'request_id' => 'seed', 'metadata' => $meta ?: null, 'created_at' => $at,
        ]);
    }
}
