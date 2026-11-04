<?php

namespace App\Support;

use App\Models\Group;
use App\Models\OrganisationMembership;
use App\Models\Person;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Central authorisation scope. Turns the user's active role_assignments into query constraints.
 *
 *  - platform_admin, verifier          => global
 *  - field_agent, association_admin    => their organisation(s)
 *  - group_leader                      => active members of their group(s), minimal fields
 *  - rider / owner                     => their own person record (users.person_id)
 *
 * Every list/show query in the API goes through one of the apply* methods; an id outside the
 * scope therefore resolves to "not found" (404) rather than 403, so existence is not leaked.
 */
class Scope
{
    public bool $global = false;

    /** @var string[] */
    public array $orgIds = [];

    /** @var string[] */
    public array $groupIds = [];

    public ?string $personId = null;

    /** @var string[] */
    public array $roles = [];

    /** @var array<string,bool> */
    private array $permissions = [];

    public function __construct(public User $user)
    {
        $assignments = $user->relationLoaded('activeRoles') ? $user->activeRoles : $user->activeRoles()->get();
        foreach ($assignments as $a) {
            $this->roles[] = $a->role;
            foreach (Permissions::forRole($a->role) as $p) {
                $this->permissions[$p] = true;
            }
            match ($a->role) {
                'platform_admin', 'verifier' => $this->global = true,
                'field_agent', 'association_admin' => $a->organisation_id ? $this->orgIds[] = $a->organisation_id : null,
                'group_leader' => $a->group_id ? $this->groupIds[] = $a->group_id : null,
                default => null,
            };
        }
        $this->roles = array_values(array_unique($this->roles));
        $this->orgIds = array_values(array_unique($this->orgIds));
        $this->groupIds = array_values(array_unique($this->groupIds));
        if (array_intersect($this->roles, ['rider', 'owner'])) {
            $this->personId = $user->person_id;
        } elseif ($user->person_id) {
            // Any staff member may still see their own person record.
            $this->personId = $user->person_id;
        }
    }

    private static ?\WeakMap $cache = null;

    /** Memoised per User instance for the lifetime of the request. */
    public static function for(User $user): self
    {
        self::$cache ??= new \WeakMap;

        return self::$cache[$user] ??= new self($user);
    }

    /** Drop the memoised scope (after role changes). */
    public static function forget(User $user): void
    {
        $user->unsetRelation('activeRoles');
        if (self::$cache) {
            unset(self::$cache[$user]);
        }
    }

    public function can(string $permission): bool
    {
        return isset($this->permissions[$permission]);
    }

    /** @return string[] */
    public function permissions(): array
    {
        return array_keys($this->permissions);
    }

    public function hasRole(string $role): bool
    {
        return in_array($role, $this->roles, true);
    }

    public function require(string $permission): void
    {
        if (! $this->can($permission)) {
            throw ApiException::forbidden();
        }
    }

    public function orgAllowed(?string $organisationId): bool
    {
        return $this->global || ($organisationId && in_array($organisationId, $this->orgIds, true));
    }

    /** Organisation ids readable (null = all). */
    public function readableOrgIds(): ?array
    {
        if ($this->global) {
            return null;
        }
        $ids = $this->orgIds;
        if ($this->groupIds) {
            $ids = array_merge($ids, Group::whereIn('id', $this->groupIds)->pluck('organisation_id')->all());
        }
        if ($this->personId) {
            $ids = array_merge($ids, OrganisationMembership::where('person_id', $this->personId)
                ->where('status', 'active')->pluck('organisation_id')->all());
        }

        return array_values(array_unique($ids));
    }

    // ---------------------------------------------------------------- query constraints

    public function people(Builder $q): Builder
    {
        if ($this->global) {
            return $q;
        }

        return $q->where(function (Builder $w) {
            $w->whereRaw('1 = 0');
            if ($this->orgIds) {
                $w->orWhereHas('organisationMemberships', fn ($m) => $m->whereIn('organisation_id', $this->orgIds)->where('status', 'active'));
            }
            if ($this->groupIds) {
                $w->orWhereHas('groupMemberships', fn ($m) => $m->whereIn('group_id', $this->groupIds)->where('status', 'active'));
            }
            if ($this->personId) {
                $w->orWhere('people.id', $this->personId);
            }
        });
    }

    /** Group leaders get only minimal roster fields for people they do not otherwise have access to. */
    public function isLimitedViewOf(Person $person): bool
    {
        if ($this->global || $person->id === $this->personId) {
            return false;
        }
        if ($this->orgIds && $person->activeOrganisationMemberships()->whereIn('organisation_id', $this->orgIds)->exists()) {
            return false;
        }

        return true;
    }

    public function vehicles(Builder $q): Builder
    {
        if ($this->global) {
            return $q;
        }

        return $q->where(function (Builder $w) {
            $w->whereRaw('1 = 0');
            if ($this->orgIds) {
                $w->orWhereIn('vehicles.organisation_id', $this->orgIds)
                    ->orWhereHas('relationships.person.organisationMemberships', fn ($m) => $m->whereIn('organisation_id', $this->orgIds)->where('status', 'active'));
            }
            if ($this->personId) {
                $w->orWhereHas('relationships', fn ($r) => $r->where('person_id', $this->personId));
            }
        });
    }

    public function organisations(Builder $q): Builder
    {
        $ids = $this->readableOrgIds();

        return $ids === null ? $q : $q->whereIn('organisations.id', $ids);
    }

    public function groups(Builder $q): Builder
    {
        if ($this->global) {
            return $q;
        }

        return $q->where(function (Builder $w) {
            $w->whereRaw('1 = 0');
            if ($this->orgIds) {
                $w->orWhereIn('groups.organisation_id', $this->orgIds);
            }
            if ($this->groupIds) {
                $w->orWhereIn('groups.id', $this->groupIds);
            }
            if ($this->personId) {
                $w->orWhereHas('activeMemberships', fn ($m) => $m->where('person_id', $this->personId));
            }
        });
    }

    public function parkingPoints(Builder $q): Builder
    {
        $ids = $this->readableOrgIds();

        return $ids === null ? $q : $q->whereIn('parking_points.organisation_id', $ids);
    }

    /** Any model with a person relation (verification cases, documents, duplicate flags, consents). */
    public function viaPerson(Builder $q, string $relation = 'person'): Builder
    {
        if ($this->global) {
            return $q;
        }

        return $q->whereHas($relation, fn ($p) => $this->people($p));
    }

    public function supportRequests(Builder $q): Builder
    {
        if ($this->global) {
            return $q;
        }

        return $q->where(function (Builder $w) {
            $w->where('support_requests.requested_by_user_id', $this->user->id);
            if ($this->personId) {
                $w->orWhere('support_requests.subject_person_id', $this->personId);
            }
            if ($this->orgIds) {
                $w->orWhereIn('support_requests.organisation_id', $this->orgIds)
                    ->orWhereHas('subject', fn ($p) => $p->whereHas('organisationMemberships', fn ($m) => $m->whereIn('organisation_id', $this->orgIds)->where('status', 'active')));
            }
        });
    }

    public function auditEvents(Builder $q): Builder
    {
        if ($this->global) {
            return $q;
        }

        return $q->where(function (Builder $w) {
            $w->where('actor_user_id', $this->user->id);
            if ($this->orgIds) {
                $w->orWhereIn('organisation_id', $this->orgIds);
            }
        });
    }

    // ---------------------------------------------------------------- finders (404 when out of scope)

    public function findPerson(string $id): Person
    {
        return $this->people(Person::query())->whereKey($id)->firstOr(fn () => throw ApiException::notFound('Rider not found.'));
    }

    /** People ids in scope (for aggregate queries). Null means unrestricted. */
    public function personIdsSubquery(): ?Builder
    {
        return $this->global ? null : $this->people(Person::query())->select('people.id');
    }
}
