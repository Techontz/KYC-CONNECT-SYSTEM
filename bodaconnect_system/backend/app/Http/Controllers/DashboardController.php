<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\DuplicateFlag;
use App\Models\Group;
use App\Models\ParkingPoint;
use App\Models\Person;
use App\Models\SupportRequest;
use App\Models\Vehicle;
use App\Models\VerificationCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Scoped KPI summary. Metric definitions follow PRD Appendix A and are returned with the data. */
class DashboardController extends Controller
{
    public const DEFINITIONS = [
        'riders' => 'Rider records registered in your scope (excluding archived).',
        'verified' => 'Riders whose identity, membership and phone checks are all verified.',
        'pendingVerification' => 'Riders submitted or under review, waiting for a verifier decision.',
        'correctionRequired' => 'Riders sent back for a correction before they can be verified.',
        'drafts' => 'Records started but not yet submitted for verification.',
        'completionRate' => 'Share of registered riders whose mandatory fields are all complete (name, phone, date of birth, gender, ID, organisation, group, parking point, vehicle, registration consent).',
        'duplicateRate' => 'Duplicate flags raised divided by rider records created.',
        'medianTurnaroundHours' => 'Median hours between a verification case being submitted and its decision.',
        'groupCoverage' => 'Groups with at least one active member AND a named leader, out of all groups.',
        'openDuplicates' => 'Possible duplicate records waiting for human review.',
        'openSupport' => 'Support and correction requests not yet resolved.',
        'funnel' => 'registered -> profile_complete (all mandatory fields) -> submitted (ever submitted) -> verified.',
    ];

    public function summary(): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('dashboard.view');

        $people = fn () => $scope->people(Person::query())->where('profile_status', '!=', 'archived');
        $statusCounts = $people()->select('profile_status', DB::raw('count(*) as c'))->groupBy('profile_status')->pluck('c', 'profile_status');
        $riders = (int) $statusCounts->sum();
        $complete = $people()->where('completeness_percent', 100)->count();

        $groups = $scope->groups(Group::query());
        $groupIds = (clone $groups)->pluck('id');
        $coveredGroups = Group::whereIn('id', $groupIds)->whereNotNull('leader_person_id')->whereHas('activeMemberships')->count();

        $flagsQ = $scope->viaPerson(DuplicateFlag::query());
        $flags = (clone $flagsQ)->count();
        $openFlags = (clone $flagsQ)->where('status', 'open')->count();

        $hours = $scope->viaPerson(VerificationCase::query())->whereNotNull('decided_at')->whereNotNull('submitted_at')
            ->get(['submitted_at', 'decided_at'])
            ->map(fn ($c) => $c->submitted_at->diffInMinutes($c->decided_at) / 60)->sort()->values();
        $median = null;
        if ($hours->count()) {
            $mid = intdiv($hours->count(), 2);
            $median = round($hours->count() % 2 ? $hours[$mid] : ($hours[$mid - 1] + $hours[$mid]) / 2, 1);
        }

        $from = now()->subDays(29)->startOfDay();
        $byDay = $people()->where('people.created_at', '>=', $from)
            ->select(DB::raw('DATE(people.created_at) as d'), DB::raw('count(*) as c'))->groupBy('d')->pluck('c', 'd');
        $registrationsByDay = collect(range(0, 29))->map(function ($i) use ($from, $byDay) {
            $d = $from->copy()->addDays($i)->toDateString();

            return ['date' => $d, 'count' => (int) ($byDay[$d] ?? 0)];
        });

        $byGroup = Group::whereIn('id', $groupIds)->withCount(['activeMemberships as members' => function ($m) use ($scope) {
            if (! $scope->global) {
                $m->whereIn('person_id', $scope->personIdsSubquery());
            }
        }])->orderByDesc('members')->get()->map(fn ($g) => ['groupId' => $g->id, 'groupName' => $g->name, 'count' => (int) $g->members]);

        $recent = $scope->auditEvents(AuditEvent::query())->with('actor.person')->orderByDesc('created_at')->limit(10)->get()
            ->map(fn ($e) => ['action' => $e->action, 'actorName' => $e->actor?->name(), 'entityType' => $e->entity_type, 'at' => $e->created_at?->toIso8601ZuluString()]);

        $submittedEver = $people()->where('profile_status', '!=', 'draft')->count();
        $verified = (int) ($statusCounts['verified'] ?? 0);

        $vehicles = $scope->vehicles(Vehicle::query())->count();
        $parkingPoints = $scope->parkingPoints(ParkingPoint::query())->count();
        $openSupport = $scope->supportRequests(SupportRequest::query())->whereIn('status', ['open', 'in_progress'])->count();

        return response()->json(['data' => [
            'totals' => [
                'riders' => $riders,
                'verified' => $verified,
                'pendingVerification' => (int) (($statusCounts['submitted'] ?? 0) + ($statusCounts['under_review'] ?? 0)),
                'correctionRequired' => (int) ($statusCounts['correction_required'] ?? 0),
                'drafts' => (int) ($statusCounts['draft'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'vehicles' => $vehicles,
                'groups' => $groupIds->count(),
                'parkingPoints' => $parkingPoints,
                'openDuplicates' => $openFlags,
                'openSupport' => $openSupport,
            ],
            'completionRate' => $riders ? round($complete / $riders, 4) : 0,
            'duplicateRate' => $riders ? round($flags / $riders, 4) : 0,
            'medianTurnaroundHours' => $median,
            'groupCoverage' => ['covered' => $coveredGroups, 'total' => $groupIds->count()],
            'funnel' => [
                ['stage' => 'registered', 'count' => $riders],
                ['stage' => 'profile_complete', 'count' => $complete],
                ['stage' => 'submitted', 'count' => $submittedEver],
                ['stage' => 'verified', 'count' => $verified],
            ],
            'statusBreakdown' => collect(['draft', 'submitted', 'under_review', 'verified', 'correction_required', 'rejected'])
                ->map(fn ($s) => ['status' => $s, 'count' => (int) ($statusCounts[$s] ?? 0)]),
            'registrationsByDay' => $registrationsByDay,
            'byGroup' => $byGroup,
            'recentActivity' => $recent,
            'definitions' => self::DEFINITIONS,
            'generatedAt' => now()->toIso8601ZuluString(),
        ]]);
    }
}
