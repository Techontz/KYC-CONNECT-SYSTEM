<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Core identity tables: users, tokens, organisations, people and registry structure.
 * All primary keys are UUIDs (HasUuids on the models).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone_e164', 20)->unique();
            $table->string('display_name')->nullable();
            $table->uuid('person_id')->nullable()->index();
            $table->string('status', 20)->default('active')->index(); // active | disabled
            $table->timestamp('disabled_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('organisations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->string('type', 20)->index(); // platform | association | partner
            $table->string('region')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('counters', function (Blueprint $table) {
            $table->string('key', 50)->primary();
            $table->unsignedBigInteger('value')->default(0);
            $table->timestamps();
        });

        Schema::create('people', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('system_id', 20)->unique();
            $table->string('legal_name');
            $table->string('legal_name_normalised')->index();
            $table->string('preferred_name')->nullable();
            $table->string('phone_e164', 20)->nullable()->index();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();
            $table->text('identity_reference')->nullable(); // encrypted cast
            $table->char('identity_reference_hash', 64)->nullable()->index(); // sha256 for duplicate matching
            $table->string('profile_status', 30)->default('draft')->index();
            $table->string('capture_method', 30)->default('assisted_registration');
            $table->string('privacy_notice_version', 20)->nullable();
            $table->unsignedTinyInteger('completeness_percent')->default(0);
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('person_id')->references('id')->on('people')->nullOnDelete();
        });

        Schema::create('organisation_memberships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('membership_number', 40)->nullable();
            $table->string('status', 20)->default('active'); // active | ended
            $table->string('verification_status', 20)->default('pending');
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->timestamps();
            $table->index(['organisation_id', 'status']);
            $table->index(['person_id', 'status']);
        });

        // NB: `groups` is a reserved word in MySQL 8; Laravel's grammar always back-quotes identifiers.
        Schema::create('groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 20);
            $table->foreignUuid('leader_person_id')->nullable()->constrained('people')->nullOnDelete();
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->unique(['organisation_id', 'code']);
        });

        Schema::create('parking_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('group_id')->nullable()->constrained('groups')->nullOnDelete();
            $table->string('name');
            $table->string('ward')->index();
            $table->string('area')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('group_memberships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->foreignUuid('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignUuid('parking_point_id')->nullable()->constrained('parking_points')->nullOnDelete();
            $table->string('role', 20)->default('member'); // member | leader
            $table->string('status', 20)->default('active');
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->timestamps();
            $table->index(['group_id', 'status']);
            $table->index(['person_id', 'status']);
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('vehicle_type', 20); // motorcycle | bajaji
            $table->string('registration_number', 30);
            $table->string('registration_number_normalised', 30)->unique();
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->string('colour')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->nullOnDelete();
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('vehicle_relationships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignUuid('person_id')->constrained('people')->cascadeOnDelete();
            $table->string('relationship_type', 20); // owner | operator | keeper
            $table->string('verification_status', 20)->default('pending');
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['vehicle_id', 'relationship_type', 'end_at']);
            $table->index(['person_id', 'end_at']);
        });
    }

    public function down(): void
    {
        foreach (['vehicle_relationships', 'vehicles', 'group_memberships', 'parking_points', 'groups',
            'organisation_memberships'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropForeign(['person_id']));
        foreach (['people', 'counters', 'organisations', 'personal_access_tokens', 'users'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
