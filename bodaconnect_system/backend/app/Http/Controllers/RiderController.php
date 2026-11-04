<?php

namespace App\Http\Controllers;

use App\Http\Requests\CorrectionRequestRequest;
use App\Http\Requests\DuplicateCheckRequest;
use App\Http\Requests\StoreRiderRequest;
use App\Http\Requests\UpdateRiderRequest;
use App\Http\Resources\ConsentResource;
use App\Http\Resources\RiderListResource;
use App\Http\Resources\RiderResource;
use App\Http\Resources\SupportRequestResource;
use App\Models\ConsentRecord;
use App\Models\DuplicateFlag;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\OrganisationMembership;
use App\Models\ParkingPoint;
use App\Models\Person;
use App\Models\PrivacyNotice;
use App\Models\SupportRequest;
use App\Models\Vehicle;
use App\Models\VehicleRelationship;
use App\Models\VerificationCase;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Completeness;
use App\Support\DuplicateDetector;
use App\Support\Phone;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RiderController extends Controller
{
    public const PROTECTED_FIELDS = ['legalName', 'identityReference', 'dateOfBirth'];

    public const SUBMIT_CASE_TYPES = ['identity', 'membership', 'phone'];

    public function index(Request $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('riders.view');

        $q = $scope->people(Person::query())
            ->with(['activeOrganisationMemberships.organisation', 'activeGroupMemberships.group', 'activeGroupMemberships.parkingPoint'])
            ->withCount(['duplicateFlags as open_duplicate_flags_count' => fn ($f) => $f->where('status', 'open')]);

        if ($term = trim((string) $request->query('q'))) {
            $phone = Phone::normalise($term);
            $q->where(function ($w) use ($term, $phone) {
                $w->where('legal_name', 'like', "%{$term}%")
                    ->orWhere('preferred_name', 'like', "%{$term}%")
                    ->orWhere('system_id', 'like', "%{$term}%");
                if ($phone) {
                    $w->orWhere('phone_e164', $phone);
                } elseif (preg_match('/^\+?\d{4,}$/', $term)) {
                    $w->orWhere('phone_e164', 'like', '%'.ltrim($term, '+0').'%');
                }
            });
        }
        if ($org = $request->query('organisationId')) {
            $q->whereHas('activeOrganisationMemberships', fn ($m) => $m->where('organisation_id', $org));
        }
        if ($group = $request->query('groupId')) {
            $q->whereHas('activeGroupMemberships', fn ($m) => $m->where('group_id', $group));
        }
        if ($pp = $request->query('parkingPointId')) {
            $q->whereHas('activeGroupMemberships', fn ($m) => $m->where('parking_point_id', $pp));
        }
        if ($status = $request->query('status')) {
            $q->whereIn('profile_status', explode(',', $status));
        }
        if ($from = $request->query('registeredFrom')) {
            $q->where('people.created_at', '>=', Carbon::parse($from)->startOfDay());
        }
        if ($to = $request->query('registeredTo')) {
            $q->where('people.created_at', '<=', Carbon::parse($to)->endOfDay());
        }
        $q->orderByDesc('people.created_at')->orderBy('people.system_id');

        return $this->paginate($q, RiderListResource::class, $request);
    }

    public function store(StoreRiderRequest $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('riders.create');
        $user = $this->user();
        $v = $request->validated();

        if (! $scope->orgAllowed($v['organisationId'])) {
            throw ApiException::validation(['organisationId' => 'You cannot register riders for this organisation.']);
        }
        $group = null;
        if (! empty($v['groupId'])) {
            $group = Group::where('organisation_id', $v['organisationId'])->find($v['groupId']);
            if (! $group) {
                throw ApiException::validation(['groupId' => 'Select a group that belongs to the organisation.']);
            }
        }
        if (! empty($v['parkingPointId'])) {
            $pp = ParkingPoint::where('organisation_id', $v['organisationId'])->find($v['parkingPointId']);
            if (! $pp) {
                throw ApiException::validation(['parkingPointId' => 'Select a parking point that belongs to the organisation.']);
            }
            if (! $group && $pp->group_id) {
                $group = Group::find($pp->group_id);
            }
        }
        $notice = PrivacyNotice::where('version', $v['privacyNoticeVersion'])->first();
        if (! $notice) {
            throw ApiException::validation(['privacyNoticeVersion' => 'Unknown privacy notice version.']);
        }
        $registrationConsent = collect($v['consents'])->firstWhere('purpose', 'registration');
        if (! $registrationConsent || ! filter_var($registrationConsent['granted'], FILTER_VALIDATE_BOOL)) {
            throw ApiException::validation(['consents' => 'Registration consent is required to create a record.']);
        }

        $phone = Phone::normalise($v['phoneNumber']);
        $matches = DuplicateDetector::find($phone, $v['identityReference'] ?? null, $v['legalName'], $v['vehicle']['registrationNumber'] ?? null);
        $phoneMatches = array_values(array_filter($matches, fn ($m) => $m['reason'] === 'phone'));
        if ($phoneMatches) {
            throw ApiException::conflict('A rider with this phone number is already registered. Records are never merged automatically.', [
                'matches' => array_map(fn ($m) => DuplicateDetector::present($m, $scope), $phoneMatches),
            ]);
        }

        $person = DB::transaction(function () use ($v, $phone, $user, $group, $notice, $matches) {
            $person = Person::create([
                'legal_name' => trim($v['legalName']),
                'preferred_name' => $v['preferredName'] ?? null,
                'phone_e164' => $phone,
                'date_of_birth' => $v['dateOfBirth'] ?? null,
                'gender' => $v['gender'] ?? null,
                'identity_reference' => isset($v['identityReference']) ? strtoupper(trim($v['identityReference'])) : null,
                'profile_status' => 'draft',
                'capture_method' => $v['captureMethod'],
                'privacy_notice_version' => $notice->version,
                'created_by_user_id' => $user->id,
            ]);
            OrganisationMembership::create([
                'person_id' => $person->id,
                'organisation_id' => $v['organisationId'],
                'status' => 'active',
                'start_at' => now(),
            ]);
            if ($group) {
                GroupMembership::create([
                    'person_id' => $person->id,
                    'group_id' => $group->id,
                    'parking_point_id' => $v['parkingPointId'] ?? null,
                    'status' => 'active',
                    'start_at' => now(),
                ]);
            }
            foreach ($v['consents'] as $c) {
                $granted = filter_var($c['granted'], FILTER_VALIDATE_BOOL);
                ConsentRecord::create([
                    'person_id' => $person->id,
                    'privacy_notice_id' => $notice->id,
                    'notice_version' => $notice->version,
                    'purpose' => $c['purpose'],
                    'granted' => $granted,
                    'capture_method' => $v['captureMethod'],
                    'captured_by_user_id' => $user->id,
                    'granted_at' => $granted ? now() : null,
                ]);
            }
            if (! empty($v['vehicle'])) {
                $plate = Vehicle::normalisePlate($v['vehicle']['registrationNumber']);
                $vehicle = Vehicle::firstOrCreate(['registration_number_normalised' => $plate], [
                    'vehicle_type' => $v['vehicle']['vehicleType'],
                    'registration_number' => strtoupper(trim($v['vehicle']['registrationNumber'])),
                    'make' => $v['vehicle']['make'] ?? null,
                    'model' => $v['vehicle']['model'] ?? null,
                    'colour' => $v['vehicle']['colour'] ?? null,
                    'organisation_id' => $v['organisationId'],
                    'created_by_user_id' => $user->id,
                ]);
                VehicleRelationship::create([
                    'vehicle_id' => $vehicle->id,
                    'person_id' => $person->id,
                    'relationship_type' => $v['vehicle']['relationshipType'],
                    'start_at' => now(),
                    'created_by_user_id' => $user->id,
                ]);
            }
            // Non-phone matches: create and flag for human review, never auto-merge.
            foreach ($matches as $m) {
                if ($m['reason'] === 'name' && ! ($m['person']?->date_of_birth && ! empty($v['dateOfBirth'])
                    && $m['person']->date_of_birth->toDateString() === Carbon::parse($v['dateOfBirth'])->toDateString())) {
                    continue; // same name alone is too weak to raise a flag
                }
                DuplicateFlag::create([
                    'person_id' => $person->id,
                    'matched_person_id' => $m['person']?->id,
                    'matched_vehicle_id' => $m['vehicle']?->id,
                    'reason' => $m['reason'],
                    'status' => 'open',
                    'raised_by_user_id' => $user->id,
                ]);
            }
            Completeness::refresh($person);

            return $person;
        });

        Audit::record('rider.created', $person, [
            'captureMethod' => $v['captureMethod'],
            'duplicateMatches' => count($matches),
            'hasVehicle' => ! empty($v['vehicle']),
        ], null, $v['organisationId'], $person->id);

        return $this->item(new RiderResource($person->fresh()), 201, [
            'duplicates' => array_map(fn ($m) => DuplicateDetector::present($m, $this->scope()), $matches),
        ]);
    }

    public function duplicateCheck(DuplicateCheckRequest $request): JsonResponse
    {
        $scope = $this->scope();
        if (! $scope->can('riders.create') && ! $scope->can('duplicates.view')) {
            throw ApiException::forbidden();
        }
        $v = $request->validated();
        $matches = DuplicateDetector::find(
            Phone::normalise($v['phoneNumber'] ?? null), $v['identityReference'] ?? null, $v['legalName'] ?? null, $v['registrationNumber'] ?? null
        );

        return response()->json(['data' => ['matches' => array_map(fn ($m) => DuplicateDetector::present($m, $scope), $matches)]]);
    }

    public function show(string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('riders.view');
        $person = $scope->findPerson($id);

        return $this->item(new RiderResource($person));
    }

    public function update(UpdateRiderRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $person = $scope->findPerson($id);
        $isSelf = $person->id === $scope->personId;
        if (! $scope->can('riders.update') && ! $scope->can('riders.edit_protected')) {
            throw ApiException::forbidden();
        }
        if ($scope->isLimitedViewOf($person) || ($scope->hasRole('rider') && ! $isSelf && ! $scope->orgIds && ! $scope->global)) {
            throw ApiException::notFound('Rider not found.');
        }
        $v = $request->validated();
        $protected = array_values(array_intersect(array_keys($v), self::PROTECTED_FIELDS));
        if ($protected && ! $scope->can('riders.edit_protected')) {
            throw ApiException::businessRule('These fields can only be changed through a correction request reviewed by a verifier: '.implode(', ', $protected).'.', ['fields' => $protected]);
        }

        $changes = [];
        $map = ['legalName' => 'legal_name', 'preferredName' => 'preferred_name', 'dateOfBirth' => 'date_of_birth', 'gender' => 'gender', 'identityReference' => 'identity_reference'];
        foreach ($map as $in => $col) {
            if (array_key_exists($in, $v)) {
                $person->{$col} = $in === 'identityReference' && $v[$in] ? strtoupper(trim($v[$in])) : $v[$in];
                $changes[] = $in;
            }
        }
        if (array_key_exists('phoneNumber', $v)) {
            $phone = Phone::normalise($v['phoneNumber']);
            $clash = Person::where('phone_e164', $phone)->whereKeyNot($person->id)->first();
            if ($clash) {
                throw ApiException::conflict('Another rider already uses this phone number.', [
                    'matches' => [DuplicateDetector::present(['person' => $clash, 'vehicle' => null, 'reason' => 'phone'], $scope)],
                ]);
            }
            $person->phone_e164 = $phone;
            $changes[] = 'phoneNumber';
        }
        $person->save();
        Completeness::refresh($person);
        Audit::record('rider.updated', $person, ['fields' => $changes], null, $person->activeOrganisationMemberships()->value('organisation_id'), $person->id);

        return $this->item(new RiderResource($person->fresh()));
    }

    public function submit(string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('riders.submit');
        $person = $scope->findPerson($id);
        if (! in_array($person->profile_status, ['draft', 'correction_required'], true)) {
            throw ApiException::businessRule('Only draft or correction-required records can be submitted.');
        }
        $user = $this->user();

        DB::transaction(function () use ($person, $user) {
            foreach (self::SUBMIT_CASE_TYPES as $type) {
                $latest = $person->verificationCases()->where('verification_type', $type)->latest('created_at')->first();
                if ($latest && in_array($latest->status, ['verified', 'submitted', 'under_review'], true)) {
                    continue;
                }
                VerificationCase::create([
                    'person_id' => $person->id,
                    'verification_type' => $type,
                    'status' => 'submitted',
                    'submitted_by_user_id' => $user->id,
                    'submitted_at' => now(),
                ]);
            }
            $person->update([
                'profile_status' => 'submitted',
                'submitted_at' => now(),
                'submitted_by_user_id' => $user->id,
            ]);
        });
        Audit::record('rider.submitted', $person, [], null, $person->activeOrganisationMemberships()->value('organisation_id'), $person->id);

        return $this->item(new RiderResource($person->fresh()));
    }

    public function correctionRequest(CorrectionRequestRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('support.create');
        $person = $scope->findPerson($id);
        if ($scope->isLimitedViewOf($person)) {
            throw ApiException::notFound('Rider not found.');
        }
        $v = $request->validated();
        $sr = SupportRequest::create([
            'category' => 'correction',
            'status' => 'open',
            'description' => "Correction requested for {$v['field']}",
            'subject_person_id' => $person->id,
            'organisation_id' => $person->activeOrganisationMemberships()->value('organisation_id'),
            'requested_by_user_id' => $this->user()->id,
            'field' => $v['field'],
            'proposed_value' => $v['proposedValue'],
            'reason' => $v['reason'],
        ]);
        Audit::record('correction.requested', $sr, ['field' => $v['field']], null, $sr->organisation_id, $person->id);

        return $this->item(new SupportRequestResource($sr->load(['subject', 'requestedBy'])), 201);
    }

    public function consents(string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('riders.view');
        $person = $scope->findPerson($id);
        if ($scope->isLimitedViewOf($person)) {
            throw ApiException::notFound('Rider not found.');
        }

        return response()->json(['data' => ConsentResource::collection($person->consents()->orderBy('created_at')->get())->resolve(request())]);
    }

    public function withdrawConsent(string $id, string $consentId): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('consents.withdraw');
        $person = $scope->findPerson($id);
        $consent = $person->consents()->whereKey($consentId)->firstOr(fn () => throw ApiException::notFound('Consent not found.'));
        if ($consent->withdrawn_at || ! $consent->granted) {
            throw ApiException::businessRule('This consent is not currently granted.');
        }
        $consent->update(['withdrawn_at' => now()]);
        Completeness::refresh($person);
        Audit::record('consent.withdrawn', $consent, ['purpose' => $consent->purpose], null, null, $person->id);

        return $this->item(new ConsentResource($consent));
    }
}
