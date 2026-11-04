<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

abstract class Controller
{
    protected function user(): User
    {
        return request()->user();
    }

    protected function scope(): Scope
    {
        return Scope::for($this->user());
    }

    /** Contract pagination: ?page&perPage (max 100) -> {data, meta:{page, perPage, total, lastPage}}. */
    protected function paginate(Builder $query, string $resource, Request $request, array $extraMeta = []): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->query('perPage', 25)));
        $page = max(1, (int) $request->query('page', 1));
        $p = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $resource::collection($p->items())->resolve($request),
            'meta' => array_merge([
                'page' => $p->currentPage(),
                'perPage' => $p->perPage(),
                'total' => $p->total(),
                'lastPage' => max(1, $p->lastPage()),
            ], $extraMeta),
        ]);
    }

    protected function item($resource, int $status = 200, array $extra = []): JsonResponse
    {
        return response()->json(array_merge(['data' => $resource instanceof JsonResource ? $resource->resolve(request()) : $resource], $extra), $status);
    }
}
