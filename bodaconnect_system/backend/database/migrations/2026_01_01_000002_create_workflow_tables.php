<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Verification, documents, privacy, support, audit, auth support and export tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->string('verification_type', 20); // phone | identity | vehicle | membership
            $table->string('status', 30)->default('submitted')->index();
            $table->foreignUuid('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('decided_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('method', 40)->nullable();
            $table->string('reason_code', 60)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->index(['person_id', 'verification_type']);
        });

        Schema::create('verification_decisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('verification_case_id')->constrained('verification_cases')->cascadeOnDelete();
            $table->foreignUuid('decided_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('outcome', 30);
            $table->string('method', 40);
            $table->string('reason_code', 60);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('verification_case_id')->nullable()->constrained('verification_cases')->nullOnDelete();
            $table->string('document_type', 40);
            $table->string('disk', 20)->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedInteger('size_bytes');
            $table->char('sha256', 64);
            $table->foreignUuid('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('privacy_notices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('version', 20);
            $table->string('language', 5);
            $table->string('title');
            $table->longText('content');
            $table->boolean('is_active')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->unique(['version', 'language']);
        });

        Schema::create('consent_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('privacy_notice_id')->nullable()->constrained('privacy_notices')->nullOnDelete();
            $table->string('notice_version', 20)->nullable();
            $table->string('purpose', 60);
            $table->boolean('granted');
            $table->string('capture_method', 30)->nullable();
            $table->foreignUuid('captured_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamps();
            $table->index(['person_id', 'purpose']);
        });

        Schema::create('data_disclosures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('subject_person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('recipient_organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->text('purpose');
            $table->json('data_categories');
            $table->string('legal_basis');
            $table->timestamp('expiry_at')->nullable();
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('service_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->nullOnDelete();
            $table->string('service_type', 60);
            $table->string('status', 20)->default('open');
            $table->json('payload')->nullable();
            $table->foreignUuid('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at']);
        });

        Schema::create('support_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('category', 20); // correction | help | complaint
            $table->string('status', 20)->default('open')->index();
            $table->text('description');
            $table->foreignUuid('subject_person_id')->nullable()->constrained('people')->nullOnDelete();
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->nullOnDelete();
            $table->foreignUuid('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('field', 40)->nullable();
            $table->text('proposed_value')->nullable(); // encrypted cast
            $table->text('reason')->nullable();
            $table->text('resolution_summary')->nullable();
            $table->foreignUuid('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 60)->index();
            $table->string('entity_type', 40)->nullable();
            $table->uuid('entity_id')->nullable();
            $table->uuid('organisation_id')->nullable()->index();
            $table->uuid('subject_person_id')->nullable()->index();
            $table->string('request_id', 64)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('role_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 30);
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('group_id')->nullable()->constrained('groups')->cascadeOnDelete();
            $table->foreignUuid('granted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignUuid('revoked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'revoked_at']);
        });

        Schema::create('duplicate_flags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('matched_person_id')->nullable()->constrained('people')->nullOnDelete();
            $table->foreignUuid('matched_vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->string('reason', 20); // phone | identity | plate | name
            $table->string('status', 30)->default('open')->index();
            $table->text('notes')->nullable();
            $table->foreignUuid('raised_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('otp_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone_e164', 20)->index();
            $table->char('code_hash', 64); // HMAC-SHA256, never the plain code
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        Schema::create('report_exports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('report_type', 40);
            $table->text('purpose');
            $table->json('filters')->nullable();
            $table->string('status', 20)->default('ready');
            $table->string('disk', 20)->default('local');
            $table->string('path')->nullable();
            $table->unsignedInteger('row_count')->default(0);
            $table->char('sha256', 64)->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('downloaded_at')->nullable();
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamps();
        });

        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('key', 100);
            $table->string('method', 10);
            $table->string('path');
            $table->char('request_hash', 64);
            $table->unsignedSmallInteger('response_status');
            $table->longText('response_body');
            $table->timestamp('expires_at')->index();
            $table->timestamps();
            $table->unique(['user_id', 'key']);
        });

        // audit_events is append-only: block UPDATE/DELETE at the database level too.
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared("CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_events is append-only'");
            DB::unprepared("CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_events is append-only'");
        }
    }

    public function down(): void
    {
        foreach (['idempotency_keys', 'report_exports', 'otp_codes', 'duplicate_flags', 'role_assignments',
            'audit_events', 'support_requests', 'notifications', 'service_requests', 'data_disclosures',
            'consent_records', 'privacy_notices', 'documents', 'verification_decisions', 'verification_cases'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
