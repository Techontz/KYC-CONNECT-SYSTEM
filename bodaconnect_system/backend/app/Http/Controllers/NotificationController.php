<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnnouncementRequest;
use App\Http\Resources\NotificationResource;
use App\Models\InAppNotification;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Support\ApiException;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = InAppNotification::where('user_id', $this->user()->id)->orderByDesc('created_at');
        if ($request->boolean('unread')) {
            $q->whereNull('read_at');
        }

        return $this->paginate($q, NotificationResource::class, $request, [
            'unread' => InAppNotification::where('user_id', $this->user()->id)->whereNull('read_at')->count(),
        ]);
    }

    public function read(string $id): JsonResponse
    {
        $n = InAppNotification::where('user_id', $this->user()->id)->whereKey($id)
            ->firstOr(fn () => throw ApiException::notFound('Notification not found.'));
        if (! $n->read_at) {
            $n->update(['read_at' => now()]);
        }

        return $this->item(new NotificationResource($n));
    }

    public function announce(AnnouncementRequest $request): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('notifications.announce');
        $orgId = $request->input('organisationId') ?? ($scope->global ? null : ($scope->orgIds[0] ?? null));
        if ($orgId && ! $scope->orgAllowed($orgId)) {
            throw ApiException::validation(['organisationId' => 'You cannot send announcements to this organisation.']);
        }
        if (! $orgId && ! $scope->global) {
            throw ApiException::forbidden();
        }

        $users = User::where('status', 'active');
        if ($orgId) {
            $users->where(function ($w) use ($orgId) {
                $w->whereIn('id', RoleAssignment::whereNull('revoked_at')->where('organisation_id', $orgId)->select('user_id'))
                    ->orWhereIn('id', RoleAssignment::whereNull('revoked_at')->whereHas('group', fn ($g) => $g->where('organisation_id', $orgId))->select('user_id'))
                    ->orWhereHas('person.activeOrganisationMemberships', fn ($m) => $m->where('organisation_id', $orgId));
            });
        }
        $ids = $users->pluck('id');
        $now = now();
        foreach ($ids->chunk(500) as $chunk) {
            InAppNotification::insert($chunk->map(fn ($uid) => [
                'id' => (string) Str::uuid(),
                'user_id' => $uid,
                'type' => 'announcement',
                'title' => $request->input('title'),
                'body' => $request->input('body'),
                'data' => json_encode(['organisationId' => $orgId]),
                'created_at' => $now,
                'updated_at' => $now,
            ])->all());
        }
        Audit::record('announcement.sent', null, ['title' => $request->input('title'), 'recipients' => $ids->count()], null, $orgId);

        return response()->json(['data' => ['recipients' => $ids->count(), 'organisationId' => $orgId]], 201);
    }
}
