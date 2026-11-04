<?php

namespace App\Http\Controllers;

use App\Http\Requests\EndRequest;
use App\Http\Requests\StoreRelationshipRequest;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Resources\VehicleRelationshipResource;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use App\Models\VehicleRelationship;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Completeness;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('vehicles.view');
        $q = $scope->vehicles(Vehicle::query())->with(['relationships' => fn ($r) => $r->whereNull('end_at')->with('person')]);
        if ($term = trim((string) $request->query('q'))) {
            $norm = Vehicle::normalisePlate($term);
            $q->where(fn ($w) => $w->where('registration_number_normalised', 'like', "%{$norm}%")
                ->orWhere('make', 'like', "%{$term}%")->orWhere('model', 'like', "%{$term}%"));
        }
        if ($t = $request->query('vehicleType')) {
            $q->where('vehicle_type', $t);
        }
        if ($s = $request->query('status')) {
            $q->where('status', $s);
        }

        return $this->paginate($q->orderBy('registration_number_normalised'), VehicleResource::class, $request);
    }

    public function store(StoreVehicleRequest $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('vehicles.create');
        $v = $request->validated();
        $orgId = $v['organisationId'] ?? ($scope->orgIds[0] ?? null);
        if ($orgId && ! $scope->orgAllowed($orgId)) {
            throw ApiException::validation(['organisationId' => 'You cannot register vehicles for this organisation.']);
        }
        $norm = Vehicle::normalisePlate($v['registrationNumber']);
        if ($existing = Vehicle::where('registration_number_normalised', $norm)->first()) {
            throw ApiException::conflict('A vehicle with this registration number already exists.', [
                'matches' => [['id' => $existing->id, 'registrationNumber' => $existing->registration_number, 'reason' => 'plate']],
            ]);
        }
        $vehicle = Vehicle::create([
            'vehicle_type' => $v['vehicleType'],
            'registration_number' => strtoupper(trim($v['registrationNumber'])),
            'registration_number_normalised' => $norm,
            'make' => $v['make'] ?? null,
            'model' => $v['model'] ?? null,
            'colour' => $v['colour'] ?? null,
            'organisation_id' => $orgId,
            'created_by_user_id' => $this->user()->id,
        ]);
        Audit::record('vehicle.created', $vehicle, ['registrationNumber' => $vehicle->registration_number], null, $orgId);

        return $this->item(new VehicleResource($vehicle->load('relationships')), 201);
    }

    public function show(string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('vehicles.view');
        $vehicle = $scope->vehicles(Vehicle::query())->whereKey($id)
            ->with(['relationships' => fn ($r) => $r->with('person')->orderByDesc('start_at')])
            ->firstOr(fn () => throw ApiException::notFound('Vehicle not found.'));

        return $this->item(new VehicleResource($vehicle));
    }

    public function addRelationship(StoreRelationshipRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('vehicles.manage_relationships');
        $vehicle = $scope->vehicles(Vehicle::query())->whereKey($id)->firstOr(fn () => throw ApiException::notFound('Vehicle not found.'));
        $v = $request->validated();
        $person = $scope->findPerson($v['personId']);
        $start = isset($v['startAt']) ? Carbon::parse($v['startAt']) : now();

        $rel = DB::transaction(function () use ($vehicle, $person, $v, $start) {
            // A vehicle has one active relationship per type: end the previous one (history kept).
            $previous = $vehicle->relationships()->where('relationship_type', $v['relationshipType'])->whereNull('end_at')->get();
            foreach ($previous as $p) {
                $p->update(['end_at' => $start]);
                Completeness::refresh($p->person);
            }

            return VehicleRelationship::create([
                'vehicle_id' => $vehicle->id,
                'person_id' => $person->id,
                'relationship_type' => $v['relationshipType'],
                'start_at' => $start,
                'created_by_user_id' => $this->user()->id,
            ]);
        });
        Completeness::refresh($person);
        Audit::record('vehicle.relationship_added', $rel, ['relationshipType' => $rel->relationship_type], null, $vehicle->organisation_id, $person->id);

        return $this->item(new VehicleRelationshipResource($rel->load('person')), 201);
    }

    public function endRelationship(EndRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('vehicles.manage_relationships');
        $rel = VehicleRelationship::whereKey($id)->whereHas('vehicle', fn ($q) => $scope->vehicles($q))
            ->firstOr(fn () => throw ApiException::notFound('Relationship not found.'));
        if ($rel->end_at) {
            throw ApiException::businessRule('This relationship has already ended.');
        }
        $rel->update(['end_at' => $request->filled('endAt') ? Carbon::parse($request->input('endAt')) : now()]);
        Completeness::refresh($rel->person);
        Audit::record('vehicle.relationship_ended', $rel, [], null, null, $rel->person_id);

        return $this->item(new VehicleRelationshipResource($rel->load('person')));
    }
}
