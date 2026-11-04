<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResolveDuplicateRequest;
use App\Http\Resources\DuplicateFlagResource;
use App\Models\DuplicateFlag;
use App\Support\ApiException;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DuplicateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('duplicates.view');
        $q = $scope->viaPerson(DuplicateFlag::query())->with(['person', 'matchedPerson', 'matchedVehicle'])
            ->where('status', $request->query('status', 'open'))
            ->orderByDesc('created_at');

        return $this->paginate($q, DuplicateFlagResource::class, $request);
    }

    public function resolve(ResolveDuplicateRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('duplicates.resolve');
        $flag = $scope->viaPerson(DuplicateFlag::query())->whereKey($id)->firstOr(fn () => throw ApiException::notFound('Duplicate flag not found.'));
        if ($flag->status !== 'open') {
            throw ApiException::businessRule('This flag has already been resolved.');
        }
        // Resolution records a human decision only; records are never merged automatically.
        $flag->update([
            'status' => $request->input('resolution'),
            'notes' => $request->input('notes'),
            'resolved_by_user_id' => $this->user()->id,
            'resolved_at' => now(),
        ]);
        Audit::record('duplicate.resolved', $flag, ['resolution' => $flag->status, 'reason' => $flag->reason], null, null, $flag->person_id);

        return $this->item(new DuplicateFlagResource($flag->load(['person', 'matchedPerson', 'matchedVehicle'])));
    }
}
