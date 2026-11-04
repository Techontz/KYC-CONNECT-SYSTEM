<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DuplicateController;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganisationController;
use App\Http\Controllers\PrivacyController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RiderController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\VerificationController;
use App\Support\ApiException;
use Illuminate\Support\Facades\Route;

// Prefix /api/v1 is configured in bootstrap/app.php.

Route::post('auth/otp/request', [AuthController::class, 'requestOtp'])->middleware('throttle:otp-request');
Route::post('auth/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp-verify');
Route::get('privacy/notices/active', [PrivacyController::class, 'activeNotice']);

Route::middleware(['auth:sanctum', 'throttle:api', 'idempotent'])->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::get('lookups', [LookupController::class, 'index']);

    // Riders
    Route::get('riders', [RiderController::class, 'index']);
    Route::post('riders', [RiderController::class, 'store']);
    Route::post('riders/duplicate-check', [RiderController::class, 'duplicateCheck']);
    Route::get('riders/{id}', [RiderController::class, 'show']);
    Route::patch('riders/{id}', [RiderController::class, 'update']);
    Route::post('riders/{id}/submit', [RiderController::class, 'submit']);
    Route::post('riders/{id}/correction-requests', [RiderController::class, 'correctionRequest']);
    Route::post('riders/{id}/documents', [DocumentController::class, 'store']);
    Route::get('riders/{id}/consents', [RiderController::class, 'consents']);
    Route::post('riders/{id}/consents/{consentId}/withdraw', [RiderController::class, 'withdrawConsent']);
    Route::get('documents/{id}/download', [DocumentController::class, 'download']);

    // Vehicles
    Route::get('vehicles', [VehicleController::class, 'index']);
    Route::post('vehicles', [VehicleController::class, 'store']);
    Route::get('vehicles/{id}', [VehicleController::class, 'show']);
    Route::post('vehicles/{id}/relationships', [VehicleController::class, 'addRelationship']);
    Route::post('vehicle-relationships/{id}/end', [VehicleController::class, 'endRelationship']);

    // Organisations / groups / parking points
    Route::get('organisations', [OrganisationController::class, 'index']);
    Route::post('organisations', [OrganisationController::class, 'store']);
    Route::get('organisations/{id}', [OrganisationController::class, 'show']);
    Route::get('organisations/{id}/groups', [OrganisationController::class, 'groups']);
    Route::post('organisations/{id}/groups', [OrganisationController::class, 'storeGroup']);
    Route::get('organisations/{id}/parking-points', [OrganisationController::class, 'parkingPoints']);
    Route::post('organisations/{id}/parking-points', [OrganisationController::class, 'storeParkingPoint']);
    Route::patch('groups/{id}', [OrganisationController::class, 'updateGroup']);
    Route::get('groups/{id}/members', [OrganisationController::class, 'members']);
    Route::post('groups/{id}/memberships', [OrganisationController::class, 'storeMembership']);
    Route::post('group-memberships/{id}/end', [OrganisationController::class, 'endMembership']);

    // Verification
    Route::get('verification-cases', [VerificationController::class, 'index']);
    Route::get('verification-cases/{id}', [VerificationController::class, 'show']);
    Route::post('verification-cases/{id}/assign', [VerificationController::class, 'assign']);
    Route::post('verification-cases/{id}/decision', [VerificationController::class, 'decide']);

    // Duplicates
    Route::get('duplicate-flags', [DuplicateController::class, 'index']);
    Route::post('duplicate-flags/{id}/resolve', [DuplicateController::class, 'resolve']);

    // Dashboard & reports
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('reports', [ReportController::class, 'types']);
    Route::get('reports/exports', [ReportController::class, 'index']);
    Route::post('reports/exports', [ReportController::class, 'store']);
    Route::get('reports/exports/{id}/download', [ReportController::class, 'download']);

    // Privacy
    Route::get('privacy/disclosures', [PrivacyController::class, 'disclosures']);
    Route::post('privacy/disclosures', [PrivacyController::class, 'storeDisclosure']);

    // Support
    Route::get('support-requests', [SupportController::class, 'index']);
    Route::post('support-requests', [SupportController::class, 'store']);
    Route::post('support-requests/{id}/resolve', [SupportController::class, 'resolve']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'read']);
    Route::post('announcements', [NotificationController::class, 'announce']);

    // Admin
    Route::get('users', [AdminController::class, 'users']);
    Route::post('users', [AdminController::class, 'storeUser']);
    Route::post('users/{id}/roles', [AdminController::class, 'grantRole']);
    Route::post('users/{id}/disable', [AdminController::class, 'disable']);
    Route::post('users/{id}/enable', [AdminController::class, 'enable']);
    Route::delete('role-assignments/{id}', [AdminController::class, 'revokeRole']);
    Route::get('audit-events', [AdminController::class, 'auditEvents']);
});

Route::fallback(fn () => throw ApiException::notFound('Endpoint not found.'));
