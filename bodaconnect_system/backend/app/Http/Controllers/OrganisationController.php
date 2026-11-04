<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGroupMembershipRequest;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\StoreOrganisationRequest;
use App\Http\Requests\StoreParkingPointRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Http\Resources\GroupMemberResource;
use App\Http\Resources\GroupResource;
use App\Http\Resources\OrganisationResource;
use App\Http\Resources\ParkingPointResource;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\Organisation;
use App\Models\OrganisationMembership;
use App\Models\ParkingPoint;
use App\Models\Vehicle;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Completeness;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganisationController extends Controller
{
    private function findOrg(string $id): Organisation
    {
        return $this->scope()->organisations(Organisation::query())->whereKey($id)
            ->firstOr(fn () => throw ApiException::notFound('Organisation not found.'));
    }

    private function findGroup(string $id): Group
    {
        return $this->scope()->groups(Group::query())->whereKey($id)
            ->firstOr(fn () => throw ApiException::notFound('Group not found.'));
    }

    /** Write access to an organisation's structure: global admins or org-scoped staff of that org. */
    private function requireOrgWrite(string $permission, string $orgId): void
    {
        $scope = $this->scope();
        $scope->require($permission);
        if (! $scope->orgAllowed($orgId)) {
            throw ApiException::forbidden();
        }
    }

    public function index(Request $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('organisations.view');
        $q = $scope->organisations(Organisation::query())->orderBy('name');
        if ($t = $request->query('type')) {
            $q->where('type', $t);
        }

        return $this->paginate($q, OrganisationResource::class, $request);
    }

    public function store(StoreOrganisationRequest $request): JsonResponse
    {
        $this->scope()->require('organisations.create');
        $v = $request->validated();
        $org = Organisation::create(['name' => $v['name'], 'code' => strtoupper($v['code']), 'type' => $v['type'], 'region' => $v['region'] ?? null]);
        Audit::record('organisation.created', $org, ['name' => $org->name], null, $org->id);

        return $this->item(new OrganisationResource($org), 201);
    }

    public function show(string $id): JsonResponse
    {
        $this->scope()->require('organisations.view');
        $org = $this->findOrg($id);
        $org->setAttribute('counts', [
            'members' => OrganisationMembership::where('organisation_id', $org->id)->where('status', 'active')->count(),
            'groups' => Group::where('organisation_id', $org->id)->count(),
            'parkingPoints' => ParkingPoint::where('organisation_id', $org->id)->count(),
            'vehicles' => Vehicle::where('organisation_id', $org->id)->count(),
            'verifiedMembers' => OrganisationMembership::where('organisation_id', $org->id)->where('status', 'active')
                ->whereHas('person', fn ($p) => $p->where('profile_status', 'verified'))->count(),
        ]);

        return $this->item(new OrganisationResource($org));
    }

    public function groups(Request $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('organisations.view');
        $org = $this->findOrg($id);
        $q = $scope->groups(Group::query())->where('organisation_id', $org->id)->with('leader')
            ->withCount(['activeMemberships', 'parkingPoints'])->orderBy('name');

        return $this->paginate($q, GroupResource::class, $request);
    }

    public function storeGroup(StoreGroupRequest $request, string $id): JsonResponse
    {
        $org = $this->findOrg($id);
        $this->requireOrgWrite('groups.manage', $org->id);
        $v = $request->validated();
        $code = strtoupper($v['code']);
        if (Group::where('organisation_id', $org->id)->where('code', $code)->exists()) {
            throw ApiException::conflict('A group with this code already exists in the organisation.');
        }
        $leaderId = $this->validLeader($v['leaderPersonId'] ?? null);
        $group = Group::create(['organisation_id' => $org->id, 'name' => $v['name'], 'code' => $code, 'leader_person_id' => $leaderId]);
        Audit::record('group.created', $group, ['name' => $group->name], null, $org->id);

        return $this->item(new GroupResource($group->load('leader')->loadCount(['activeMemberships', 'parkingPoints'])), 201);
    }

    public function updateGroup(UpdateGroupRequest $request, string $id): JsonResponse
    {
        $group = $this->findGroup($id);
        $this->requireOrgWrite('groups.manage', $group->organisation_id);
        $v = $request->validated();
        if (isset($v['code'])) {
            $v['code'] = strtoupper($v['code']);
            if (Group::where('organisation_id', $group->organisation_id)->where('code', $v['code'])->whereKeyNot($group->id)->exists()) {
                throw ApiException::conflict('A group with this code already exists in the organisation.');
            }
        }
        $data = collect($v)->only(['name', 'code', 'status'])->all();
        if (array_key_exists('leaderPersonId', $v)) {
            $data['leader_person_id'] = $this->validLeader($v['leaderPersonId']);
        }
        $group->update($data);
        Audit::record('group.updated', $group, ['fields' => array_keys($v)], null, $group->organisation_id);

        return $this->item(new GroupResource($group->load('leader')->loadCount(['activeMemberships', 'parkingPoints'])));
    }

    private function validLeader(?string $personId): ?string
    {
        if (! $personId) {
            return null;
        }
        $this->scope()->findPerson($personId);

        return $personId;
    }

    public function parkingPoints(Request $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('organisations.view');
        $org = $this->findOrg($id);
        $q = ParkingPoint::where('organisation_id', $org->id)->with('group')->orderBy('ward')->orderBy('name');
        if ($g = $request->query('groupId')) {
            $q->where('group_id', $g);
        }

        return $this->paginate($q, ParkingPointResource::class, $request);
    }

    public function storeParkingPoint(StoreParkingPointRequest $request, string $id): JsonResponse
    {
        $org = $this->findOrg($id);
        $this->requireOrgWrite('parking_points.manage', $org->id);
        $v = $request->validated();
        if (! empty($v['groupId']) && ! Group::where('organisation_id', $org->id)->whereKey($v['groupId'])->exists()) {
            throw ApiException::validation(['groupId' => 'Select a group in this organisation.']);
        }
        $pp = ParkingPoint::create([
            'organisation_id' => $org->id,
            'group_id' => $v['groupId'] ?? null,
            'name' => $v['name'],
            'ward' => $v['ward'],
            'area' => $v['area'] ?? null,
            'latitude' => $v['latitude'] ?? null,
            'longitude' => $v['longitude'] ?? null,
        ]);
        Audit::record('parking_point.created', $pp, ['name' => $pp->name, 'ward' => $pp->ward], null, $org->id);

        return $this->item(new ParkingPointResource($pp->load('group')), 201);
    }

    public function members(Request $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('groups.view_members');
        $group = $this->findGroup($id);
        if (! $scope->global && ! in_array($group->organisation_id, $scope->orgIds, true) && ! in_array($group->id, $scope->groupIds, true)) {
            throw ApiException::notFound('Group not found.');
        }
        $q = GroupMembership::where('group_id', $group->id)->with(['person', 'parkingPoint'])
            ->where('status', $request->query('status', 'active'))
            ->orderBy('start_at');

        return $this->paginate($q, GroupMemberResource::class, $request);
    }

    public function storeMembership(StoreGroupMembershipRequest $request, string $id): JsonResponse
    {
        $group = $this->findGroup($id);
        $this->requireOrgWrite('memberships.manage', $group->organisation_id);
        $v = $request->validated();
        $person = $this->scope()->findPerson($v['personId']);
        if (! empty($v['parkingPointId']) && ! ParkingPoint::where('organisation_id', $group->organisation_id)->whereKey($v['parkingPointId'])->exists()) {
            throw ApiException::validation(['parkingPointId' => 'Select a parking point in this organisation.']);
        }
        if (GroupMembership::where('group_id', $group->id)->where('person_id', $person->id)->where('status', 'active')->exists()) {
            throw ApiException::conflict('This rider is already an active member of this group.');
        }

        $membership = DB::transaction(function () use ($group, $person, $v) {
            // One active group per organisation: end the previous one, keeping history.
            GroupMembership::where('person_id', $person->id)->where('status', 'active')
                ->whereHas('group', fn ($g) => $g->where('organisation_id', $group->organisation_id))
                ->update(['status' => 'ended', 'end_at' => now()]);
            OrganisationMembership::firstOrCreate(
                ['person_id' => $person->id, 'organisation_id' => $group->organisation_id, 'status' => 'active'],
                ['start_at' => now()]
            );

            return GroupMembership::create([
                'person_id' => $person->id,
                'group_id' => $group->id,
                'parking_point_id' => $v['parkingPointId'] ?? null,
                'status' => 'active',
                'start_at' => now(),
            ]);
        });
        Completeness::refresh($person);
        Audit::record('group_membership.created', $membership, ['groupId' => $group->id], null, $group->organisation_id, $person->id);

        return $this->item(new GroupMemberResource($membership->load(['person', 'parkingPoint'])), 201);
    }

    public function endMembership(string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('memberships.manage');
        $m = GroupMembership::whereKey($id)->with('group')->firstOr(fn () => throw ApiException::notFound('Membership not found.'));
        if (! $scope->orgAllowed($m->group->organisation_id)) {
            throw ApiException::notFound('Membership not found.');
        }
        if ($m->status !== 'active') {
            throw ApiException::businessRule('This membership has already ended.');
        }
        $m->update(['status' => 'ended', 'end_at' => now()]);
        Completeness::refresh($m->person);
        Audit::record('group_membership.ended', $m, [], null, $m->group->organisation_id, $m->person_id);

        return $this->item(new GroupMemberResource($m->load(['person', 'parkingPoint'])));
    }
}
