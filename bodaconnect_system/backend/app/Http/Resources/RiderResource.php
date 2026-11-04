<?php

namespace App\Http\Resources;

use App\Models\AuditEvent;
use App\Models\Person;
use App\Support\Completeness;
use App\Support\Scope;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full permitted rider profile. Group leaders (limited view) only get roster-level fields.
 * identityReference is masked unless the caller has riders.view_sensitive.
 *
 * @mixin Person
 */
class RiderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $scope = Scope::for($request->user());
        $p = $this->resource;
        $orgM = $p->activeOrganisationMemberships()->with('organisation')->first();
        $grpM = $p->activeGroupMemberships()->with(['group', 'parkingPoint'])->first();

        $base = [
            'id' => $p->id,
            'systemId' => $p->system_id,
            'legalName' => $p->legal_name,
            'preferredName' => $p->preferred_name,
            'phoneMasked' => $p->phoneMasked(),
            'profileStatus' => $p->profile_status,
            'organisationId' => $orgM?->organisation_id,
            'organisationName' => $orgM?->organisation?->name,
            'groupId' => $grpM?->group_id,
            'groupName' => $grpM?->group?->name,
            'parkingPointId' => $grpM?->parking_point_id,
            'parkingPointName' => $grpM?->parkingPoint?->name,
            'createdAt' => $p->created_at?->toIso8601ZuluString(),
            'duplicateFlag' => $p->duplicateFlags()->where('status', 'open')->exists(),
        ];

        if ($scope->isLimitedViewOf($p)) {
            return $base + ['limitedView' => true];
        }

        $sensitive = $scope->can('riders.view_sensitive');
        $vehicles = $p->vehicleRelationships()->with('vehicle')->orderByDesc('start_at')->get()
            ->filter(fn ($r) => $r->vehicle)
            ->map(fn ($r) => array_merge(
                (new VehicleResource($r->vehicle))->resolve($request),
                ['relationship' => (new VehicleRelationshipResource($r))->resolve($request)]
            ))->values();

        $timeline = AuditEvent::with('actor.person')
            ->where(fn ($q) => $q->where('subject_person_id', $p->id)->orWhere(fn ($q) => $q->where('entity_type', 'person')->where('entity_id', $p->id)))
            ->orderByDesc('created_at')->limit(30)->get()
            ->map(fn ($e) => ['action' => $e->action, 'actorName' => $e->actor?->name(), 'at' => $e->created_at?->toIso8601ZuluString()]);

        return $base + [
            'limitedView' => false,
            'phoneE164' => $p->phone_e164,
            'dateOfBirth' => $p->date_of_birth?->toDateString(),
            'gender' => $p->gender,
            'identityReference' => $sensitive ? $p->identity_reference : $p->maskedIdentity(),
            'identityReferenceMasked' => ! $sensitive,
            'captureMethod' => $p->capture_method,
            'privacyNoticeVersion' => $p->privacy_notice_version,
            'submittedAt' => $p->submitted_at?->toIso8601ZuluString(),
            'verifiedAt' => $p->verified_at?->toIso8601ZuluString(),
            'updatedAt' => $p->updated_at?->toIso8601ZuluString(),
            'completeness' => Completeness::evaluate($p),
            'memberships' => $p->organisationMemberships()->with('organisation')->orderByDesc('start_at')->get()->map(fn ($m) => [
                'id' => $m->id,
                'organisationId' => $m->organisation_id,
                'organisationName' => $m->organisation?->name,
                'membershipNumber' => $m->membership_number,
                'status' => $m->status,
                'verificationStatus' => $m->verification_status,
                'startAt' => $m->start_at?->toIso8601ZuluString(),
                'endAt' => $m->end_at?->toIso8601ZuluString(),
            ]),
            'groupMemberships' => $p->groupMemberships()->with(['group', 'parkingPoint'])->orderByDesc('start_at')->get()->map(fn ($m) => [
                'id' => $m->id,
                'groupId' => $m->group_id,
                'groupName' => $m->group?->name,
                'parkingPointId' => $m->parking_point_id,
                'parkingPointName' => $m->parkingPoint?->name,
                'role' => $m->role,
                'status' => $m->status,
                'startAt' => $m->start_at?->toIso8601ZuluString(),
                'endAt' => $m->end_at?->toIso8601ZuluString(),
            ]),
            'vehicles' => $vehicles,
            'verificationCases' => VerificationCaseResource::collection(
                $p->verificationCases()->with(['submittedBy.person', 'assignedTo.person', 'decidedBy.person'])->orderByDesc('created_at')->get()
            )->resolve($request),
            'consents' => ConsentResource::collection($p->consents()->orderBy('created_at')->get())->resolve($request),
            'documents' => DocumentResource::collection($p->documents()->orderByDesc('created_at')->get())->resolve($request),
            'timeline' => $timeline,
        ];
    }
}
