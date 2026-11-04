<?php

namespace App\Http\Controllers;

use App\Http\Requests\GrantRoleRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\AuditEventResource;
use App\Http\Resources\RoleAssignmentResource;
use App\Http\Resources\UserResource;
use App\Models\AuditEvent;
use App\Models\Group;
use App\Models\Organisation;
use App\Models\Person;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Phone;
use App\Support\Scope;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /** Roles an association_admin may grant inside their own organisation. */
    public const DELEGABLE_ROLES = ['field_agent', 'group_leader', 'rider', 'owner'];

    private function usersQuery(): Builder
    {
        $scope = $this->scope();
        $q = User::query();
        if ($scope->hasRole('platform_admin')) {
            return $q;
        }
        $orgIds = $scope->orgIds;

        return $q->where(function ($w) use ($orgIds) {
            $w->whereHas('activeRoles', fn ($r) => $r->whereIn('organisation_id', $orgIds))
                ->orWhereHas('activeRoles.group', fn ($g) => $g->whereIn('organisation_id', $orgIds))
                ->orWhereHas('person.activeOrganisationMemberships', fn ($m) => $m->whereIn('organisation_id', $orgIds));
        });
    }

    private function findUser(string $id): User
    {
        return $this->usersQuery()->whereKey($id)->firstOr(fn () => throw ApiException::notFound('User not found.'));
    }

    public function users(Request $request): JsonResponse
    {
        $this->scope()->require('users.view');
        $q = $this->usersQuery()->with(['person', 'activeRoles.organisation', 'activeRoles.group'])->orderBy('phone_e164');
        if ($term = trim((string) $request->query('q'))) {
            $phone = Phone::normalise($term);
            $q->where(fn ($w) => $w->where('display_name', 'like', "%{$term}%")->orWhere('phone_e164', $phone ?? "%{$term}%"));
        }
        if ($s = $request->query('status')) {
            $q->where('status', $s);
        }
        if ($r = $request->query('role')) {
            $q->whereHas('activeRoles', fn ($a) => $a->where('role', $r));
        }

        return $this->paginate($q, UserResource::class, $request);
    }

    public function storeUser(StoreUserRequest $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('users.manage');
        $v = $request->validated();
        $phone = Phone::normalise($v['phoneNumber']);
        if (User::where('phone_e164', $phone)->exists()) {
            throw ApiException::conflict('A user with this phone number already exists.');
        }
        foreach ($v['roles'] as $i => $r) {
            $this->assertGrantable($r, "roles.$i");
        }
        $user = DB::transaction(function () use ($v, $phone) {
            $user = User::create([
                'phone_e164' => $phone,
                'display_name' => $v['legalName'],
                'person_id' => Person::where('phone_e164', $phone)->value('id'),
                'status' => 'active',
            ]);
            foreach ($v['roles'] as $r) {
                $this->grant($user, $r);
            }

            return $user;
        });
        Audit::record('user.created', $user, ['roles' => array_column($v['roles'], 'role')]);

        return $this->item(new UserResource($user->load(['person', 'activeRoles.organisation', 'activeRoles.group'])), 201);
    }

    public function grantRole(GrantRoleRequest $request, string $id): JsonResponse
    {
        $this->scope()->require('roles.manage');
        $user = $this->findUser($id);
        $v = $request->validated();
        $this->assertGrantable($v, null);
        if (in_array($v['role'], ['rider', 'owner'], true) && ! $user->person_id) {
            throw ApiException::businessRule('This user is not linked to a rider record.');
        }
        $ra = $this->grant($user, $v);
        Scope::forget($user);

        return $this->item(new RoleAssignmentResource($ra->load(['organisation', 'group'])), 201);
    }

    private function assertGrantable(array $r, ?string $prefix): void
    {
        $scope = $this->scope();
        $key = fn ($f) => $prefix ? "$prefix.$f" : $f;
        $role = $r['role'];
        $orgId = $r['organisationId'] ?? null;
        $groupId = $r['groupId'] ?? null;

        if (in_array($role, ['field_agent', 'association_admin'], true) && ! $orgId) {
            throw ApiException::validation([$key('organisationId') => 'This role needs an organisation.']);
        }
        if ($role === 'group_leader') {
            if (! $groupId || ! ($group = Group::find($groupId))) {
                throw ApiException::validation([$key('groupId') => 'This role needs a group.']);
            }
            $orgId = $group->organisation_id;
        }
        if ($orgId && ! Organisation::whereKey($orgId)->exists()) {
            throw ApiException::validation([$key('organisationId') => 'Unknown organisation.']);
        }
        if ($scope->hasRole('platform_admin')) {
            return;
        }
        if (! in_array($role, self::DELEGABLE_ROLES, true) || ($orgId && ! in_array($orgId, $scope->orgIds, true))) {
            throw ApiException::forbidden('You cannot grant this role.');
        }
    }

    private function grant(User $user, array $r): RoleAssignment
    {
        $orgId = $r['organisationId'] ?? null;
        $groupId = $r['groupId'] ?? null;
        if ($r['role'] === 'group_leader') {
            $orgId = Group::whereKey($groupId)->value('organisation_id');
        }
        if (in_array($r['role'], ['platform_admin', 'verifier', 'rider', 'owner'], true)) {
            $groupId = null;
            $orgId = in_array($r['role'], ['rider', 'owner'], true) ? $orgId : null;
        }
        $existing = RoleAssignment::where('user_id', $user->id)->where('role', $r['role'])->whereNull('revoked_at')
            ->where('organisation_id', $orgId)->where('group_id', $groupId)->first();
        if ($existing) {
            throw ApiException::conflict('This role is already assigned.');
        }
        $ra = RoleAssignment::create([
            'user_id' => $user->id,
            'role' => $r['role'],
            'organisation_id' => $orgId,
            'group_id' => $groupId,
            'granted_by_user_id' => $this->user()->id,
            'granted_at' => now(),
        ]);
        Audit::record('role.granted', $ra, ['userId' => $user->id, 'role' => $ra->role, 'organisationId' => $orgId, 'groupId' => $groupId], null, $orgId);

        return $ra;
    }

    public function revokeRole(string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('roles.manage');
        $ra = RoleAssignment::whereKey($id)->whereNull('revoked_at')->firstOr(fn () => throw ApiException::notFound('Role assignment not found.'));
        $this->findUser($ra->user_id);
        if (! $scope->hasRole('platform_admin')) {
            $orgId = $ra->organisation_id ?? $ra->group?->organisation_id;
            if (! in_array($ra->role, self::DELEGABLE_ROLES, true) || ! in_array($orgId, $scope->orgIds, true)) {
                throw ApiException::forbidden('You cannot revoke this role.');
            }
        }
        if ($ra->user_id === $this->user()->id && $ra->role === 'platform_admin') {
            throw ApiException::businessRule('You cannot revoke your own platform administrator role.');
        }
        $ra->update(['revoked_at' => now(), 'revoked_by_user_id' => $this->user()->id]);
        // Privilege change: force re-authentication.
        $ra->user->tokens()->delete();
        Audit::record('role.revoked', $ra, ['userId' => $ra->user_id, 'role' => $ra->role], null, $ra->organisation_id);

        return $this->item(new RoleAssignmentResource($ra->load(['organisation', 'group'])));
    }

    public function disable(string $id): JsonResponse
    {
        $this->scope()->require('users.manage');
        $user = $this->findUser($id);
        if ($user->id === $this->user()->id) {
            throw ApiException::businessRule('You cannot disable your own account.');
        }
        DB::transaction(function () use ($user) {
            $user->forceFill(['status' => 'disabled', 'disabled_at' => now()])->save();
            $user->tokens()->delete(); // US-06: revoke all sessions immediately
        });
        Audit::record('user.disabled', $user, ['userId' => $user->id]);

        return $this->item(new UserResource($user->load(['person', 'activeRoles.organisation', 'activeRoles.group'])));
    }

    public function enable(string $id): JsonResponse
    {
        $this->scope()->require('users.manage');
        $user = $this->findUser($id);
        $user->forceFill(['status' => 'active', 'disabled_at' => null])->save();
        Audit::record('user.enabled', $user, ['userId' => $user->id]);

        return $this->item(new UserResource($user->load(['person', 'activeRoles.organisation', 'activeRoles.group'])));
    }

    public function auditEvents(Request $request): JsonResponse
    {
        $this->scope()->require('audit.view');
        $q = AuditEvent::with('actor.person')->orderByDesc('created_at');
        foreach (['actorId' => 'actor_user_id', 'action' => 'action', 'entityType' => 'entity_type', 'entityId' => 'entity_id'] as $param => $col) {
            if ($val = $request->query($param)) {
                $q->where($col, $val);
            }
        }
        if ($from = $request->query('from')) {
            $q->where('created_at', '>=', Carbon::parse($from));
        }
        if ($to = $request->query('to')) {
            $q->where('created_at', '<=', Carbon::parse($to));
        }

        return $this->paginate($q, AuditEventResource::class, $request);
    }
}
