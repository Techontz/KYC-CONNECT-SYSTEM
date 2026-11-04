<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExportRequest;
use App\Http\Resources\ReportExportResource;
use App\Models\Group;
use App\Models\Person;
use App\Models\ReportExport;
use App\Models\VerificationCase;
use App\Support\ApiException;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CSV exports with minimal fields. Generated synchronously to the private disk; a purpose is
 * required; downloads are permitted for 15 minutes after creation and are audited.
 */
class ReportController extends Controller
{
    public const DOWNLOAD_WINDOW_MINUTES = 15;

    public const TYPES = [
        'rider_roster' => [
            'name' => 'Rider roster',
            'description' => 'Riders with group and parking point. Phone numbers are masked; no identity numbers.',
            'fields' => ['systemId', 'legalName', 'preferredName', 'phoneMasked', 'organisation', 'group', 'parkingPoint', 'profileStatus', 'registeredAt'],
        ],
        'verification_status' => [
            'name' => 'Verification status',
            'description' => 'Verification cases and outcomes per rider.',
            'fields' => ['systemId', 'legalName', 'verificationType', 'status', 'submittedAt', 'decidedAt', 'reasonCode'],
        ],
        'group_coverage' => [
            'name' => 'Group coverage',
            'description' => 'Groups with active member counts, leader presence and parking points.',
            'fields' => ['groupName', 'groupCode', 'organisation', 'activeMembers', 'verifiedMembers', 'hasLeader', 'parkingPoints'],
        ],
    ];

    public function types(): JsonResponse
    {
        $this->scope()->require('reports.view');

        return response()->json(['data' => collect(self::TYPES)->map(fn ($t, $k) => ['key' => $k] + $t)->values()]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->scope()->require('reports.view');
        $q = ReportExport::where('user_id', $this->user()->id)->orderByDesc('created_at');

        return $this->paginate($q, ReportExportResource::class, $request);
    }

    public function store(StoreExportRequest $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('reports.export');
        $v = $request->validated();
        $filters = array_filter($v['filters'] ?? [], fn ($x) => $x !== null && $x !== '');
        if (! empty($filters['organisationId']) && ! $scope->orgAllowed($filters['organisationId'])) {
            throw ApiException::validation(['filters.organisationId' => 'You cannot export data for this organisation.']);
        }

        [$header, $rows] = $this->build($v['reportType'], $filters);
        $fh = fopen('php://temp', 'w+');
        fputcsv($fh, $header, ',', '"', '');
        foreach ($rows as $r) {
            fputcsv($fh, array_map(fn ($c) => $this->safeCell($c), $r), ',', '"', '');
        }
        rewind($fh);
        $csv = stream_get_contents($fh);
        fclose($fh);

        $path = 'exports/'.Str::random(40).'.csv';
        Storage::disk('local')->put($path, $csv);
        $export = ReportExport::create([
            'user_id' => $this->user()->id,
            'report_type' => $v['reportType'],
            'purpose' => $v['purpose'],
            'filters' => $filters,
            'status' => 'ready',
            'disk' => 'local',
            'path' => $path,
            'row_count' => count($rows),
            'sha256' => hash('sha256', $csv),
            'expires_at' => now()->addMinutes(self::DOWNLOAD_WINDOW_MINUTES),
        ]);
        Audit::record('export.created', $export, [
            'reportType' => $export->report_type, 'purpose' => $export->purpose, 'filters' => $filters, 'rowCount' => $export->row_count,
        ], null, $filters['organisationId'] ?? ($scope->orgIds[0] ?? null));

        return $this->item(new ReportExportResource($export), 201);
    }

    public function download(string $id): StreamedResponse
    {
        $scope = $this->scope();
        $scope->require('reports.export');
        $export = ReportExport::where('user_id', $this->user()->id)->whereKey($id)
            ->firstOr(fn () => throw ApiException::notFound('Export not found.'));
        if ($export->expires_at->isPast()) {
            throw ApiException::businessRule('This export link has expired. Create a new export.');
        }
        $export->forceFill(['downloaded_at' => now(), 'download_count' => $export->download_count + 1])->save();
        Audit::record('export.downloaded', $export, ['reportType' => $export->report_type]);

        return Storage::disk($export->disk)->download($export->path, "bodaconnect-{$export->report_type}-".$export->created_at->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    /** Neutralise spreadsheet formula injection. */
    private function safeCell($v): string
    {
        $s = (string) $v;

        return preg_match('/^[=+\-@\t\r]/', $s) ? "'".$s : $s;
    }

    private function build(string $type, array $f): array
    {
        $scope = $this->scope();
        $people = $scope->people(Person::query())->where('profile_status', '!=', 'archived')
            ->when($f['organisationId'] ?? null, fn ($q, $o) => $q->whereHas('activeOrganisationMemberships', fn ($m) => $m->where('organisation_id', $o)))
            ->when($f['groupId'] ?? null, fn ($q, $g) => $q->whereHas('activeGroupMemberships', fn ($m) => $m->where('group_id', $g)));

        return match ($type) {
            'rider_roster' => [self::TYPES[$type]['fields'], $people
                ->when($f['status'] ?? null, fn ($q, $s) => $q->where('profile_status', $s))
                ->with(['activeOrganisationMemberships.organisation', 'activeGroupMemberships.group', 'activeGroupMemberships.parkingPoint'])
                ->orderBy('system_id')->get()->map(fn (Person $p) => [
                    $p->system_id, $p->legal_name, $p->preferred_name, $p->phoneMasked(),
                    $p->activeOrganisationMemberships->first()?->organisation?->name,
                    $p->activeGroupMemberships->first()?->group?->name,
                    $p->activeGroupMemberships->first()?->parkingPoint?->name,
                    $p->profile_status, $p->created_at?->toIso8601ZuluString(),
                ])->all()],
            'verification_status' => [self::TYPES[$type]['fields'], VerificationCase::whereIn('person_id', $people->select('people.id'))
                ->when($f['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
                ->with('person')->orderBy('submitted_at')->get()->map(fn ($c) => [
                    $c->person?->system_id, $c->person?->legal_name, $c->verification_type, $c->status,
                    $c->submitted_at?->toIso8601ZuluString(), $c->decided_at?->toIso8601ZuluString(), $c->reason_code,
                ])->all()],
            'group_coverage' => [self::TYPES[$type]['fields'], $scope->groups(Group::query())
                ->when($f['organisationId'] ?? null, fn ($q, $o) => $q->where('organisation_id', $o))
                ->when($f['groupId'] ?? null, fn ($q, $g) => $q->whereKey($g))
                ->with('organisation')->withCount(['activeMemberships', 'parkingPoints',
                    'activeMemberships as verified_members' => fn ($m) => $m->whereHas('person', fn ($p) => $p->where('profile_status', 'verified'))])
                ->orderBy('name')->get()->map(fn ($g) => [
                    $g->name, $g->code, $g->organisation?->name, $g->active_memberships_count, $g->verified_members,
                    $g->leader_person_id ? 'yes' : 'no', $g->parking_points_count,
                ])->all()],
        };
    }
}
