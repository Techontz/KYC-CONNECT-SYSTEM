<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignCaseRequest;
use App\Http\Requests\DecisionRequest;
use App\Http\Resources\VerificationCaseResource;
use App\Models\Document;
use App\Models\InAppNotification;
use App\Models\Person;
use App\Models\User;
use App\Models\VerificationCase;
use App\Models\VerificationDecision;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Scope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VerificationController extends Controller
{
    private function findCase(string $id): VerificationCase
    {
        return $this->scope()->viaPerson(VerificationCase::query())->whereKey($id)
            ->firstOr(fn () => throw ApiException::notFound('Verification case not found.'));
    }

    public function index(Request $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('verification.view');
        $q = $scope->viaPerson(VerificationCase::query())->with(['person', 'submittedBy.person', 'assignedTo.person', 'decidedBy.person']);
        if ($s = $request->query('status')) {
            $q->whereIn('status', explode(',', $s));
        }
        if ($t = $request->query('verificationType')) {
            $q->where('verification_type', $t);
        }
        if ($request->query('assignedTo') === 'me') {
            $q->where('assigned_to_user_id', $this->user()->id);
        }
        if ($p = $request->query('personId')) {
            $q->where('person_id', $p);
        }
        $q->orderByRaw("FIELD(status, 'submitted', 'under_review', 'correction_required', 'verified', 'rejected')")->orderBy('submitted_at');

        return $this->paginate($q, VerificationCaseResource::class, $request);
    }

    public function show(string $id): JsonResponse
    {
        $this->scope()->require('verification.view');
        $case = $this->findCase($id)->load(['person', 'submittedBy.person', 'assignedTo.person', 'decidedBy.person', 'decisions.decidedBy.person']);
        $evidence = Document::where('person_id', $case->person_id)
            ->where(fn ($q) => $q->where('verification_case_id', $case->id)->orWhereNull('verification_case_id'))
            ->orderByDesc('created_at')->get();
        $case->setRelation('evidence', $evidence);

        return $this->item(new VerificationCaseResource($case));
    }

    public function assign(AssignCaseRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('verification.assign');
        $case = $this->findCase($id);
        if (! in_array($case->status, ['submitted', 'under_review'], true)) {
            throw ApiException::businessRule('Only open cases can be assigned.');
        }
        $assignee = $this->user();
        if ($uid = $request->input('userId')) {
            $assignee = User::where('status', 'active')->find($uid);
            if (! $assignee || ! Scope::for($assignee)->can('verification.decide')) {
                throw ApiException::validation(['userId' => 'Select an active verifier.']);
            }
        }
        DB::transaction(function () use ($case, $assignee) {
            $case->update(['assigned_to_user_id' => $assignee->id, 'status' => 'under_review']);
            Person::whereKey($case->person_id)->where('profile_status', 'submitted')->update(['profile_status' => 'under_review']);
        });
        Audit::record('verification.assigned', $case, ['assignedTo' => $assignee->id, 'verificationType' => $case->verification_type], null, null, $case->person_id);

        return $this->item(new VerificationCaseResource($case->fresh()->load(['person', 'submittedBy.person', 'assignedTo.person'])));
    }

    public function decide(DecisionRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('verification.decide');
        $case = $this->findCase($id);
        $user = $this->user();
        $v = $request->validated();

        // AC-07 separation of duties: the person who submitted the record cannot decide it,
        // nor can anyone decide a case about themselves.
        if ($case->submitted_by_user_id === $user->id || ($user->person_id && $user->person_id === $case->person_id)) {
            throw ApiException::businessRule('Separation of duties: you cannot decide a case you submitted. Ask another verifier.');
        }
        if (! in_array($case->status, ['submitted', 'under_review'], true)) {
            throw ApiException::businessRule('This case has already been decided.');
        }

        DB::transaction(function () use ($case, $user, $v) {
            VerificationDecision::create([
                'verification_case_id' => $case->id,
                'decided_by_user_id' => $user->id,
                'outcome' => $v['outcome'],
                'method' => $v['method'],
                'reason_code' => $v['reasonCode'],
                'notes' => $v['notes'] ?? null,
            ]);
            $case->update([
                'status' => $v['outcome'],
                'decided_by_user_id' => $user->id,
                'assigned_to_user_id' => $case->assigned_to_user_id ?? $user->id,
                'method' => $v['method'],
                'reason_code' => $v['reasonCode'],
                'notes' => $v['notes'] ?? null,
                'decided_at' => now(),
            ]);
            self::recomputePersonStatus($case->person);
        });

        Audit::record('verification.decided', $case, [
            'outcome' => $v['outcome'], 'method' => $v['method'], 'reasonCode' => $v['reasonCode'], 'verificationType' => $case->verification_type,
        ], null, null, $case->person_id);

        if ($riderUser = User::where('person_id', $case->person_id)->first()) {
            InAppNotification::create([
                'user_id' => $riderUser->id,
                'type' => 'verification_decision',
                'title' => 'Verification update',
                'body' => match ($v['outcome']) {
                    'verified' => "Your {$case->verification_type} check has been verified.",
                    'correction_required' => "Your {$case->verification_type} check needs a correction. Please contact your field agent.",
                    default => "Your {$case->verification_type} check was not approved.",
                },
                'data' => ['verificationCaseId' => $case->id, 'outcome' => $v['outcome']],
            ]);
        }

        return $this->item(new VerificationCaseResource($case->fresh()->load(['person', 'submittedBy.person', 'assignedTo.person', 'decidedBy.person', 'decisions.decidedBy.person'])));
    }

    /**
     * Person status follows the latest case of each type: any rejected -> rejected; any correction ->
     * correction_required; all verified -> verified; otherwise under review.
     */
    public static function recomputePersonStatus(Person $person): void
    {
        $latest = $person->verificationCases()->orderBy('created_at')->get()->groupBy('verification_type')->map->last();
        if ($latest->isEmpty()) {
            return;
        }
        $statuses = $latest->pluck('status');
        $new = match (true) {
            $statuses->contains('rejected') => 'rejected',
            $statuses->contains('correction_required') => 'correction_required',
            $statuses->every(fn ($s) => $s === 'verified') => 'verified',
            default => 'under_review',
        };
        $person->update([
            'profile_status' => $new,
            'verified_at' => $new === 'verified' ? now() : null,
        ]);
    }
}
