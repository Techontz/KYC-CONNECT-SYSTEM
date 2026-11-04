<?php

namespace App\Support;

/** Role -> permission map. Scope (which rows) is handled separately by App\Support\Scope. */
class Permissions
{
    public const ROLES = ['platform_admin', 'verifier', 'field_agent', 'association_admin', 'group_leader', 'rider', 'owner'];

    public const PRIVILEGED_ROLES = ['platform_admin', 'verifier', 'association_admin'];

    public const ROLE_LABELS = [
        'platform_admin' => 'BodaConnect platform administrator',
        'verifier' => 'BodaConnect verifier',
        'field_agent' => 'BodaConnect field agent',
        'association_admin' => 'UMAPIDO association administrator',
        'group_leader' => 'Group / parking-point leader',
        'rider' => 'Rider',
        'owner' => 'Motorcycle/bajaji owner',
    ];

    public const ALL = [
        'riders.view', 'riders.create', 'riders.update', 'riders.submit', 'riders.view_sensitive', 'riders.edit_protected',
        'vehicles.view', 'vehicles.create', 'vehicles.manage_relationships',
        'organisations.view', 'organisations.create', 'groups.manage', 'groups.view_members', 'parking_points.manage', 'memberships.manage',
        'verification.view', 'verification.assign', 'verification.decide',
        'duplicates.view', 'duplicates.resolve',
        'dashboard.view', 'reports.view', 'reports.export',
        'documents.upload', 'documents.download',
        'privacy.disclosures.manage', 'consents.withdraw',
        'support.view', 'support.create', 'support.resolve',
        'notifications.announce',
        'users.view', 'users.manage', 'roles.manage', 'audit.view',
    ];

    public static function forRole(string $role): array
    {
        return match ($role) {
            'platform_admin' => self::ALL,
            'verifier' => [
                'riders.view', 'riders.view_sensitive', 'riders.edit_protected', 'vehicles.view', 'organisations.view',
                'groups.view_members', 'verification.view', 'verification.assign', 'verification.decide',
                'duplicates.view', 'duplicates.resolve', 'dashboard.view', 'documents.upload', 'documents.download',
                'support.view', 'support.create', 'support.resolve',
            ],
            'field_agent' => [
                'riders.view', 'riders.create', 'riders.update', 'riders.submit', 'vehicles.view', 'vehicles.create',
                'vehicles.manage_relationships', 'organisations.view', 'groups.view_members', 'memberships.manage',
                'verification.view', 'duplicates.view', 'dashboard.view', 'documents.upload', 'documents.download',
                'consents.withdraw', 'support.view', 'support.create',
            ],
            'association_admin' => [
                'riders.view', 'riders.create', 'riders.update', 'riders.submit', 'vehicles.view', 'vehicles.create',
                'vehicles.manage_relationships', 'organisations.view', 'groups.manage', 'groups.view_members',
                'parking_points.manage', 'memberships.manage', 'verification.view', 'duplicates.view', 'dashboard.view',
                'reports.view', 'reports.export', 'documents.upload', 'documents.download', 'consents.withdraw',
                'support.view', 'support.create', 'support.resolve', 'notifications.announce', 'users.view', 'users.manage',
                'roles.manage',
            ],
            'group_leader' => ['riders.view', 'organisations.view', 'groups.view_members', 'dashboard.view', 'support.view', 'support.create'],
            'rider' => ['riders.view', 'riders.update', 'documents.upload', 'documents.download', 'consents.withdraw', 'support.view', 'support.create', 'vehicles.view'],
            'owner' => ['riders.view', 'vehicles.view', 'support.view', 'support.create'],
            default => [],
        };
    }
}
