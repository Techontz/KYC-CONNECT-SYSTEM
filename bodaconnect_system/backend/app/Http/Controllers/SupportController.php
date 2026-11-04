<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResolveSupportRequest;
use App\Http\Requests\StoreSupportRequest;
use App\Http\Resources\SupportRequestResource;
use App\Models\InAppNotification;
use App\Models\Person;
use App\Models\SupportRequest;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Completeness;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupportController extends Controller
{
    public const CORRECTION_FIELDS = [
        'legalName' => 'legal_name', 'preferredName' => 'preferred_name', 'dateOfBirth' => 'date_of_birth',
        'gender' => 'gender', 'identityReference' => 'identity_reference', 'phoneNumber' => 'phone_e164',
    ];

    public function index(Request $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('support.view');
        $q = $scope->supportRequests(SupportRequest::query())->with(['subject', 'requestedBy.person', 'resolvedBy.person'])->orderByDesc('created_at');
        if ($s = $request->query('status')) {
            $q->whereIn('status', explode(',', $s));
        }
        if ($c = $request->query('category')) {
            $q->where('category', $c);
        }

        return $this->paginate($q, SupportRequestResource::class, $request);
    }

    public function store(StoreSupportRequest $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('support.create');
        $v = $request->validated();
        $personId = $v['subjectPersonId'] ?? $scope->personId;
        $orgId = null;
        if ($personId) {
            $person = $scope->findPerson($personId);
            $orgId = $person->activeOrganisationMemberships()->value('organisation_id');
        }
        $sr = SupportRequest::create([
            'category' => $v['category'],
            'status' => 'open',
            'description' => $v['description'],
            'subject_person_id' => $personId,
            'organisation_id' => $orgId ?? ($scope->orgIds[0] ?? null),
            'requested_by_user_id' => $this->user()->id,
        ]);
        Audit::record('support.created', $sr, ['category' => $sr->category], null, $sr->organisation_id, $personId);

        return $this->item(new SupportRequestResource($sr->load(['subject', 'requestedBy'])), 201);
    }

    public function resolve(ResolveSupportRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('support.resolve');
        $sr = $scope->supportRequests(SupportRequest::query())->whereKey($id)->firstOr(fn () => throw ApiException::notFound('Support request not found.'));
        if (in_array($sr->status, ['resolved', 'rejected'], true)) {
            throw ApiException::businessRule('This request is already closed.');
        }
        $status = $request->input('status');
        $applied = false;

        DB::transaction(function () use ($sr, $status, $request, $scope, &$applied) {
            if ($sr->category === 'correction' && $status === 'resolved' && $sr->field && $sr->subject_person_id) {
                $col = self::CORRECTION_FIELDS[$sr->field] ?? null;
                if (! $col) {
                    throw ApiException::businessRule('Unknown correction field.');
                }
                if (in_array($sr->field, RiderController::PROTECTED_FIELDS, true) && ! $scope->can('riders.edit_protected')) {
                    throw ApiException::businessRule('Only a verifier or platform administrator can approve changes to '.$sr->field.'.');
                }
                $person = Person::findOrFail($sr->subject_person_id);
                $value = $sr->proposed_value;
                if ($sr->field === 'phoneNumber') {
                    $value = Phone::normalise($value) ?? throw ApiException::businessRule('The proposed phone number is invalid.');
                    if (Person::where('phone_e164', $value)->whereKeyNot($person->id)->exists()) {
                        throw ApiException::conflict('Another rider already uses this phone number.');
                    }
                } elseif ($sr->field === 'identityReference') {
                    $value = strtoupper(trim($value));
                }
                $person->{$col} = $value;
                $person->save();
                Completeness::refresh($person);
                $applied = true;
                Audit::record('rider.updated', $person, ['fields' => [$sr->field], 'via' => 'correction_request'], null, $sr->organisation_id, $person->id);
            }
            $sr->update([
                'status' => $status,
                'resolution_summary' => $request->input('resolutionSummary'),
                'resolved_by_user_id' => $this->user()->id,
                'resolved_at' => now(),
            ]);
        });
        Audit::record($sr->category === 'correction' ? 'correction.resolved' : 'support.resolved', $sr, [
            'status' => $status, 'field' => $sr->field, 'applied' => $applied,
        ], null, $sr->organisation_id, $sr->subject_person_id);

        if ($sr->requested_by_user_id && $sr->requested_by_user_id !== $this->user()->id) {
            InAppNotification::create([
                'user_id' => $sr->requested_by_user_id,
                'type' => 'support_update',
                'title' => $status === 'resolved' ? 'Request resolved' : 'Request closed',
                'body' => (string) $request->input('resolutionSummary'),
                'data' => ['supportRequestId' => $sr->id],
            ]);
        }

        return $this->item(new SupportRequestResource($sr->fresh()->load(['subject', 'requestedBy', 'resolvedBy'])));
    }
}
